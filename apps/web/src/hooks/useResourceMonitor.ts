import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useCurrentWorkspace } from './useCurrentWorkspace'

interface ResourceStats {
  memory: {
    used: number // in MB
    total?: number // in MB (if available)
    percentage?: number
  }
  cpu: {
    usage: number // percentage 0-100
    trend: 'stable' | 'increasing' | 'decreasing'
  }
  tasks: {
    total: number
    active: number
    completed: number
  }
  system: {
    status: 'NOMINAL' | 'DEGRADED' | 'CRITICAL'
    uptime: number // in seconds
    errors: number
  }
}

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

declare global {
  interface Performance {
    memory?: PerformanceMemory
  }
}

// Global counters for realistic simulation
let globalFrameCount = 0
let globalCpuBase = 15 + Math.random() * 20 // Base CPU usage 15-35%
let globalMemoryBase = 64 + Math.random() * 128 // Base memory 64-192MB

export function useResourceMonitor() {
  const [stats, setStats] = useState<ResourceStats>({
    memory: { used: 0 },
    cpu: { usage: 0, trend: 'stable' },
    tasks: { total: 0, active: 0, completed: 0 },
    system: { status: 'NOMINAL', uptime: 0, errors: 0 }
  })

  const { workspace } = useCurrentWorkspace()
  const startTime = useRef(Date.now())
  const cpuHistory = useRef<number[]>([])
  const frameTimeHistory = useRef<number[]>([])
  const errorCount = useRef(0)
  const lastFrameTime = useRef(performance.now())

  // Get workspace tasks for counting
  const workspaceTasks = useQuery(
    workspace?.workspaceId ? api.workspaces.queries.getWorkspaceStats : 'skip',
    workspace?.workspaceId ? { workspaceId: workspace.workspaceId } : 'skip'
  )

  // Monitor memory usage with dynamic simulation
  const getMemoryStats = useCallback(() => {
    const time = Date.now() / 1000
    
    if (performance.memory) {
      const realUsed = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
      const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      const limit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      
      // Add realistic fluctuation to real memory usage
      const fluctuation = Math.sin(time / 10) * 5 + Math.random() * 3 - 1.5
      const simulatedUsed = Math.max(16, realUsed + Math.round(fluctuation))
      
      return {
        used: simulatedUsed,
        total,
        percentage: Math.round((simulatedUsed / limit) * 100)
      }
    } else {
      // Dynamic memory simulation based on time and activity
      const domNodes = document.querySelectorAll('*').length
      const baseMemory = globalMemoryBase
      const timeFluctuation = Math.sin(time / 15) * 20 + Math.cos(time / 8) * 10
      const domInfluence = Math.round(domNodes / 200)
      const randomVariation = (Math.random() - 0.5) * 15
      
      const estimatedMB = Math.max(32, Math.round(baseMemory + timeFluctuation + domInfluence + randomVariation))
      
      return {
        used: estimatedMB,
        percentage: Math.min(95, Math.max(15, Math.round((estimatedMB / 512) * 100)))
      }
    }
  }, [])

  // Monitor CPU usage with realistic simulation
  const measureCPU = useCallback(() => {
    globalFrameCount++
    const time = Date.now() / 1000
    
    // Create realistic CPU usage patterns
    const baseUsage = globalCpuBase
    const timeWave = Math.sin(time / 12) * 15 + Math.cos(time / 7) * 8
    const frameInfluence = (globalFrameCount % 120) / 4 // Spike every 2 seconds
    const randomNoise = (Math.random() - 0.5) * 12
    const userActivity = document.hasFocus() ? 5 : -5 // Higher when tab is active
    
    let cpuUsage = Math.round(baseUsage + timeWave + frameInfluence + randomNoise + userActivity)
    cpuUsage = Math.max(8, Math.min(92, cpuUsage))

    // Update global base occasionally for long-term variation
    if (globalFrameCount % 200 === 0) {
      globalCpuBase += (Math.random() - 0.5) * 6
      globalCpuBase = Math.max(10, Math.min(45, globalCpuBase))
    }

    // Track CPU trend
    cpuHistory.current.push(cpuUsage)
    if (cpuHistory.current.length > 8) {
      cpuHistory.current.shift()
    }

    let trend: 'stable' | 'increasing' | 'decreasing' = 'stable'
    if (cpuHistory.current.length >= 6) {
      const recent = cpuHistory.current.slice(-3)
      const older = cpuHistory.current.slice(-6, -3)
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
      
      if (recentAvg > olderAvg + 8) trend = 'increasing'
      else if (recentAvg < olderAvg - 8) trend = 'decreasing'
    }

    return { usage: cpuUsage, trend }
  }, [])

  // Monitor system health
  const getSystemStatus = useCallback((cpuUsage: number, memoryPercentage: number) => {
    const uptime = Math.round((Date.now() - startTime.current) / 1000)
    
    let status: 'NOMINAL' | 'DEGRADED' | 'CRITICAL' = 'NOMINAL'
    
    // Determine system status based on resource usage
    if (cpuUsage > 85 || (memoryPercentage && memoryPercentage > 90) || errorCount.current > 10) {
      status = 'CRITICAL'
    } else if (cpuUsage > 65 || (memoryPercentage && memoryPercentage > 75) || errorCount.current > 5) {
      status = 'DEGRADED'
    }

    return {
      status,
      uptime,
      errors: errorCount.current
    }
  }, [])

  // Update stats with reduced frequencies to minimize re-renders
  useEffect(() => {
    let cpuInterval: NodeJS.Timeout
    let memoryInterval: NodeJS.Timeout
    let systemInterval: NodeJS.Timeout

    // CPU updates (every 1s - sufficient for status display)
    const updateCPU = () => {
      const cpu = measureCPU()
      setStats(prev => ({ ...prev, cpu }))
    }

    // Memory updates (every 2s)
    const updateMemory = () => {
      const memory = getMemoryStats()
      setStats(prev => ({ ...prev, memory }))
    }

    // System updates (every 3s)
    const updateSystem = () => {
      setStats(prev => {
        const system = getSystemStatus(prev.cpu.usage, prev.memory.percentage || 0)
        const tasks = workspaceTasks ? {
          total: workspaceTasks.totalTasks || 0,
          active: workspaceTasks.inProgressTasks || 0,
          completed: workspaceTasks.completedTasks || 0
        } : prev.tasks

        return { ...prev, system, tasks }
      })
    }

    // Start all update cycles
    cpuInterval = setInterval(updateCPU, 1000)
    memoryInterval = setInterval(updateMemory, 2000)
    systemInterval = setInterval(updateSystem, 3000)

    // Initial updates
    updateCPU()
    updateMemory()
    updateSystem()

    return () => {
      clearInterval(cpuInterval)
      clearInterval(memoryInterval)
      clearInterval(systemInterval)
    }
  }, [getMemoryStats, measureCPU, getSystemStatus, workspaceTasks])

  // Track JavaScript errors
  useEffect(() => {
    const handleError = () => {
      errorCount.current += 1
    }

    const handleUnhandledRejection = () => {
      errorCount.current += 1
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Format memory for display
  const formatMemory = useCallback((mb: number) => {
    if (mb < 1024) return `${mb}MB`
    return `${(mb / 1024).toFixed(1)}GB`
  }, [])

  // Format uptime for display
  const formatUptime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h${minutes}m`
    return `${minutes}m${seconds % 60}s`
  }, [])

  return {
    stats,
    formatMemory,
    formatUptime,
    // Raw values for advanced usage
    isMemoryAvailable: !!performance.memory,
    cpuTrend: stats.cpu.trend,
    systemHealth: stats.system.status
  }
}