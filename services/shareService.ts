import { Linking, Platform, Alert } from 'react-native';
import { getReports } from './databaseService';
import { ReportFilters } from '../types';

/**
 * Format report totals message for WhatsApp sharing
 */
export const formatReportTotalsMessage = async (
  reportType: 'Yuvan' | 'Yuvti',
  userId?: string,
  userRole?: string,
  userKendraId?: string
): Promise<string> => {
  try {
    // Fetch all reports of the specified type
    const filters: ReportFilters = { type: reportType };
    const result = await getReports(
      filters,
      userId,
      userRole,
      10000, // Large limit to get all reports
      userKendraId,
      0
    );

    // Calculate totals
    let totalYuvaKendra = 0;
    let totalBhavferni = 0;
    let totalPravachan = 0;

    result.data.forEach((report) => {
      totalYuvaKendra += report.yuva_kendra_attendance || 0;
      totalBhavferni += report.bhavferni_attendance || 0;
      totalPravachan += report.pravachan_attendance || 0;
    });

    const grandTotal = totalYuvaKendra + totalBhavferni + totalPravachan;

    // Format message
    let message = `📊 *${reportType} Report - Total Summary*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `👥 Yuva Kendra: *${totalYuvaKendra}*\n`;
    message += `👨‍👩‍👧‍👦 Bhavferni: *${totalBhavferni}*\n`;
    message += `🎤 Pravachan: *${totalPravachan}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `📊 *Grand Total: ${grandTotal}*\n`;

    return message;
  } catch (error) {
    throw new Error(`Failed to generate ${reportType} report totals`);
  }
};

/**
 * Share message to WhatsApp
 */
export const shareToWhatsApp = async (message: string): Promise<void> => {
  try {
    // On web, use web WhatsApp directly
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const webWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(webWhatsappUrl, '_blank');
      return;
    }

    // On native, try WhatsApp app first, then fallback to web
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (linkingError) {
      // If linking fails, try web WhatsApp
      const webWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      await Linking.openURL(webWhatsappUrl);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to share report. Please make sure WhatsApp is installed or try again.');
    throw error;
  }
};

/**
 * Share report totals to WhatsApp
 */
export const shareReportTotals = async (
  reportType: 'Yuvan' | 'Yuvti',
  userId?: string,
  userRole?: string,
  userKendraId?: string
): Promise<void> => {
  const message = await formatReportTotalsMessage(reportType, userId, userRole, userKendraId);
  await shareToWhatsApp(message);
};

