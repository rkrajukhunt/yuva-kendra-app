import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { getDashboardStats, getAttendanceTrends } from '../../services/databaseService';
import { DashboardStats } from '../../types';
import { Colors } from '../../constants/Colors';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
// Calculate chart width: screen width - content padding (32) - chart container padding (32) - safety margin (8)
const chartWidth = screenWidth - 72;

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<Array<{ week: string; yuva: number; bhavferni: number; pravachan: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (!user) return;

      const [statsData, trendsData] = await Promise.all([
        getDashboardStats(user.id, user.role, user.kendra_id || undefined),
        getAttendanceTrends(user.id, user.role, user.kendra_id || undefined, 5),
      ]);

      setStats(statsData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.role, user?.kendra_id]);

  useEffect(() => {
    loadData();
  }, [user]);

  // Refresh when screen comes into focus (e.g., after creating a report)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      }
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const chartData = useMemo(() => {
    if (trends.length === 0) {
      return null;
    }

    // Format labels with better date formatting
    const labels = trends.map((t) => {
      const date = new Date(t.week);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    });

    // Get max value for better scaling
    const maxValue = Math.max(
      ...trends.flatMap(t => [t.yuva, t.bhavferni, t.pravachan])
    );

    return {
      labels,
      datasets: [
        {
          data: trends.map((t) => t.yuva || 0),
          color: (opacity = 1) => {
            // Primary color with opacity
            const rgb = '15, 23, 42'; // #0f172a
            return `rgba(${rgb}, ${opacity})`;
          },
          strokeWidth: 3,
        },
        {
          data: trends.map((t) => t.bhavferni || 0),
          color: (opacity = 1) => {
            // Success color (green)
            const rgb = '16, 185, 129'; // #10b981
            return `rgba(${rgb}, ${opacity})`;
          },
          strokeWidth: 3,
        },
        {
          data: trends.map((t) => t.pravachan || 0),
          color: (opacity = 1) => {
            // Warning color (orange)
            const rgb = '245, 158, 11'; // #f59e0b
            return `rgba(${rgb}, ${opacity})`;
          },
          strokeWidth: 3,
        },
      ],
    };
  }, [trends]);

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {stats && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalReports}</Text>
                <Text style={styles.statLabel}>Total Reports</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.avgYuvaAttendance.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Yuva Attendance</Text>
              </View>

              {user?.role === 'admin' ? (
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.activeKendras || 0}</Text>
                  <Text style={styles.statLabel}>Active Kendras</Text>
                </View>
              ) : (
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.lastWeekTotal || 0}</Text>
                  <Text style={styles.statLabel}>Last Week Total</Text>
                </View>
              )}

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.avgBhavferniAttendance.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Bhavferni</Text>
              </View>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Attendance Trends (Last 5 Weeks)</Text>
              {chartData ? (
                <>
                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                      <Text style={styles.legendText}>Yuva Kendra</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                      <Text style={styles.legendText}>Bhavferni</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                      <Text style={styles.legendText}>Pravachan</Text>
                    </View>
                  </View>
                  <View style={styles.chartWrapper}>
                    <LineChart
                      data={chartData}
                      width={chartWidth}
                      height={220}
                    chartConfig={{
                      backgroundColor: Colors.card,
                      backgroundGradientFrom: Colors.card,
                      backgroundGradientTo: Colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => {
                        const rgb = '10, 14, 39'; // Colors.foreground
                        return `rgba(${rgb}, ${opacity})`;
                      },
                      labelColor: (opacity = 1) => {
                        const rgb = '100, 116, 139'; // Colors.mutedForeground
                        return `rgba(${rgb}, ${opacity})`;
                      },
                      fillShadowGradient: Colors.primary,
                      fillShadowGradientOpacity: 0.1,
                      strokeWidth: 2,
                      barPercentage: 0.7,
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: Colors.border,
                        strokeWidth: 1,
                      },
                      propsForDots: {
                        r: '5',
                        strokeWidth: '2',
                        stroke: Colors.primary,
                        fill: Colors.card,
                      },
                      propsForLabels: {
                        fontSize: 11,
                      },
                    }}
                    bezier
                    style={styles.chart}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withDots={true}
                    withShadow={false}
                    withLegend={false}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <MaterialCommunityIcons name="chart-line" size={48} color={Colors.mutedForeground} />
                  <Text style={styles.noDataText}>No attendance data available</Text>
                  <Text style={styles.noDataSubtext}>Create reports to see trends</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  chart: {
    borderRadius: 8,
    marginTop: 8,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    color: Colors.mutedForeground,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  noDataSubtext: {
    color: Colors.mutedForeground,
    fontSize: 14,
    marginTop: 4,
  },
});

