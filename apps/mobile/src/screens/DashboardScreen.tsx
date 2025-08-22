import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit'
import { LinearGradient } from 'expo-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { ThemeService } from '../services/theme'
import { formatNumber, formatDate } from '../utils/formatters'
import StatCard from '../components/dashboard/StatCard'
import TaskCard from '../components/dashboard/TaskCard'
import ActivityItem from '../components/dashboard/ActivityItem'

const { width: screenWidth } = Dimensions.get('window')

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const theme = ThemeService.getTheme()

  // Fetch data from Convex
  const workspace = useQuery(api.workspaces.getCurrentWorkspace)
  const tasks = useQuery(api.tasks.getMyTasks, workspace ? { workspaceId: workspace._id } : 'skip')
  const projects = useQuery(api.projects.getProjects, workspace ? { workspaceId: workspace._id } : 'skip')
  const sprints = useQuery(api.sprints.getActiveSprints, workspace ? { workspaceId: workspace._id } : 'skip')
  const meetings = useQuery(api.meetings.getUpcomingMeetings, workspace ? { workspaceId: workspace._id } : 'skip')
  const timeEntries = useQuery(api.timeEntries.getRecentEntries, workspace ? { workspaceId: workspace._id } : 'skip')

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    // Refetch data
    setTimeout(() => setRefreshing(false), 2000)
  }, [])

  // Calculate statistics
  const stats = {
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
    inProgressTasks: tasks?.filter(t => t.status === 'in_progress').length || 0,
    overdueTasks: tasks?.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length || 0,
    activeProjects: projects?.filter(p => p.status === 'active').length || 0,
    activeSprints: sprints?.length || 0,
    upcomingMeetings: meetings?.length || 0,
    hoursTracked: timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 3600000 || 0,
  }

  // Chart data
  const taskChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [12, 19, 15, 25, 22, 18, 20],
        color: (opacity = 1) => `rgba(255, 0, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const statusChartData = [
    {
      name: 'To Do',
      population: tasks?.filter(t => t.status === 'todo').length || 0,
      color: '#FF00FF',
      legendFontColor: theme.colors.text.primary,
      legendFontSize: 12,
    },
    {
      name: 'In Progress',
      population: stats.inProgressTasks,
      color: '#00FFFF',
      legendFontColor: theme.colors.text.primary,
      legendFontSize: 12,
    },
    {
      name: 'Completed',
      population: stats.completedTasks,
      color: '#FFFF00',
      legendFontColor: theme.colors.text.primary,
      legendFontSize: 12,
    },
  ]

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 0,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#FF00FF',
    },
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF00FF"
          />
        }
      >
        {/* Welcome Section */}
        <LinearGradient
          colors={['#FF00FF', '#00FFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.welcomeCard}
        >
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.workspaceName}>{workspace?.name || 'Loading...'}</Text>
          <Text style={styles.dateText}>{formatDate(new Date())}</Text>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            icon="check-square"
            color="#FF00FF"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressTasks}
            icon="clock"
            color="#00FFFF"
          />
          <StatCard
            title="Overdue"
            value={stats.overdueTasks}
            icon="alert-triangle"
            color="#FF6B6B"
          />
          <StatCard
            title="Hours Tracked"
            value={stats.hoursTracked.toFixed(1)}
            icon="activity"
            color="#FFFF00"
          />
        </View>

        {/* Task Progress Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text.primary }]}>
            Task Progress This Week
          </Text>
          <LineChart
            data={taskChartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Task Status Distribution */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text.primary }]}>
            Task Distribution
          </Text>
          <PieChart
            data={statusChartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>

        {/* My Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              My Tasks
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {tasks?.slice(0, 5).map(task => (
            <TaskCard key={task._id} task={task} />
          ))}
        </View>

        {/* Upcoming Meetings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Upcoming Meetings
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {meetings?.slice(0, 3).map(meeting => (
            <View key={meeting._id} style={[styles.meetingCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.meetingTime}>
                <Icon name="calendar" size={16} color="#00FFFF" />
                <Text style={[styles.meetingTimeText, { color: theme.colors.text.secondary }]}>
                  {formatDate(new Date(meeting.scheduledAt))}
                </Text>
              </View>
              <Text style={[styles.meetingTitle, { color: theme.colors.text.primary }]}>
                {meeting.title}
              </Text>
              <View style={styles.meetingAttendees}>
                <Icon name="users" size={14} color={theme.colors.text.secondary} />
                <Text style={[styles.attendeesText, { color: theme.colors.text.secondary }]}>
                  {meeting.attendees?.length || 0} attendees
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Recent Activity
            </Text>
          </View>
          {/* Activity items would be fetched from audit logs */}
          <ActivityItem
            icon="check-circle"
            title="Task completed"
            description="Homepage redesign finished"
            time="2 hours ago"
            color="#00FF00"
          />
          <ActivityItem
            icon="git-commit"
            title="Code pushed"
            description="Updated authentication flow"
            time="3 hours ago"
            color="#FF00FF"
          />
          <ActivityItem
            icon="message-square"
            title="Comment added"
            description="Review feedback on API design"
            time="5 hours ago"
            color="#00FFFF"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#FF00FF' }]}>
            <Icon name="plus" size={24} color="#000000" />
            <Text style={styles.quickActionText}>New Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#00FFFF' }]}>
            <Icon name="clock" size={24} color="#000000" />
            <Text style={styles.quickActionText}>Start Timer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#FFFF00' }]}>
            <Icon name="calendar" size={24} color="#000000" />
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeCard: {
    margin: 20,
    padding: 24,
    borderRadius: 0,
  },
  welcomeText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'SpaceMono',
  },
  workspaceName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'SpaceMono',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'SpaceMono',
    marginTop: 8,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  chartCard: {
    margin: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF00FF',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 0,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF00FF',
    fontFamily: 'SpaceMono',
  },
  meetingCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00FFFF',
  },
  meetingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingTimeText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    marginLeft: 8,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  meetingAttendees: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    marginLeft: 6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  quickActionButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'SpaceMono',
    marginTop: 8,
  },
})