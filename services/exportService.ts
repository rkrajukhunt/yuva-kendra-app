import { WeeklyReport } from '../types';
import { formatDate } from '../utils/dateHelpers';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function exportToPDF(reports: WeeklyReport[]): Promise<void> {
  try {
    // For React Native, we'll create a simple text-based PDF or CSV
    // Full PDF generation would require react-native-pdf or similar
    // For now, we'll export as CSV which can be opened in Excel/Sheets
    
    const csvContent = generateCSV(reports);
    const fileName = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

export async function exportToExcel(reports: WeeklyReport[]): Promise<void> {
  try {
    const csvContent = generateCSV(reports);
    const fileName = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting Excel:', error);
    throw error;
  }
}

function generateCSV(reports: WeeklyReport[]): string {
  const headers = [
    'Kendra',
    'City',
    'Type',
    'Week Start Date',
    'Pushp Number',
    'Yuva Attendance',
    'Bhavferni Attendance',
    'Pravachan Attendance',
    'Total Attendance',
    'Description',
    'Created By',
    'Created At',
  ];

  const rows = reports.map((report) => {
    const totalAttendance =
      (report.yuva_kendra_attendance || 0) +
      (report.bhavferni_attendance || 0) +
      (report.pravachan_attendance || 0);

    return [
      report.kendra?.kendra_name || '',
      report.kendra?.city?.city_name || '',
      report.kendra?.kendra_type || '',
      formatDate(report.week_start_date),
      report.pushp_no.toString(),
      (report.yuva_kendra_attendance || 0).toString(),
      (report.bhavferni_attendance || 0).toString(),
      (report.pravachan_attendance || 0).toString(),
      totalAttendance.toString(),
      report.description || '',
      report.creator?.name || report.creator?.email || '',
      formatDate(report.created_at),
    ];
  });

  const csvRows = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  );

  return csvRows.join('\n');
}

