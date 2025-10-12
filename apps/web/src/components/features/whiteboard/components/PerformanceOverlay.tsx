/**
 * Performance Overlay Component
 *
 * Displays real-time performance metrics in development mode
 */

import React, { useEffect, useState } from 'react'
import { PerformanceMonitor } from '../utils/performanceUtils'

interface PerformanceOverlayProps {
  monitor: PerformanceMonitor
  enabled?: boolean
}

export default function PerformanceOverlay({ monitor, enabled = true }: PerformanceOverlayProps) {
  const [stats, setStats] = useState({
    fps: 0,
    avgFrameTime: 0,
    maxFrameTime: 0,
    samples: 0,
  })

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      setStats(monitor.getStats())
    }, 500) // Update every 500ms

    return () => clearInterval(interval)
  }, [monitor, enabled])

  if (!enabled) return null

  // Determine FPS color
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  // Determine frame time color
  const getFrameTimeColor = (ms: number) => {
    if (ms <= 16) return 'text-green-400'
    if (ms <= 33) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="fixed top-20 right-4 bg-black/90 border-2 border-cyan-400 p-3 z-50 font-mono text-xs">
      <div className="text-cyan-400 font-bold mb-2 border-b border-cyan-400 pb-1">
        PERFORMANCE
      </div>

      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">FPS:</span>
          <span className={getFPSColor(stats.fps)}>{stats.fps.toFixed(1)}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Avg Frame:</span>
          <span className={getFrameTimeColor(stats.avgFrameTime)}>
            {stats.avgFrameTime.toFixed(2)}ms
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Max Frame:</span>
          <span className={getFrameTimeColor(stats.maxFrameTime)}>
            {stats.maxFrameTime.toFixed(2)}ms
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Samples:</span>
          <span className="text-white">{stats.samples}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-cyan-400">
        <div className="text-gray-500 text-[10px]">
          Target: 60 FPS (16.67ms)
        </div>
      </div>
    </div>
  )
}
