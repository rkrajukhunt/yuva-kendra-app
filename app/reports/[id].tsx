import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { getReportById, deleteReport } from '../../services/databaseService';
import { WeeklyReport } from '../../types';
import { Colors } from '../../constants/Colors';
import { formatDate } from '../../utils/dateHelpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      if (!id) return;
      const reportData = await getReportById(id);
      setReport(reportData);
    } catch (error) {
      console.error('Error loading report:', error);
      Alert.alert('Error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!id) return;
              await deleteReport(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const canEdit = user && report && (user.role === 'admin' || user.id === report.created_by);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Report not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        {canEdit && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push(`/reports/create?id=${id}`)}
              style={styles.editButton}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <MaterialCommunityIcons name="delete" size={20} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <View style={styles.kendraInfo}>
              <View style={styles.kendraIconContainer}>
                <MaterialCommunityIcons name="office-building" size={24} color={Colors.primary} />
              </View>
              <View style={styles.kendraDetails}>
                <Text style={styles.kendraName}>{report.kendra?.kendra_name || 'Unknown Kendra'}</Text>
                <View style={styles.kendraMeta}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={Colors.mutedForeground} />
                  <Text style={styles.kendraCity}>{report.kendra?.city?.city_name || 'Unknown City'}</Text>
                  {report.kendra?.city?.pin_code && (
                    <>
                      <Text style={styles.metaSeparator}>•</Text>
                      <Text style={styles.pinCode}>{report.kendra.city.pin_code}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
            {report.kendra?.kendra_type && (
              <View style={[styles.typeBadge, report.kendra.kendra_type === 'Yuvan' ? styles.yuvanBadge : styles.yuvtiBadge]}>
                <Text style={styles.typeBadgeText}>{report.kendra.kendra_type}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Week Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <MaterialCommunityIcons name="calendar-range" size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Week Start Date</Text>
              <Text style={styles.infoValue}>{formatDate(report.week_start_date)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color={Colors.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Pushp Number</Text>
              <Text style={styles.infoValue}>{report.pushp_no}</Text>
            </View>
          </View>
        </View>

        {/* Attendance Card */}
        <View style={styles.attendanceCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-line" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Attendance</Text>
          </View>
          <View style={styles.attendanceGrid}>
            <View style={styles.attendanceCardItem}>
              <View style={[styles.attendanceIconContainer, { backgroundColor: Colors.primary + '15' }]}>
                <MaterialCommunityIcons name="account-group" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.attendanceValue}>{report.yuva_kendra_attendance}</Text>
              <Text style={styles.attendanceLabel}>Yuva Kendra</Text>
            </View>
            <View style={styles.attendanceCardItem}>
              <View style={[styles.attendanceIconContainer, { backgroundColor: Colors.success + '15' }]}>
                <MaterialCommunityIcons name="account-multiple" size={24} color={Colors.success} />
              </View>
              <Text style={styles.attendanceValue}>{report.bhavferni_attendance}</Text>
              <Text style={styles.attendanceLabel}>Bhavferni</Text>
            </View>
            <View style={styles.attendanceCardItem}>
              <View style={[styles.attendanceIconContainer, { backgroundColor: Colors.warning + '15' }]}>
                <MaterialCommunityIcons name="microphone" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.attendanceValue}>{report.pravachan_attendance}</Text>
              <Text style={styles.attendanceLabel}>Pravachan</Text>
            </View>
          </View>
        </View>

        {/* Description Card */}
        {report.description && (
          <View style={styles.descriptionCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="note-text" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>
        )}

        {/* Metadata Card */}
        <View style={styles.metadataCard}>
          <View style={styles.metadataRow}>
            <View style={styles.metadataIconContainer}>
              <MaterialCommunityIcons name="account" size={18} color={Colors.mutedForeground} />
            </View>
            <View style={styles.metadataContent}>
              <Text style={styles.metadataLabel}>Created By</Text>
              <Text style={styles.metadataValue}>{report.creator?.name || report.creator?.email || 'Unknown'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.metadataRow}>
            <View style={styles.metadataIconContainer}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={Colors.mutedForeground} />
            </View>
            <View style={styles.metadataContent}>
              <Text style={styles.metadataLabel}>Created At</Text>
              <Text style={styles.metadataValue}>{formatDate(report.created_at)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mutedForeground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: Colors.muted,
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: Colors.destructive + '15',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
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
  headerCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kendraInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  kendraIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kendraDetails: {
    flex: 1,
  },
  kendraName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  kendraMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kendraCity: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginLeft: 2,
  },
  pinCode: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  metaSeparator: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginHorizontal: 4,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.foreground,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
    marginLeft: 56,
  },
  attendanceCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
  },
  attendanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  attendanceCardItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderRadius: 8,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  attendanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  attendanceLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    fontWeight: '500',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.foreground,
  },
  descriptionCard: {
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
  descriptionText: {
    fontSize: 15,
    color: Colors.foreground,
    lineHeight: 24,
    marginTop: 8,
  },
  metadataCard: {
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
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metadataContent: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginBottom: 2,
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
    color: Colors.foreground,
    fontWeight: '600',
  },
});

