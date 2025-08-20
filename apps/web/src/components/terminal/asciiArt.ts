// ASCII Art utilities for LTF1 Terminal
// Ensures proper alignment and formatting of all ASCII art

export const ASCII_WIDTH = 74 // Standard width for all ASCII art boxes

// Pad a string to the specified width, accounting for actual character width
export const padToWidth = (str: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string => {
  // Calculate actual visible length (strip ANSI codes if any)
  const visibleLength = str.replace(/\x1b\[[0-9;]*m/g, '').length
  const padding = Math.max(0, width - visibleLength)
  
  if (align === 'center') {
    const leftPad = Math.floor(padding / 2)
    const rightPad = padding - leftPad
    return ' '.repeat(leftPad) + str + ' '.repeat(rightPad)
  } else if (align === 'right') {
    return ' '.repeat(padding) + str
  } else {
    return str + ' '.repeat(padding)
  }
}

// Create a box line with proper alignment
export const createBoxLine = (content: string, align: 'left' | 'center' | 'right' = 'left'): string => {
  const innerWidth = ASCII_WIDTH - 4 // Account for "║ " and " ║"
  const paddedContent = padToWidth(content, innerWidth, align)
  return `║ ${paddedContent} ║`
}

// Create a full box with header
export const createBox = (title: string, lines: string[] = []): string => {
  const result: string[] = []
  
  // Top border
  result.push('╔' + '═'.repeat(ASCII_WIDTH - 2) + '╗')
  
  // Title (centered)
  if (title) {
    result.push(createBoxLine(title, 'center'))
    result.push(createBoxLine('', 'center')) // Empty line after title
  }
  
  // Content lines
  for (const line of lines) {
    result.push(createBoxLine(line, 'left'))
  }
  
  // Bottom border
  result.push('╚' + '═'.repeat(ASCII_WIDTH - 2) + '╝')
  
  return result.join('\n')
}

// Fixed LTF1 ASCII Logo with proper alignment
export const LTF1_LOGO = `╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║      ██╗     ████████╗███████╗ ██╗                                   ║
║      ██║     ╚══██╔══╝██╔════╝███║                                   ║
║      ██║        ██║   █████╗  ╚██║                                   ║
║      ██║        ██║   ██╔══╝   ██║                                   ║
║      ███████╗   ██║   ██║      ██║                                   ║
║      ╚══════╝   ╚═╝   ╚═╝      ╚═╝                                   ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝`

// Create the welcome banner with proper alignment
export const createWelcomeBanner = (user: string | undefined, workspace: string | undefined): string => {
  const lines: string[] = []
  
  // ASCII art lines (centered in the box)
  lines.push('')
  lines.push('     ██╗     ████████╗███████╗ ██╗')
  lines.push('     ██║     ╚══██╔══╝██╔════╝███║')
  lines.push('     ██║        ██║   █████╗  ╚██║')
  lines.push('     ██║        ██║   ██╔══╝   ██║')
  lines.push('     ███████╗   ██║   ██║      ██║')
  lines.push('     ╚══════╝   ╚═╝   ╚═╝      ╚═╝')
  lines.push('')
  lines.push('COMMAND CENTER v2.0.0 | TYPE \'help\' OR \'-h\' FOR COMMANDS')
  lines.push(`USER: ${user || 'ANONYMOUS'}`)
  lines.push(`WORKSPACE: ${workspace || 'NO WORKSPACE'}`)
  
  return createBox('', lines)
}

// Analytics box headers with consistent width
export const createAnalyticsBox = (title: string, content: string[]): string => {
  return createBox(title, content)
}

// Progress bar with proper width
export const createProgressBar = (percentage: number, width: number = 20): string => {
  const filled = Math.floor(width * (percentage / 100))
  const empty = width - filled
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`
}

// Create a chart line for analytics
export const createChartLine = (label: string, value: number, maxValue: number): string => {
  const barWidth = 30
  const percentage = (value / maxValue) * 100
  const bar = createProgressBar(percentage, barWidth)
  return `${padToWidth(label + ':', 15)} ${bar} ${value}`
}

// Fixed-width separator line
export const SEPARATOR = '─'.repeat(ASCII_WIDTH - 4)

// Create section header with separator
export const createSectionHeader = (title: string): string => {
  return `${title}:\n${SEPARATOR}`
}