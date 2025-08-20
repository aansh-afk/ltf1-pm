/**
 * WCAG ACCESSIBILITY COMPLIANCE SYSTEM
 * Ensures all theme color combinations meet WCAG 2.1 AA standards
 */

// Color contrast calculation utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(component => {
    component = component / 255;
    return component <= 0.03928
      ? component / 12.92
      : Math.pow((component + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// WCAG compliance levels
export enum WCAGLevel {
  AA = 4.5,        // Normal text
  AA_LARGE = 3.0,  // Large text (18pt+ or 14pt+ bold)
  AAA = 7.0,       // Enhanced contrast
  AAA_LARGE = 4.5  // Enhanced large text
}

export interface AccessibilityCheck {
  contrastRatio: number;
  passesAA: boolean;
  passesAALarge: boolean;
  passesAAA: boolean;
  passesAAALarge: boolean;
  recommendation?: string;
}

export function checkAccessibility(foreground: string, background: string): AccessibilityCheck {
  const contrastRatio = getContrastRatio(foreground, background);
  
  const check: AccessibilityCheck = {
    contrastRatio,
    passesAA: contrastRatio >= WCAGLevel.AA,
    passesAALarge: contrastRatio >= WCAGLevel.AA_LARGE,
    passesAAA: contrastRatio >= WCAGLevel.AAA,
    passesAAALarge: contrastRatio >= WCAGLevel.AAA_LARGE,
  };

  // Generate recommendations
  if (!check.passesAA) {
    check.recommendation = `Insufficient contrast (${contrastRatio.toFixed(2)}:1). Minimum required: 4.5:1`;
  } else if (!check.passesAAA) {
    check.recommendation = `Meets AA standards but could be improved for AAA (${contrastRatio.toFixed(2)}:1 / 7.0:1 required)`;
  }

  return check;
}

// Theme accessibility validation
export interface ThemeAccessibilityReport {
  themeName: string;
  overallCompliance: 'AAA' | 'AA' | 'FAIL';
  criticalIssues: string[];
  warnings: string[];
  checks: {
    [combination: string]: AccessibilityCheck;
  };
}

export function validateThemeAccessibility(theme: any): ThemeAccessibilityReport {
  const report: ThemeAccessibilityReport = {
    themeName: theme.name,
    overallCompliance: 'AAA',
    criticalIssues: [],
    warnings: [],
    checks: {}
  };

  // Critical color combinations that must pass AA
  const criticalCombinations = [
    { name: 'Body Text', fg: theme.colors.foreground, bg: theme.colors.background },
    { name: 'Secondary Text', fg: theme.colors.foregroundSecondary, bg: theme.colors.background },
    { name: 'Primary Button', fg: theme.colors.background, bg: theme.colors.primary },
    { name: 'Error State', fg: theme.colors.background, bg: theme.colors.error },
    { name: 'Success State', fg: theme.colors.background, bg: theme.colors.success },
    { name: 'Warning State', fg: theme.colors.background, bg: theme.colors.warning },
    { name: 'Info State', fg: theme.colors.background, bg: theme.colors.info },
    { name: 'Border Focus', fg: theme.colors.borderFocus, bg: theme.colors.background },
  ];

  // Check all critical combinations
  for (const combo of criticalCombinations) {
    const check = checkAccessibility(combo.fg, combo.bg);
    report.checks[combo.name] = check;

    if (!check.passesAA) {
      report.criticalIssues.push(`${combo.name}: ${check.recommendation}`);
      report.overallCompliance = 'FAIL';
    } else if (!check.passesAAA && report.overallCompliance === 'AAA') {
      report.overallCompliance = 'AA';
      report.warnings.push(`${combo.name}: Could be improved for AAA compliance`);
    }
  }

  return report;
}

// High contrast mode utilities
export function enableHighContrastMode(): void {
  document.documentElement.setAttribute('data-accessibility', 'high-contrast');
  localStorage.setItem('accessibility-mode', 'high-contrast');
}

export function disableHighContrastMode(): void {
  document.documentElement.removeAttribute('data-accessibility');
  localStorage.removeItem('accessibility-mode');
}

export function toggleHighContrastMode(): void {
  const isEnabled = document.documentElement.getAttribute('data-accessibility') === 'high-contrast';
  if (isEnabled) {
    disableHighContrastMode();
  } else {
    enableHighContrastMode();
  }
}

export function initializeAccessibilityMode(): void {
  const savedMode = localStorage.getItem('accessibility-mode');
  if (savedMode === 'high-contrast') {
    enableHighContrastMode();
  }
}

// Focus management utilities
export function enhanceFocusVisibility(): void {
  document.documentElement.classList.add('focus-enhanced');
}

export function restoreFocusVisibility(): void {
  document.documentElement.classList.remove('focus-enhanced');
}

// Keyboard navigation utilities
export function initializeKeyboardNavigation(): void {
  document.addEventListener('keydown', (event) => {
    // Tab navigation enhancement
    if (event.key === 'Tab') {
      document.documentElement.classList.add('user-is-tabbing');
    }
  });

  document.addEventListener('mousedown', () => {
    document.documentElement.classList.remove('user-is-tabbing');
  });
}

// Screen reader utilities
export function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Motion preferences
export function respectsReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initializeMotionPreferences(): void {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  function handleMotionPreference(e: MediaQueryListEvent | MediaQueryList) {
    if (e.matches) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }
  
  handleMotionPreference(mediaQuery);
  mediaQuery.addEventListener('change', handleMotionPreference);
}