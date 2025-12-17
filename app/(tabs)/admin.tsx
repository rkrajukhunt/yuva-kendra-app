import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import AdminManagementScreen from '../admin/management';

export default function AdminTab() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return <AdminManagementScreen />;
}

