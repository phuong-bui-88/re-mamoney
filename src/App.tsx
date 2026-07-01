import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AddTransactionScreen from '@screens/AddTransactionScreen';
import AskScreen from '@screens/AskScreen';
import HomeScreen from '@screens/HomeScreen';
import LoginScreen from '@screens/LoginScreen';
import SettingsScreen from '@screens/SettingsScreen';
import TransactionListScreen from '@screens/TransactionListScreen';
import firebaseService from '@services/firebase';
import { useAuthStore } from '@store/index';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const C = { white: '#fff' };

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: C.white,
    flex: 1,
    justifyContent: 'center',
  },
});

function HomeTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#00BFA5',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionListScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Ask"
        component={AskScreen}
        options={{
          tabBarLabel: 'Ask AI',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App(): React.ReactElement {
  const { user, setUser } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      console.info('Initializing app123...');
      try {
        await firebaseService.initialize();
        console.info('Firebase initialized successfully');

        // Listen to auth state changes
        const unsubscribe = firebaseService.onAuthStateChanged((authUser) => {
          setUser(authUser);
          setIsInitializing(false);
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('App initialization error 1 2:', error);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [setUser]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BFA5" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <NavigationContainer>
        <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Main"
              component={HomeTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ title: 'Add Transaction' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}
