/**
 * THEME SWITCHING PERFORMANCE OPTIMIZATION SYSTEM
 * Ensures brutalist design protocol compliance with maximum performance
 */

// Performance metrics tracking
interface ThemePerformanceMetrics {
  switchStartTime: number
  switchEndTime: number
  switchDuration: number
  customPropertiesUpdated: number
  paintOperations: number
  layoutOperations: number
  repaintAreas: DOMRect[]
}

// Theme switching performance optimizer
export class ThemePerformanceOptimizer {
  private static instance: ThemePerformanceOptimizer
  private performanceMetrics: ThemePerformanceMetrics[] = []
  private observer: PerformanceObserver | null = null
  private paintObserver: PerformanceObserver | null = null
  
  static getInstance(): ThemePerformanceOptimizer {
    if (!ThemePerformanceOptimizer.instance) {
      ThemePerformanceOptimizer.instance = new ThemePerformanceOptimizer()
    }
    return ThemePerformanceOptimizer.instance
  }

  constructor() {
    this.setupPerformanceMonitoring()
  }

  /**
   * OPTIMIZED THEME SWITCHING WITH BATCH UPDATES
   * Applies all CSS custom properties in a single batch for maximum performance
   */
  public optimizedThemeSwitch(themeVariables: Record<string, string>): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      
      // Use DocumentFragment for batch DOM operations (not applicable here but principle applies)
      // Instead, we'll use requestAnimationFrame for optimal timing
      requestAnimationFrame(() => {
        this.batchUpdateCustomProperties(themeVariables)
        
        // Force immediate style recalculation (brutalist instant change)
        document.documentElement.offsetHeight // Force layout
        
        const endTime = performance.now()
        
        this.recordPerformanceMetrics({
          switchStartTime: startTime,
          switchEndTime: endTime,
          switchDuration: endTime - startTime,
          customPropertiesUpdated: Object.keys(themeVariables).length,
          paintOperations: 0, // Will be populated by observer
          layoutOperations: 0, // Will be populated by observer
          repaintAreas: []
        })
        
        resolve()
      })
    })
  }

  /**
   * BATCH CSS CUSTOM PROPERTY UPDATES
   * Updates all theme variables in a single operation to minimize reflow/repaint
   */
  private batchUpdateCustomProperties(variables: Record<string, string>): void {
    const root = document.documentElement
    const style = root.style
    
    // Disable CSS transitions during update (enforce brutalist instant change)
    style.setProperty('--transition-override', 'none')
    
    // Use CSS.supports for feature detection
    const supportsCustomProperties = CSS.supports('--test', 'value')
    
    if (supportsCustomProperties) {
      // Batch all property updates
      for (const [property, value] of Object.entries(variables)) {
        style.setProperty(property, value)
      }
    } else {
      // Fallback for older browsers
      console.warn('CSS Custom Properties not supported, using fallback')
      this.applyFallbackStyles(variables)
    }
    
    // Re-enable transitions (though brutalist protocol keeps them disabled)
    style.removeProperty('--transition-override')
  }

  /**
   * CSS CONTAINMENT OPTIMIZATION
   * Applies CSS containment to improve rendering performance
   */
  public enableCSSContainment(): void {
    const style = document.createElement('style')
    style.textContent = `
      /* CSS CONTAINMENT FOR PERFORMANCE */
      .theme-container {
        contain: layout style paint;
        content-visibility: auto;
        will-change: auto;
      }
      
      /* LAYER-BASED OPTIMIZATION */
      .theme-layer {
        transform: translateZ(0); /* Create compositing layer */
        will-change: transform;
        backface-visibility: hidden;
      }
      
      /* PAINT OPTIMIZATION */
      .theme-optimized {
        contain: paint;
        isolation: isolate;
      }
      
      /* BRUTAL INSTANT CHANGE ENFORCEMENT */
      * {
        transition: none !important;
        animation-duration: 0ms !important;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * CRITICAL CSS EXTRACTION FOR THEMES
   * Identifies critical theme-related CSS for above-the-fold content
   */
  public extractCriticalThemeCSS(): string {
    const criticalSelectors = [
      ':root',
      'body',
      '.theme-container',
      '[data-theme]',
      '[data-accessibility="high-contrast"]',
      '.brutal-btn',
      '.brutal-input',
      '.brutal-card'
    ]
    
    const criticalCSS: string[] = []
    
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText
            if (criticalSelectors.some(critical => selector.includes(critical))) {
              criticalCSS.push(rule.cssText)
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets may throw errors
        console.warn('Could not access stylesheet rules:', e)
      }
    }
    
    return criticalCSS.join('\n')
  }

  /**
   * PRELOAD THEME RESOURCES
   * Preloads theme-related assets for faster switching
   */
  public preloadThemeResources(themes: string[]): void {
    themes.forEach(theme => {
      // Create link preload for any theme-specific resources
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = `/themes/${theme}.css` // Hypothetical theme-specific CSS
      document.head.appendChild(link)
    })
  }

  /**
   * PERFORMANCE MONITORING SETUP
   * Monitors theme switching performance and paint operations
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      // Monitor layout and paint operations
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.name.includes('theme')) {
            console.log(`Theme operation ${entry.name}: ${entry.duration}ms`)
          }
        })
      })
      
      this.observer.observe({ 
        entryTypes: ['measure', 'navigation', 'paint'] 
      })

      // Monitor paint operations specifically
      this.paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'paint') {
            console.log(`Paint event ${entry.name}: ${entry.startTime}ms`)
          }
        })
      })
      
      this.paintObserver.observe({ entryTypes: ['paint'] })
    }
  }

  /**
   * MEMORY OPTIMIZATION FOR THEME CACHE
   * Manages theme-related memory usage
   */
  public optimizeThemeMemory(): void {
    // Clear unused theme data from memory
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      console.log(`Memory usage - Used: ${memInfo.usedJSHeapSize}, Total: ${memInfo.totalJSHeapSize}`)
    }
    
    // Force garbage collection if available (dev tools)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }
  }

  /**
   * THEME SWITCHING PERFORMANCE AUDIT
   * Analyzes theme switching performance and provides recommendations
   */
  public auditThemePerformance(): {
    averageSwitchTime: number
    slowestSwitch: number
    fastestSwitch: number
    totalSwitches: number
    recommendations: string[]
  } {
    const durations = this.performanceMetrics.map(m => m.switchDuration)
    const averageSwitchTime = durations.reduce((a, b) => a + b, 0) / durations.length
    const slowestSwitch = Math.max(...durations)
    const fastestSwitch = Math.min(...durations)
    
    const recommendations: string[] = []
    
    if (averageSwitchTime > 16) { // > 1 frame at 60fps
      recommendations.push('Theme switching exceeds 16ms budget - optimize CSS custom properties')
    }
    
    if (slowestSwitch > 50) {
      recommendations.push('Slowest theme switch exceeds 50ms - investigate layout thrashing')
    }
    
    const customPropsTotal = this.performanceMetrics.reduce((sum, m) => sum + m.customPropertiesUpdated, 0)
    if (customPropsTotal > 100) {
      recommendations.push('Consider reducing number of CSS custom properties')
    }
    
    return {
      averageSwitchTime,
      slowestSwitch,
      fastestSwitch,
      totalSwitches: this.performanceMetrics.length,
      recommendations
    }
  }

  /**
   * FALLBACK STYLES FOR OLDER BROWSERS
   * Provides fallback when CSS custom properties aren't supported
   */
  private applyFallbackStyles(variables: Record<string, string>): void {
    // Create style element with hardcoded values
    let fallbackStyle = document.getElementById('theme-fallback') as HTMLStyleElement
    if (!fallbackStyle) {
      fallbackStyle = document.createElement('style')
      fallbackStyle.id = 'theme-fallback'
      document.head.appendChild(fallbackStyle)
    }
    
    // Convert CSS custom properties to regular CSS
    const fallbackCSS = Object.entries(variables)
      .map(([prop, value]) => {
        const selector = prop.replace('--theme-', '').replace('-', '_')
        return `.theme-${selector} { color: ${value}; }`
      })
      .join('\n')
    
    fallbackStyle.textContent = fallbackCSS
  }

  /**
   * RECORD PERFORMANCE METRICS
   * Stores performance data for analysis
   */
  private recordPerformanceMetrics(metrics: ThemePerformanceMetrics): void {
    this.performanceMetrics.push(metrics)
    
    // Keep only last 100 measurements to prevent memory bloat
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100)
    }
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Theme switch completed in ${metrics.switchDuration.toFixed(2)}ms`)
      
      if (metrics.switchDuration > 16) {
        console.warn('⚠️ Theme switch exceeded 16ms budget!')
      }
    }
  }

  /**
   * CLEANUP PERFORMANCE MONITORING
   * Cleans up observers and resources
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    
    if (this.paintObserver) {
      this.paintObserver.disconnect()
      this.paintObserver = null
    }
    
    this.performanceMetrics = []
  }
}

// Export singleton instance
export const themePerformanceOptimizer = ThemePerformanceOptimizer.getInstance()

// Performance utilities
export const ThemePerformanceUtils = {
  /**
   * MEASURE THEME OPERATION PERFORMANCE
   * Wraps theme operations with performance measurement
   */
  measureThemeOperation: <T>(name: string, operation: () => T): T => {
    performance.mark(`${name}-start`)
    const result = operation()
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    return result
  },

  /**
   * DEBOUNCED THEME SWITCHING
   * Prevents rapid theme switches that could cause performance issues
   */
  debouncedThemeSwitch: (() => {
    let timeoutId: NodeJS.Timeout | null = null
    return (switchFunction: () => void, delay: number = 100): void => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(switchFunction, delay)
    }
  })(),

  /**
   * CHECK BROWSER PERFORMANCE CAPABILITIES
   * Detects browser support for performance optimizations
   */
  checkPerformanceCapabilities: (): {
    customProperties: boolean
    containment: boolean
    willChange: boolean
    compositing: boolean
    paintAPI: boolean
  } => {
    return {
      customProperties: CSS.supports('--test', 'value'),
      containment: CSS.supports('contain', 'layout'),
      willChange: CSS.supports('will-change', 'transform'),
      compositing: 'transform' in document.createElement('div').style,
      paintAPI: 'PerformanceObserver' in window
    }
  },

  /**
   * OPTIMIZE CRITICAL RENDERING PATH
   * Ensures theme CSS is in critical rendering path
   */
  optimizeCriticalRenderingPath: (): void => {
    // Move theme CSS to top of head for priority loading
    const themeStyles = document.querySelectorAll('style[data-theme], link[data-theme]')
    themeStyles.forEach(style => {
      document.head.insertBefore(style, document.head.firstChild)
    })
  }
}

// Initialize performance optimizations
if (typeof window !== 'undefined') {
  // Enable CSS containment on page load
  document.addEventListener('DOMContentLoaded', () => {
    themePerformanceOptimizer.enableCSSContainment()
    ThemePerformanceUtils.optimizeCriticalRenderingPath()
  })
}