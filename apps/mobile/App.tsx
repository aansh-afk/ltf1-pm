import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import * as SecureStore from 'expo-secure-store'
import * as Notifications from 'expo-notifications'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import Toast from 'react-native-toast-message'
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper'
import { ThemeProvider } from 'react-native-elements'

// Screens
import LoginScreen from './src/screens/auth/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import TasksScreen from './src/screens/TasksScreen'
import ProjectsScreen from './src/screens/ProjectsScreen'
import SprintsScreen from './src/screens/SprintsScreen'
import MeetingsScreen from './src/screens/MeetingsScreen'
import TimeTrackingScreen from './src/screens/TimeTrackingScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import TaskDetailScreen from './src/screens/TaskDetailScreen'
import ProjectDetailScreen from './src/screens/ProjectDetailScreen'
import SprintBoardScreen from './src/screens/SprintBoardScreen'
import MeetingDetailScreen from './src/screens/MeetingDetailScreen'
import NotificationsScreen from './src/screens/NotificationsScreen'
import ChatScreen from './src/screens/ChatScreen'
import VideoCallScreen from './src/screens/VideoCallScreen'
import WhiteboardScreen from './src/screens/WhiteboardScreen'

// Components
import TabBarIcon from './src/components/navigation/TabBarIcon'
import HeaderRight from './src/components/navigation/HeaderRight'

// Services
import { AuthService } from './src/services/auth'
import { NotificationService } from './src/services/notifications'
import { ThemeService } from './src/services/theme'

// Utils
import { CONVEX_URL } from './src/utils/config'

// Navigation types
export type RootStackParamList = {
  Login: undefined
  Main: undefined
  TaskDetail: { taskId: string }
  ProjectDetail: { projectId: string }
  SprintBoard: { sprintId: string }
  MeetingDetail: { meetingId: string }
  Notifications: undefined
  Chat: { channelId?: string }
  VideoCall: { meetingId: string }
  Whiteboard: { boardId?: string }
}

export type MainTabParamList = {
  Dashboard: undefined
  Tasks: undefined
  Projects: undefined
  Sprints: undefined
  Meetings: undefined
  TimeTracking: undefined
  Profile: undefined
  Settings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

// Convex client
const convex = new ConvexReactClient(CONVEX_URL)

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
})

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

function MainTabs() {
  const theme = ThemeService.getTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: theme.colors.text.primary,
          fontFamily: 'SpaceMono',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="dashboard" color={color} size={size} />
          ),
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="check-square" color={color} size={size} />
          ),
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="folder" color={color} size={size} />
          ),
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tab.Screen
        name="Sprints"
        component={SprintsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="rocket" color={color} size={size} />
          ),
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tab.Screen
        name="Meetings"
        component={MeetingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="video" color={color} size={size} />
          ),
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tab.Screen
        name="TimeTracking"
        component={TimeTrackingScreen}
        options={{
          title: 'Time',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="clock" color={color} size={size} />
          ),
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="user" color={color} size={size} />
          ),
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState(ThemeService.getTheme())

  useEffect(() => {
    // Check authentication status
    checkAuthStatus()
    
    // Initialize notification service
    NotificationService.initialize()
    
    // Register notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
    })
    
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response)
      // Handle notification tap
      handleNotificationResponse(response)
    })
    
    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
      Notifications.removeNotificationSubscription(responseListener)
    }
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      if (token) {
        const isValid = await AuthService.validateToken(token)
        setIsAuthenticated(isValid)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { data } = response.notification.request.content
    
    // Navigate based on notification type
    if (data.type === 'task') {
      // Navigate to task detail
    } else if (data.type === 'meeting') {
      // Navigate to meeting detail
    } else if (data.type === 'chat') {
      // Navigate to chat
    }
  }

  if (isLoading) {
    // Show splash screen or loading indicator
    return null
  }

  const paperTheme = theme.isDark ? MD3DarkTheme : MD3LightTheme

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexProvider client={convex}>
          <QueryClientProvider client={queryClient}>
            <PaperProvider theme={paperTheme}>
              <ThemeProvider theme={theme}>
                <BottomSheetModalProvider>
                  <NavigationContainer>
                    <StatusBar style={theme.isDark ? 'light' : 'dark'} />
                    <Stack.Navigator
                      screenOptions={{
                        headerStyle: {
                          backgroundColor: theme.colors.background,
                        },
                        headerTintColor: theme.colors.text.primary,
                        headerTitleStyle: {
                          fontFamily: 'SpaceMono',
                        },
                      }}
                    >
                      {!isAuthenticated ? (
                        <Stack.Screen
                          name="Login"
                          component={LoginScreen}
                          options={{ headerShown: false }}
                        />
                      ) : (
                        <>
                          <Stack.Screen
                            name="Main"
                            component={MainTabs}
                            options={{ headerShown: false }}
                          />
                          <Stack.Screen
                            name="TaskDetail"
                            component={TaskDetailScreen}
                            options={{ title: 'Task Details' }}
                          />
                          <Stack.Screen
                            name="ProjectDetail"
                            component={ProjectDetailScreen}
                            options={{ title: 'Project Details' }}
                          />
                          <Stack.Screen
                            name="SprintBoard"
                            component={SprintBoardScreen}
                            options={{ title: 'Sprint Board' }}
                          />
                          <Stack.Screen
                            name="MeetingDetail"
                            component={MeetingDetailScreen}
                            options={{ title: 'Meeting Details' }}
                          />
                          <Stack.Screen
                            name="Notifications"
                            component={NotificationsScreen}
                            options={{ title: 'Notifications' }}
                          />
                          <Stack.Screen
                            name="Chat"
                            component={ChatScreen}
                            options={{ title: 'Chat' }}
                          />
                          <Stack.Screen
                            name="VideoCall"
                            component={VideoCallScreen}
                            options={{ 
                              title: 'Video Call',
                              headerShown: false,
                            }}
                          />
                          <Stack.Screen
                            name="Whiteboard"
                            component={WhiteboardScreen}
                            options={{ 
                              title: 'Whiteboard',
                              headerShown: false,
                            }}
                          />
                        </>
                      )}
                    </Stack.Navigator>
                  </NavigationContainer>
                  <Toast />
                </BottomSheetModalProvider>
              </ThemeProvider>
            </PaperProvider>
          </QueryClientProvider>
        </ConvexProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}