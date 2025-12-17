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

const screenWidth = Dimensions.get('window').width;

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
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [0],
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    }

    const labels = trends.map((t) => {
      const date = new Date(t.week);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    return {
      labels,
      datasets: [
        {
          data: trends.map((t) => t.yuva),
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: trends.map((t) => t.bhavferni),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: trends.map((t) => t.pravachan),
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Yuva Kendra', 'Bhavferni', 'Pravachan'],
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
        <View style={styles.header}>
          <Text style={styles.title}>
            {user?.role === 'admin' ? 'Admin Dashboard' : 'Kendra Dashboard'}
          </Text>
        </View>

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
              {trends.length > 0 ? (
                <LineChart
                  data={chartData}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={{
                    backgroundColor: Colors.surface,
                    backgroundGradientFrom: Colors.surface,
                    backgroundGradientTo: Colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: Colors.primary,
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No attendance data available</Text>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});

