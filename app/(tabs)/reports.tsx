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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { getReports, getCities, getKendras } from '../../services/databaseService';
import { WeeklyReport, City, Kendra, ReportFilters } from '../../types';
import { Colors } from '../../constants/Colors';
import { formatDate } from '../../utils/dateHelpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { exportToPDF, exportToExcel } from '../../services/exportService';
import Dropdown from '../../components/Dropdown';

export default function ReportsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [exporting, setExporting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoize filtered reports for performance
  const filteredReports = useMemo(() => {
    console.log('Filtering reports. Total reports:', reports.length, 'Search query:', debouncedSearchQuery);
    let filtered = [...reports];

    // Search filter (client-side only for search) - use debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.kendra?.kendra_name?.toLowerCase().includes(query) ||
          report.description?.toLowerCase().includes(query)
      );
      console.log('After search filter:', filtered.length, 'reports');
    }

    console.log('Final filtered reports:', filtered.length);
    return filtered;
  }, [reports, debouncedSearchQuery]);

  const loadData = useCallback(async () => {
    try {
      if (!user) {
        console.log('No user found, skipping load');
        return;
      }

      setLoading(true);

      // Load reports with filters applied at database level
      // Limit to 100 reports initially for better performance
      // Pass kendra_id directly to avoid extra query for members
      console.log('Loading reports with filters:', JSON.stringify(filters, null, 2));
      console.log('User:', { id: user.id, role: user.role, kendra_id: user.kendra_id });
      const reportsData = await getReports(filters, user.id, user.role, 100, user.kendra_id);
      console.log('Reports loaded:', reportsData.length, 'reports');
      if (reportsData.length > 0) {
        console.log('First report sample:', JSON.stringify(reportsData[0], null, 2));
      }
      setReports(reportsData);

      // Load cities/kendras for admin (needed for filters)
      if (user.role === 'admin') {
        const [citiesData, kendrasData] = await Promise.all([
          getCities(),
          getKendras(),
        ]);
        setCities(citiesData);
        setKendras(kendrasData);
      }
    } catch (error: any) {
      console.error('Error loading reports:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', error?.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.role, user?.kendra_id, filters.kendraId, filters.cityId, filters.type, filters.dateFrom, filters.dateTo, filters.currentYear, filters.lastYear]);

  useEffect(() => {
    if (user?.id) {
      console.log('useEffect triggered - loading data');
      loadData();
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
    loadData();
  }, [loadData]);

  const handleExportPDF = async () => {
    if (filteredReports.length === 0) {
      Alert.alert('No Data', 'There are no reports to export');
      return;
    }

    setExporting(true);
    try {
      await exportToPDF(filteredReports);
    } catch (error: any) {
      Alert.alert('Export Error', error.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (filteredReports.length === 0) {
      Alert.alert('No Data', 'There are no reports to export');
      return;
    }

    setExporting(true);
    try {
      await exportToExcel(filteredReports);
    } catch (error: any) {
      Alert.alert('Export Error', error.message || 'Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  const renderReportItem = useCallback(({ item }: { item: WeeklyReport }) => {
    return (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => router.push(`/reports/${item.id}`)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleContainer}>
          <Text style={styles.reportKendra}>{item.kendra?.kendra_name || 'Unknown Kendra'}</Text>
          <Text style={styles.reportDate}>{formatDate(item.week_start_date)}</Text>
        </View>
        {item.kendra?.kendra_type && (
          <View style={[styles.typeBadge, item.kendra.kendra_type === 'Yuvan' ? styles.yuvanBadge : styles.yuvtiBadge]}>
            <Text style={styles.typeBadgeText}>{item.kendra.kendra_type}</Text>
          </View>
        )}
      </View>
      <View style={styles.reportStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Yuva</Text>
          <Text style={styles.statValue}>{item.yuva_kendra_attendance}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Bhavferni</Text>
          <Text style={styles.statValue}>{item.bhavferni_attendance}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pravachan</Text>
          <Text style={styles.statValue}>{item.pravachan_attendance}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pushp</Text>
          <Text style={styles.statValue}>{item.pushp_no}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.reportDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
    );
  }, [router]);

  // Show loading skeleton only on initial load
  const isInitialLoad = loading && reports.length === 0;

  if (isInitialLoad) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reports..."
              placeholderTextColor={Colors.textSecondary}
              editable={false}
            />
          </View>
          {user?.role === 'admin' && (
            <TouchableOpacity style={styles.filterButton} disabled>
              <MaterialCommunityIcons name="filter" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addButton} disabled>
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal Dialog */}
      <Modal
        visible={showFilters && user?.role === 'admin'}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilters(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filters</Text>
                  <TouchableOpacity onPress={() => setShowFilters(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
                          setFilters({ ...filters, type: value || undefined })
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {filteredReports.length > 0 && (
        <View style={styles.exportContainer}>
          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExportExcel}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-excel-box" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Excel</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredReports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredReports.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptyText}>Loading reports...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reports found</Text>
            </View>
          )
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 150, // Approximate item height
          offset: 150 * index,
          index,
        })}
      />
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportTitleContainer: {
    flex: 1,
  },
  reportKendra: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  yuvanBadge: {
    backgroundColor: '#dbeafe',
  },
  yuvtiBadge: {
    backgroundColor: '#fce7f3',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  reportDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  exportContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  modalScrollView: {
    flex: 1,
  },
  filterContent: {
    padding: 20,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

