import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { HiOutlineX } from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { enhancedCommandRegistry, parseCommand } from './enhancedCommandRegistry'
import type { CommandResult } from './types'
import { createWelcomeBanner } from './asciiArt'
import { useTheme } from '../../contexts/ThemeContext'
import { globalThemes, getGlobalThemeNames } from '../../themes/globalThemes'
import type { ThemeName } from '../../themes/themeTypes'

interface CommandTerminalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandTerminal({ isOpen, onClose }: CommandTerminalProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [output, setOutput] = useState<Array<{ type: 'input' | 'output' | 'error' | 'success' | 'info'; text: string }>>([])
  const [currentPath, setCurrentPath] = useState('~')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const { themeName, setTheme, availableThemes } = useTheme()
  
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Convex queries
  const projects = useQuery(api.projects.queries.getUserProjects, {})
  const tasks = useQuery(api.tasks.queries.getMyTasks, {})
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces, {})
  
  // Convex mutations
  const createProject = useMutation(api.projects.mutations.createProject)
  const updateProject = useMutation(api.projects.mutations.updateProject)
  const deleteProject = useMutation(api.projects.mutations.deleteProject)
  const connectRepository = useMutation(api.projects.mutations.connectRepository)
  const createTask = useMutation(api.tasks.mutations.createTask)
  const updateTask = useMutation(api.tasks.mutations.updateTask)
  const deleteTask = useMutation(api.tasks.mutations.deleteTask)
  const moveTask = useMutation(api.tasks.mutations.moveTask)

  // Generate welcome message with properly aligned ASCII art
  const welcomeMessage = createWelcomeBanner(
    user?.email || undefined,
    workspaces?.[0]?.name || undefined
  )

  // Initialize terminal
  useEffect(() => {
    if (isOpen && output.length === 0) {
      setOutput([
        { type: 'info', text: welcomeMessage },
        { type: 'success', text: `Terminal initialized. Theme: ${themeName.toUpperCase()}. Type "help" or "-h" for available commands.` }
      ])
    }
  }, [isOpen, welcomeMessage, themeName])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  // Update suggestions when input changes
  useEffect(() => {
    if (input.length > 0) {
      const { command, args } = parseCommand(input)
      
      if (!command) {
        // Suggest commands
        const suggestions = enhancedCommandRegistry.getSuggestions(input)
        if (suggestions.length > 0) {
          // Show the first suggestion after the current input
          const firstSuggestion = suggestions[0]
          if (firstSuggestion.startsWith(input)) {
            setSuggestion(firstSuggestion.slice(input.length))
          } else {
            setSuggestion('')
          }
        } else {
          setSuggestion('')
        }
      } else if (command === 'cd') {
        // Suggest directories
        const dirs = ['dashboard', 'projects', 'tasks', 'meetings', 'team', 'settings', 'profile']
        const partial = args[0] || ''
        const fullCommand = `cd ${partial}`
        const suggestions = dirs.filter(d => d.startsWith(partial))
        if (suggestions.length === 1 && partial !== suggestions[0]) {
          setSuggestion(suggestions[0].slice(partial.length))
        } else {
          setSuggestion('')
        }
      } else if (command === 'theme') {
        // Suggest theme names
        // Check if we have a space after 'theme'
        const hasSpace = input.includes('theme ') 
        const partial = args[0] || ''
        const allThemes = getGlobalThemeNames()
        const suggestions = allThemes.filter(t => t.startsWith(partial))
        
        if (suggestions.length > 0 && hasSpace) {
          // Always show the first matching suggestion
          const firstSuggestion = suggestions[0]
          if (partial.length < firstSuggestion.length) {
            // Show the part of the suggestion that comes after what's typed
            setSuggestion(firstSuggestion.slice(partial.length))
          } else {
            setSuggestion('')
          }
        } else {
          setSuggestion('')
        }
      } else {
        setSuggestion('')
      }
    } else {
      setSuggestion('')
    }
  }, [input])

  // Handle tab completion
  const handleTabCompletion = useCallback(() => {
    const { command, args } = parseCommand(input)
    
    if (!command && input.length > 0) {
      // Complete command
      const suggestions = enhancedCommandRegistry.getSuggestions(input)
      
      if (suggestions.length === 1) {
        setInput(suggestions[0] + ' ')
        setSuggestion('')
      } else if (suggestions.length > 1) {
        // Show suggestions
        setOutput(prev => [...prev, 
          { type: 'input', text: `${currentPath} $ ${input}` },
          { type: 'info', text: 'Suggestions: ' + suggestions.join('  ') }
        ])
      }
    } else if (command === 'cd') {
      // Complete directory names
      const dirs = ['dashboard', 'projects', 'tasks', 'meetings', 'team', 'settings', 'profile']
      const partial = args[0] || ''
      const suggestions = dirs.filter(d => d.startsWith(partial))
      
      if (suggestions.length === 1) {
        setInput(`cd ${suggestions[0]}`)
        setSuggestion('')
      } else if (suggestions.length > 1) {
        setOutput(prev => [...prev,
          { type: 'input', text: `${currentPath} $ ${input}` },
          { type: 'info', text: 'Directories: ' + suggestions.join('  ') }
        ])
      }
    } else if (command === 'create') {
      // Complete create types
      if (args.length === 0) {
        const types = ['project', 'task', 'meeting']
        setOutput(prev => [...prev,
          { type: 'input', text: `${currentPath} $ ${input}` },
          { type: 'info', text: 'Types: ' + types.join('  ') }
        ])
      }
    } else if (command === 'theme') {
      // Complete theme names
      const partial = args[0] || ''
      const suggestions = getGlobalThemeNames().filter(t => t.startsWith(partial))
      
      if (suggestions.length === 1) {
        setInput(`theme ${suggestions[0]}`)
        setSuggestion('')
      } else if (suggestions.length > 1) {
        setOutput(prev => [...prev,
          { type: 'input', text: `${currentPath} $ ${input}` },
          { type: 'info', text: 'Global Themes: ' + suggestions.join('  ') }
        ])
      }
    }
  }, [input, currentPath])

  // Handle theme change
  const changeTheme = useCallback((newTheme: string) => {
    const validThemes = getGlobalThemeNames()
    if (validThemes.includes(newTheme as ThemeName)) {
      setTheme(newTheme as ThemeName)
      setOutput(prev => [...prev, { type: 'success', text: `Global theme changed to ${newTheme.toUpperCase()}!` }])
    } else {
      setOutput(prev => [...prev, { type: 'error', text: `Invalid theme: ${newTheme}. Available themes: ${validThemes.join(', ')}` }])
    }
  }, [setTheme])

  // Execute command
  const executeCommand = useCallback(async (commandStr: string) => {
    if (!commandStr.trim()) return

    // Add to output
    setOutput(prev => [...prev, { type: 'input', text: `${currentPath} $ ${commandStr}` }])
    
    // Add to history
    setHistory(prev => [...prev, commandStr])
    setHistoryIndex(-1)
    
    // Parse and execute
    setIsProcessing(true)
    
    try {
      const { command, args, flags } = parseCommand(commandStr)
      
      // Handle theme command
      if (command === 'theme') {
        if (args.length === 0) {
          const themeList = getGlobalThemeNames().map(t => {
            const theme = globalThemes[t]
            const description = theme ? theme.description : 'No description available'
            return `  ${t.padEnd(15)} ${description}`
          }).join('\n')
          setOutput(prev => [...prev, { 
            type: 'info', 
            text: `Available global themes:\n${themeList}\n\nCurrent theme: ${themeName}\nUsage: theme <name>` 
          }])
        } else {
          changeTheme(args[0])
        }
        setIsProcessing(false)
        return
      }
      
      // Check for help flag
      if (flags.includes('-h') || flags.includes('--help')) {
        const helpText = enhancedCommandRegistry.getHelp(command)
        setOutput(prev => [...prev, { type: 'info', text: helpText }])
        setIsProcessing(false)
        return
      }

      // Execute command with full context
      const result = await enhancedCommandRegistry.execute(command, args, {
        flags,
        navigate,
        projects: projects || [],
        tasks: tasks || [],
        workspaces: workspaces || [],
        currentPath,
        setCurrentPath,
        user,
        mutations: {
          createProject,
          updateProject,
          deleteProject,
          connectRepository,
          createTask,
          updateTask,
          deleteTask,
          moveTask
        }
      })

      // Handle result
      if (result.success) {
        if (result.output) {
          setOutput(prev => [...prev, { type: result.type || 'output', text: result.output }])
        }
        if (result.action) {
          // Handle special actions like navigation
          switch (result.action.type) {
            case 'navigate':
              navigate(result.action.path)
              break
            case 'clear':
              setOutput([])
              break
            case 'exit':
              onClose()
              break
          }
        }
      } else {
        setOutput(prev => [...prev, { type: 'error', text: result.output }])
      }
    } catch (error) {
      setOutput(prev => [...prev, { type: 'error', text: `Error: ${error.message}` }])
    } finally {
      setIsProcessing(false)
    }
  }, [currentPath, navigate, projects, tasks, user, onClose, changeTheme, themeName])

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executeCommand(input)
      setInput('')
      setSuggestion('')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (suggestion) {
        setInput(input + suggestion)
        setSuggestion('')
      } else {
        handleTabCompletion()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
        setSuggestion('')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = Math.min(history.length - 1, historyIndex + 1)
        setHistoryIndex(newIndex)
        if (newIndex === history.length - 1) {
          setInput('')
          setHistoryIndex(-1)
        } else {
          setInput(history[newIndex])
        }
        setSuggestion('')
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [input, suggestion, executeCommand, handleTabCompletion, history, historyIndex, onClose])


  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-event-horizon/95 z-[9998]"
        onClick={onClose}
      />

      {/* Terminal Window */}
      <div 
        className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-1200px md:h-[80vh] shadow-brutal-xl z-[9999] flex flex-col"
        style={{
          backgroundColor: 'var(--theme-background)',
          border: '4px solid var(--theme-border)',
          boxShadow: '0 0 20px var(--theme-glow)'
        }}
      >
        {/* Terminal Header */}
        <div 
          className="px-16px py-8px flex items-center justify-between"
          style={{ backgroundColor: 'var(--theme-background-secondary)' }}
        >
          <div className="flex items-center gap-12px">
            <div className="flex gap-8px">
              <div className="w-12px h-12px" style={{ backgroundColor: 'var(--theme-error)' }} />
              <div className="w-12px h-12px" style={{ backgroundColor: 'var(--theme-warning)' }} />
              <div className="w-12px h-12px" style={{ backgroundColor: 'var(--theme-success)' }} />
            </div>
            <span 
              className="font-mono text-brutal-sm uppercase"
              style={{ color: 'var(--theme-foreground)' }}
            >
              LTF1 COMMAND CENTER - {themeName.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-4px hover:opacity-80 transition-opacity"
            title="Close Terminal (ESC)"
          >
            <HiOutlineX className="w-16px h-16px" style={{ color: 'var(--theme-foreground)' }} />
          </button>
        </div>

        {/* Terminal Output */}
        <div 
          ref={outputRef}
          className="flex-1 overflow-y-auto p-16px font-mono text-sm"
          style={{ 
            backgroundColor: 'var(--theme-background)',
            color: 'var(--theme-foreground)',
            textShadow: '0 0 2px var(--theme-glow)'
          }}
        >
          {output.map((line, index) => {
            // Apply theme-specific colors for ASCII art in info messages
            const isAsciiArt = line.type === 'info' && (line.text.includes('██') || line.text.includes('╔') || line.text.includes('║'));
            
            return (
              <div 
                key={index} 
                className="whitespace-pre-wrap"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  lineHeight: '1.4',
                  color: isAsciiArt ? 'var(--theme-primary)' : 
                         line.type === 'input' ? 'var(--theme-foreground)' :
                         line.type === 'error' ? 'var(--theme-error)' :
                         line.type === 'success' ? 'var(--theme-success)' :
                         line.type === 'info' ? 'var(--theme-info)' :
                         'var(--theme-foreground-secondary)',
                  textShadow: isAsciiArt ? '0 0 4px var(--theme-glow)' : 'none'
                }}
              >
                {line.text}
              </div>
            )
          })}
          
          {/* Current Input Line */}
          <div className="flex items-center mt-8px">
            <span style={{ color: 'var(--theme-info)' }} className="mr-4px">
              {currentPath}
            </span>
            <span style={{ color: 'var(--theme-primary)' }} className="mr-8px">
              $
            </span>
            <div className="flex-1 relative">
              <div className="relative inline-block w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing}
                  className="bg-transparent outline-none"
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    color: 'var(--theme-foreground)',
                    caretColor: 'var(--theme-primary)',
                    width: 'auto',
                    minWidth: '100%'
                  }}
                  spellCheck={false}
                  autoComplete="off"
                />
                {/* Autocomplete suggestion */}
                {suggestion && !isProcessing && (
                  <span 
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      fontFamily: "'Courier New', Courier, monospace",
                      color: 'var(--theme-foreground)',
                      opacity: 0.4,
                      whiteSpace: 'pre'
                    }}
                  >
                    {input}<span style={{ color: 'var(--theme-info)' }}>{suggestion}</span>
                  </span>
                )}
              </div>
            </div>
            {/* Blinking Cursor */}
            {isProcessing && <span className="animate-pulse ml-2px" style={{ color: 'var(--theme-primary)' }}>█</span>}
            {!isProcessing && <span className="animate-pulse ml-2px" style={{ color: 'var(--theme-primary)' }}>_</span>}
          </div>
        </div>

        {/* Terminal Footer */}
        <div 
          className="px-16px py-8px"
          style={{ 
            backgroundColor: 'var(--theme-background-secondary)',
            borderTop: '2px solid var(--theme-border)'
          }}
        >
          <div className="flex items-center justify-between text-brutal-xs font-mono" style={{ color: 'var(--theme-foreground-tertiary)' }}>
            <div className="flex items-center gap-16px">
              <span>TYPE 'help' FOR COMMANDS</span>
              <span>↑↓ FOR HISTORY</span>
              <span>TAB FOR COMPLETION</span>
              <span>ESC TO EXIT</span>
            </div>
            <div className="flex items-center gap-16px">
              <span style={{ color: 'var(--theme-info)' }}>
                THEME: {themeName.toUpperCase()}
              </span>
              <span style={{ 
                color: isProcessing ? 'var(--theme-warning)' : 'var(--theme-success)',
                animation: isProcessing ? 'pulse 1s infinite' : 'none'
              }}>
                {isProcessing ? 'PROCESSING...' : 'READY'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}