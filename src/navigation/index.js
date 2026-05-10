import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';
import Icon, { faCartShopping, faClockRotateLeft } from '../components/Icon';

import LoginScreen             from '../screens/LoginScreen';
import POSScreen               from '../screens/POSScreen';
import CheckoutScreen          from '../screens/CheckoutScreen';
import TransactionsScreen      from '../screens/TransactionsScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function POSStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="POSMain"  component={POSScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
    </Stack.Navigator>
  );
}

function TransactionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionsList"  component={TransactionsScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => {
          const icon = route.name === 'POS' ? faCartShopping : faClockRotateLeft;
          return <Icon icon={icon} size={18} color={color} />;
        },
        tabBarActiveTintColor:   C.ink,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopWidth: 0.5,
          borderTopColor: C.line,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
      })}
    >
      <Tab.Screen name="POS"          component={POSStack} />
      <Tab.Screen name="Transactions" component={TransactionsStack} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main"  component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
