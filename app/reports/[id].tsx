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
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
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
              <MaterialCommunityIcons name="delete" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.label}>Kendra</Text>
            <Text style={styles.value}>{report.kendra?.kendra_name || 'Unknown'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>City</Text>
            <Text style={styles.value}>{report.kendra?.city?.city_name || 'Unknown'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Type</Text>
            <View style={[styles.typeBadge, report.kendra?.kendra_type === 'Yuvan' ? styles.yuvanBadge : styles.yuvtiBadge]}>
              <Text style={styles.typeBadgeText}>{report.kendra?.kendra_type || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Week Start Date</Text>
            <Text style={styles.value}>{formatDate(report.week_start_date)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Pushp Number</Text>
            <Text style={styles.value}>{report.pushp_no}</Text>
          </View>

          <View style={styles.attendanceSection}>
            <Text style={styles.sectionTitle}>Attendance</Text>
            <View style={styles.attendanceGrid}>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceLabel}>Yuva Kendra</Text>
                <Text style={styles.attendanceValue}>{report.yuva_kendra_attendance}</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceLabel}>Bhavferni</Text>
                <Text style={styles.attendanceValue}>{report.bhavferni_attendance}</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceLabel}>Pravachan</Text>
                <Text style={styles.attendanceValue}>{report.pravachan_attendance}</Text>
              </View>
            </View>
          </View>

          {report.description && (
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description}>{report.description}</Text>
          </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Created By</Text>
            <Text style={styles.value}>{report.creator?.name || report.creator?.email || 'Unknown'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Created At</Text>
            <Text style={styles.value}>{formatDate(report.created_at)}</Text>
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
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  yuvanBadge: {
    backgroundColor: '#dbeafe',
  },
  yuvtiBadge: {
    backgroundColor: '#fce7f3',
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  attendanceSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attendanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attendanceItem: {
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  attendanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
});

