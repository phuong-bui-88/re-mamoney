import { Ionicons } from '@react-native-vector-icons/ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import AddTransactionScreen from '@screens/AddTransactionScreen';
import AskScreen from '@screens/AskScreen';
import EditTransactionScreen from '@screens/EditTransactionScreen';
import HomeScreen from '@screens/HomeScreen';
import LoginScreen from '@screens/LoginScreen';
import SettingsScreen from '@screens/SettingsScreen';
import TransactionListScreen from '@screens/TransactionListScreen';
import firebaseService from '@services/firebase';
import * as deviceUsersService from '@services/deviceUsers';
import { getDeviceId } from '@utils/device';
import { installNoPageScroll, useWebKeyboard } from '@utils/useWebKeyboard';
import { useAuthStore } from '@store/index';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const C = { white: '#fff' };

const Stack = createNativeStackNavigator();
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
  // Web, keyboard open: pin the app to the layout viewport, then useWebKeyboard's offset
  // moves it onto the visible area above the keyboard.
  pinnedToKeyboard: {
    flex: 0,
    left: 0,
    position: 'fixed' as 'absolute',
    right: 0,
    top: 0,
  },
});

function AddTransactionHeaderLeft(): React.ReactElement {
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Dashboard' as never)}>
      <Ionicons name="chevron-back" size={24} color="#00BFA5" />
    </TouchableOpacity>
  );
}

function HomeTabNavigator() {
  const { keyboardOpen } = useWebKeyboard();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#00BFA5',
        tabBarInactiveTintColor: '#999',
        // Web: hide the tab bar so the input bar sits directly on the keyboard.
        ...(keyboardOpen && { tabBarStyle: { display: 'none' } }),
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionListScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Ask"
        component={AskScreen}
        options={{
          tabBarLabel: 'Ask AI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          headerShown: true,
          title: 'Add Transaction',
          headerLeft: () => <AddTransactionHeaderLeft />,
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App(): React.ReactElement {
  const { user, setUser, setSelectedUser, setSavedAccounts } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const { visibleHeight, visibleTop } = useWebKeyboard();
  // Load the icon font explicitly: on web, Expo's dynamic font loading is unavailable,
  // so without this every Ionicons glyph renders as an empty box.
  const [fontsLoaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Ionicons: require('@react-native-vector-icons/ionicons/fonts/Ionicons.ttf'),
  });

  useEffect(() => installNoPageScroll(), []);

  useEffect(() => {
    const initializeApp = async () => {
      console.info('Initializing app123...');
      try {
        await firebaseService.initialize();
        console.info('Firebase initialized successfully');

        const deviceId = await getDeviceId();
        const accounts = await deviceUsersService.getDeviceUsers(deviceId);
        setSavedAccounts(accounts);

        // Listen to auth state changes
        const unsubscribe = firebaseService.onAuthStateChanged((authUser) => {
          setUser(authUser);
          if (authUser) {
            setSelectedUser(authUser);
          }
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
  }, [setUser, setSelectedUser, setSavedAccounts]);

  if (isInitializing || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BFA5" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={[
        styles.gestureRoot,
        visibleHeight != null && [
          styles.pinnedToKeyboard,
          { height: visibleHeight, transform: [{ translateY: visibleTop }] },
        ],
      ]}
    >
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
                name="EditTransaction"
                component={EditTransactionScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
