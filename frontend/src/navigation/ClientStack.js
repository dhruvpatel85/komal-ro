import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Client/HomeScreen';
import ProductDetailScreen from '../screens/Client/ProductDetailScreen';
import CartScreen from '../screens/Client/CartScreen';
import CheckoutScreen from '../screens/Client/CheckoutScreen';
import ServicesScreen from '../screens/Client/ServicesScreen';
import ProfileScreen from '../screens/Client/ProfileScreen';

const Tab = createBottomTabNavigator();
const CartStackNav = createNativeStackNavigator();
const ShopStackNav = createNativeStackNavigator();

const headerAmazon = {
  headerStyle: { backgroundColor: '#131921' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
};

function ShopStack() {
  return (
    <ShopStackNav.Navigator screenOptions={headerAmazon}>
      <ShopStackNav.Screen
        name="ShopHome"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <ShopStackNav.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product details' }}
      />
    </ShopStackNav.Navigator>
  );
}

function CartStack() {
  return (
    <CartStackNav.Navigator screenOptions={headerAmazon}>
      <CartStackNav.Screen
        name="CartMain"
        component={CartScreen}
        options={{ title: 'Shopping Cart' }}
      />
      <CartStackNav.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
    </CartStackNav.Navigator>
  );
}

export default function ClientStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#131921' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#ff9900',
        tabBarInactiveTintColor: '#565959',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          borderTopColor: '#ddd',
        },
      }}
    >
      <Tab.Screen
        name="Shop"
        component={ShopStack}
        options={{ title: 'Shop', headerShown: false }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStack}
        options={{ title: 'Cart', headerShown: false }}
      />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: 'Services' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}