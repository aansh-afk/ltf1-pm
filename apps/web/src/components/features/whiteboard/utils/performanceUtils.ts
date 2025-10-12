/**
 * Performance Utilities for Whiteboard Canvas
 *
 * Includes throttling, debouncing, batching, and performance monitoring
 */

/**
 * Debounce function that delays execution until after wait time
 * Uses requestAnimationFrame for smooth 60fps updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 16 // ~60fps
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let rafId: number | null = null

  return function debounced(...args: Parameters<T>) {
    // Cancel previous scheduled calls
    if (timeoutId) clearTimeout(timeoutId)
    if (rafId) cancelAnimationFrame(rafId)

    if (wait === 0) {
      // Use requestAnimationFrame for immediate but frame-synced updates
      rafId = requestAnimationFrame(() => {
        func(...args)
      })
    } else {
      // Use setTimeout for longer delays
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          func(...args)
        })
      }, wait)
    }
  }
}

/**
 * Throttle function that limits execution to once per wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 16 // ~60fps
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  return function throttled(...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall >= wait) {
      lastCall = now
      func(...args)
    } else {
      // Schedule for later if not executed
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        func(...args)
      }, wait - timeSinceLastCall)
    }
  }
}

/**
 * Batch update manager for collecting multiple updates and flushing them
 */
export class BatchManager<T> {
  private batch: T[] = []
  private flushTimeout: NodeJS.Timeout | null = null
  private flushDelay: number
  private maxBatchSize: number
  private onFlush: (items: T[]) => void

  constructor(
    onFlush: (items: T[]) => void,
    flushDelay: number = 100,
    maxBatchSize: number = 50
  ) {
    this.onFlush = onFlush
    this.flushDelay = flushDelay
    this.maxBatchSize = maxBatchSize
  }

  /**
   * Add item to batch
   */
  add(item: T): void {
    this.batch.push(item)

    // Flush immediately if batch is full
    if (this.batch.length >= this.maxBatchSize) {
      this.flush()
      return
    }

    // Schedule flush
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
    }

    this.flushTimeout = setTimeout(() => {
      this.flush()
    }, this.flushDelay)
  }

  /**
   * Flush batch immediately
   */
  flush(): void {
    if (this.batch.length === 0) return

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
      this.flushTimeout = null
    }

    const items = [...this.batch]
    this.batch = []
    this.onFlush(items)
  }

  /**
   * Clear batch without flushing
   */
  clear(): void {
    this.batch = []
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
      this.flushTimeout = null
    }
  }

  /**
   * Get current batch size
   */
  size(): number {
    return this.batch.length
  }
}

/**
 * Performance monitor for tracking FPS and frame times
 */
export class PerformanceMonitor {
  private frameTimes: number[] = []
  private maxSamples: number = 60
  private lastFrameTime: number = performance.now()
  private enabled: boolean = false
  private warningThreshold: number = 16 // 60fps target

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  /**
   * Record a frame
   */
  recordFrame(): void {
    if (!this.enabled) return

    const now = performance.now()
    const frameTime = now - this.lastFrameTime
    this.lastFrameTime = now

    this.frameTimes.push(frameTime)
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift()
    }

    // Warn if frame time is too high
    if (frameTime > this.warningThreshold) {
      console.warn(`[Performance] Slow frame detected: ${frameTime.toFixed(2)}ms`)
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    if (this.frameTimes.length === 0) return 0

    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    return 1000 / averageFrameTime
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
  }

  /**
   * Get max frame time
   */
  getMaxFrameTime(): number {
    if (this.frameTimes.length === 0) return 0
    return Math.max(...this.frameTimes)
  }

  /**
   * Get performance stats
   */
  getStats(): {
    fps: number
    avgFrameTime: number
    maxFrameTime: number
    samples: number
  } {
    return {
      fps: this.getFPS(),
      avgFrameTime: this.getAverageFrameTime(),
      maxFrameTime: this.getMaxFrameTime(),
      samples: this.frameTimes.length,
    }
  }

  /**
   * Reset stats
   */
  reset(): void {
    this.frameTimes = []
    this.lastFrameTime = performance.now()
  }
}

/**
 * Memory-efficient object pool for frequently created/destroyed items
 */
export class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (item: T) => void
  private maxSize: number

  constructor(factory: () => T, reset: (item: T) => void, maxSize: number = 100) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize
  }

  /**
   * Acquire object from pool or create new one
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }

  /**
   * Release object back to pool
   */
  release(item: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(item)
      this.pool.push(item)
    }
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.pool = []
  }

  /**
   * Get pool size
   */
  size(): number {
    return this.pool.length
  }
}

/**
 * Measure execution time of a function
 */
export function measureTime<T>(
  name: string,
  fn: () => T,
  warnThreshold: number = 16
): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  const duration = end - start

  if (duration > warnThreshold) {
    console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
  }

  return result
}

/**
 * Measure async execution time
 */
export async function measureTimeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  warnThreshold: number = 50
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  const duration = end - start

  if (duration > warnThreshold) {
    console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
  }

  return result
}
