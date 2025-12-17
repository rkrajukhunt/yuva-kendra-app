import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { getKendras, getReportById, createReport, updateReport } from '../../services/databaseService';
import { Kendra, WeeklyReport } from '../../types';
import { Colors } from '../../constants/Colors';
import { validateReportData } from '../../utils/validation';
import { getWeekStartDate, isValidReportDate } from '../../utils/dateHelpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Dropdown from '../../components/Dropdown';

export default function CreateReportScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    kendra_id: '',
    week_start_date: getWeekStartDate(),
    yuva_attendance: '',
    bhavferni_attendance: '',
    pravachan_attendance: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [id, user]);

  const loadData = async () => {
    try {
      if (!user) return;

      // Load Kendras with city info for admin
      if (user.role === 'admin') {
        const kendrasData = await getKendras();
        setKendras(kendrasData);
      } else if (user.kendra_id) {
        // For members, get their kendra details
        const kendrasData = await getKendras();
        const userKendra = kendrasData.find(k => k.id === user.kendra_id);
        setKendras(userKendra ? [userKendra] : []);
      } else {
        setKendras([]);
      }

      // If editing, load report
      if (id) {
        const report = await getReportById(id);
        if (report) {
          setFormData({
            kendra_id: report.kendra_id,
            week_start_date: report.week_start_date,
            yuva_attendance: report.yuva_kendra_attendance.toString(),
            bhavferni_attendance: report.bhavferni_attendance.toString(),
            pravachan_attendance: report.pravachan_attendance.toString(),
            description: report.description || '',
          });
        }
      } else {
        // For new reports, set user's kendra if member
        if (user.role === 'member' && user.kendra_id) {
          setFormData((prev) => ({ ...prev, kendra_id: user.kendra_id! }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const validation = validateReportData({
      kendra_id: formData.kendra_id,
      week_start_date: formData.week_start_date,
      yuva_kendra_attendance: parseInt(formData.yuva_attendance) || 0,
      bhavferni_attendance: parseInt(formData.bhavferni_attendance) || 0,
      pravachan_attendance: parseInt(formData.pravachan_attendance) || 0,
      pushp_no: 1, // Will be calculated
    });

    if (!validation.valid) {
      Alert.alert('Validation Error', validation.message);
      return;
    }

    if (!id && !isValidReportDate(formData.week_start_date)) {
      Alert.alert('Invalid Date', 'You can only report for the current week or previous week');
      return;
    }

    setSaving(true);
    try {
      const reportData = {
        kendra_id: formData.kendra_id,
        week_start_date: formData.week_start_date,
        yuva_kendra_attendance: parseInt(formData.yuva_attendance) || 0,
        bhavferni_attendance: parseInt(formData.bhavferni_attendance) || 0,
        pravachan_attendance: parseInt(formData.pravachan_attendance) || 0,
        description: formData.description,
        created_by: user!.id,
      };

      if (id) {
        await updateReport(id, reportData);
      } else {
        await createReport(reportData);
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
        <Text style={styles.headerTitle}>{id ? 'Edit Report' : 'Create Report'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {user?.role === 'admin' && (
            <Dropdown
              label="Kendra *"
              options={kendras.map((kendra) => ({
                label: `${kendra.kendra_name} (${kendra.kendra_type})`,
                value: kendra.id,
              }))}
              value={formData.kendra_id}
              onValueChange={(value) => setFormData({ ...formData, kendra_id: value })}
              placeholder="Select a kendra"
            />
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Week Start Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              disabled={!!id}
            >
              <Text style={styles.dateButtonText}>
                {new Date(formData.week_start_date).toLocaleDateString()}
              </Text>
              {!id && <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.week_start_date)}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setFormData({ ...formData, week_start_date: getWeekStartDate(date) });
                  }
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Yuva Kendra Attendance *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.yuva_attendance}
              onChangeText={(text) => setFormData({ ...formData, yuva_attendance: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bhavferni Attendance *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.bhavferni_attendance}
              onChangeText={(text) => setFormData({ ...formData, bhavferni_attendance: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Pravachan Attendance *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.pravachan_attendance}
              onChangeText={(text) => setFormData({ ...formData, pravachan_attendance: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
});

