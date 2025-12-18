import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { getReports, getCities, getKendras } from '../../services/databaseService';
import { WeeklyReport, City, Kendra, ReportFilters } from '../../types';
import { Colors } from '../../constants/Colors';
import { formatDate } from '../../utils/dateHelpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Dropdown from '../../components/Dropdown';
import { handleError } from '../../utils/errorHandler';

export default function ReportsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoize filtered reports for performance
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    // Search filter (client-side only for search) - use debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.kendra?.kendra_name?.toLowerCase().includes(query) ||
          report.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reports, debouncedSearchQuery]);

  const loadData = useCallback(async (reset = true) => {
    try {
      if (!user) return;

      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const pageSize = 20;
      const offset = currentPage * pageSize;

      // Load reports with pagination
      const result = await getReports(
        filters, 
        user.id, 
        user.role, 
        pageSize, 
        user.kendra_id,
        offset
      );

      if (reset) {
        setReports(result.data);
      } else {
        setReports(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
      setPage(currentPage + 1);

      // Load cities/kendras for admin (needed for filters)
      if (user.role === 'admin' && reset) {
        const [citiesData, kendrasData] = await Promise.all([
          getCities(),
          getKendras(),
        ]);
        setCities(citiesData);
        setKendras(kendrasData);
      }
    } catch (error) {
      handleError(error, 'Reports: loadData');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.role, user?.kendra_id, page, filters.kendraId, filters.cityId, filters.type, filters.dateFrom, filters.dateTo, filters.currentYear, filters.lastYear]);

  useEffect(() => {
    if (user?.id) {
      loadData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, filters.kendraId, filters.cityId, filters.type, filters.dateFrom, filters.dateTo, filters.currentYear, filters.lastYear]);

  // Refresh when screen comes into focus (e.g., after creating a report)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      }
    }, [user?.id, loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadData(false);
    }
  }, [loadingMore, hasMore, loading, loadData]);

  const renderReportItem = useCallback(({ item }: { item: WeeklyReport }) => {
    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => router.push(`/reports/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.reportHeader}>
          <View style={styles.reportTitleContainer}>
            <View style={styles.reportTitleRow}>
              <MaterialCommunityIcons 
                name="office-building" 
                size={18} 
                color={Colors.primary} 
                style={styles.headerIcon}
              />
              <Text style={styles.reportKendra}>{item.kendra?.kendra_name || 'Unknown Kendra'}</Text>
            </View>
            <View style={styles.reportMetaRow}>
              <MaterialCommunityIcons name="calendar" size={14} color={Colors.mutedForeground} />
              <Text style={styles.reportDate}>{formatDate(item.week_start_date)}</Text>
              {item.kendra?.city?.city_name && (
                <>
                  <Text style={styles.metaSeparator}>•</Text>
                  <MaterialCommunityIcons name="map-marker" size={14} color={Colors.mutedForeground} />
                  <Text style={styles.reportCity}>{item.kendra.city.city_name}</Text>
                </>
              )}
            </View>
          </View>
          {item.kendra?.kendra_type && (
            <View style={[styles.typeBadge, item.kendra.kendra_type === 'Yuvan' ? styles.yuvanBadge : styles.yuvtiBadge]}>
              <Text style={styles.typeBadgeText}>{item.kendra.kendra_type}</Text>
            </View>
          )}
        </View>

        <View style={styles.reportStats}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="account-group" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{item.yuva_kendra_attendance}</Text>
            <Text style={styles.statLabel}>Yuva</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.success + '15' }]}>
              <MaterialCommunityIcons name="account-multiple" size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{item.bhavferni_attendance}</Text>
            <Text style={styles.statLabel}>Bhavferni</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.warning + '15' }]}>
              <MaterialCommunityIcons name="microphone" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{item.pravachan_attendance}</Text>
            <Text style={styles.statLabel}>Pravachan</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.info + '15' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>{item.pushp_no}</Text>
            <Text style={styles.statLabel}>Pushp</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  // Skeleton loader component
  const renderSkeletonItem = () => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonDate} />
      </View>
      <View style={styles.reportStats}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonStatCard}>
            <View style={styles.skeletonStatIcon} />
            <View style={styles.skeletonStatValue} />
            <View style={styles.skeletonStatLabel} />
          </View>
        ))}
      </View>
      <View style={styles.skeletonFooter} />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="file-document-outline" size={64} color={Colors.mutedForeground} />
        <Text style={styles.emptyTitle}>No Reports Found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first report'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons name="filter" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/reports/create')}
        >
          <MaterialCommunityIcons name="plus" size={24} color={Colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal Dialog */}
      <Modal
        visible={showFilters && user?.role === 'admin'}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowFilters(false)}>
            <View style={styles.modalOverlayBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.filterContent}>
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>City</Text>
                  <Dropdown
                    options={[
                      { label: 'All Cities', value: '' },
                      ...cities.map((city) => ({
                        label: `${city.city_name} (${city.pin_code})`,
                        value: city.id,
                      })),
                    ]}
                    value={filters.cityId || ''}
                    onValueChange={(value) =>
                      setFilters({ ...filters, cityId: value || undefined })
                    }
                    placeholder="Select city"
                  />
                </View>

                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Kendra</Text>
                  <Dropdown
                    options={[
                      { label: 'All Kendras', value: '' },
                      ...kendras
                        .filter((k) => !filters.cityId || k.city_id === filters.cityId)
                        .map((kendra) => ({
                          label: `${kendra.kendra_name} (${kendra.kendra_type})`,
                          value: kendra.id,
                        })),
                    ]}
                    value={filters.kendraId || ''}
                    onValueChange={(value) =>
                      setFilters({ ...filters, kendraId: value || undefined })
                    }
                    placeholder="Select kendra"
                  />
                </View>

                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Type</Text>
                  <Dropdown
                    options={[
                      { label: 'All Types', value: '' },
                      { label: 'Yuvan', value: 'Yuvan' },
                      { label: 'Yuvti', value: 'Yuvti' },
                    ]}
                    value={filters.type || ''}
                    onValueChange={(value) =>
                      setFilters({ ...filters, type: (value ? value as 'Yuvan' | 'Yuvti' : undefined) })
                    }
                    placeholder="Select type"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setFilters({});
                      setShowFilters(false);
                    }}
                  >
                    <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.applyFiltersButton}
                    onPress={() => setShowFilters(false)}
                  >
                    <Text style={styles.applyFiltersText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {loading && reports.length === 0 ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={renderSkeletonItem}
          keyExtractor={(item) => `skeleton-${item}`}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filteredReports.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addButton: {
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  reportCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reportTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerIcon: {
    marginRight: 6,
  },
  reportKendra: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: -0.3,
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportDate: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginLeft: 2,
  },
  reportCity: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginLeft: 2,
  },
  metaSeparator: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginHorizontal: 4,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  yuvanBadge: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '30',
  },
  yuvtiBadge: {
    backgroundColor: '#fce7f3',
    borderColor: '#f9a8d4',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.mutedForeground,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.75,
    maxHeight: Dimensions.get('window').height * 0.75,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: -0.3,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  filterContent: {
    padding: 16,
  },
  filterRow: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalActions: {
    marginTop: 20,
    gap: 12,
  },
  clearFiltersButton: {
    padding: 14,
    backgroundColor: Colors.error,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  applyFiltersButton: {
    padding: 14,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoaderText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  skeletonTitle: {
    height: 16,
    width: '60%',
    backgroundColor: Colors.muted,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDate: {
    height: 12,
    width: '40%',
    backgroundColor: Colors.muted,
    borderRadius: 4,
  },
  skeletonStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  skeletonStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  skeletonStatValue: {
    height: 20,
    width: 40,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonStatLabel: {
    height: 10,
    width: 50,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  skeletonFooter: {
    height: 40,
    backgroundColor: Colors.muted,
    borderRadius: 8,
    marginTop: 12,
  },
});

