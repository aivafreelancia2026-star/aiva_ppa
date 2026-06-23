import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet } from 'react-native'

import DashboardScreen from './src/screens/DashboardScreen'
import ChatScreen from './src/screens/ChatScreen'
import TasksScreen from './src/screens/TasksScreen'
import ShoppingScreen from './src/screens/ShoppingScreen'
import CountersScreen from './src/screens/CountersScreen'
import RemindersScreen from './src/screens/RemindersScreen'
import LoginScreen from './src/screens/LoginScreen'
import { useAuthStore } from './src/store/authStore'
import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

const THEME = {
  bg: '#0f0f1a',
  surface: '#1a1a2e',
  purple: '#7c3aed',
  text: '#f8fafc',
  muted: '#94a3b8',
  border: 'rgba(139,92,246,0.15)',
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: THEME.surface,
          borderTopColor: THEME.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 68,
        },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: THEME.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Chat: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            Tasks: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            Shopping: focused ? 'cart' : 'cart-outline',
            Counters: focused ? 'bar-chart' : 'bar-chart-outline',
            Reminders: focused ? 'notifications' : 'notifications-outline',
          }
          return <Ionicons name={icons[route.name] ?? 'help'} size={22} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Shopping" component={ShoppingScreen} />
      <Tab.Screen name="Counters" component={CountersScreen} />
      <Tab.Screen name="Reminders" component={RemindersScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const { user, loading } = useAuthStore()

  useEffect(() => {
    registerForPushNotifications()
  }, [])

  if (loading) return null

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer theme={{ dark: true, colors: { primary: '#7c3aed', background: THEME.bg, card: THEME.surface, text: THEME.text, border: THEME.border, notification: '#7c3aed' } }}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
              <Stack.Screen name="App" component={AppTabs} />
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

async function registerForPushNotifications() {
  if (!Device.isDevice) return
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data
  console.log('Push token:', token)
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
