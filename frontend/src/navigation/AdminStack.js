import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/Admin/DashboardScreen';
import ManageOrders from '../screens/Admin/ManageOrders';
import ManageServices from '../screens/Admin/ManageServices';

const Tab = createBottomTabNavigator();

export default function AdminStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#0ea5e9',
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'AI Analytics' }} />
      <Tab.Screen name="ManageOrders" component={ManageOrders} options={{ title: 'Orders' }} />
      <Tab.Screen name="ManageServices" component={ManageServices} options={{ title: 'Bookings' }} />
    </Tab.Navigator>
  );
}
