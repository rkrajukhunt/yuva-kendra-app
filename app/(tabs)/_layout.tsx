import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        headerStyle: {
          backgroundColor: Colors.card,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 96 : 84,
        },
        headerTitleContainerStyle: {
          paddingHorizontal: 0,
        },
        headerTintColor: Colors.foreground,
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: Colors.foreground,
          letterSpacing: -0.3,
        },
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 64,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: user.role === 'admin' ? 'Admin Dashboard' : 'Kendra Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name="view-dashboard" 
              size={focused ? 26 : 24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name="file-document" 
              size={focused ? 26 : 24} 
              color={color} 
            />
          ),
        }}
      />
      {user.role === 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Management',
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons 
                name="account-cog" 
                size={focused ? 26 : 24} 
                color={color} 
              />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name="account" 
              size={focused ? 26 : 24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

