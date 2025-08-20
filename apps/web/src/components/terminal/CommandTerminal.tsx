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

  // ASCII Art Welcome Message
  const welcomeMessage = `
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║     ██╗  ████████╗███████╗ ██╗    ████████╗███████╗██████╗ ███╗   ███╗ ║
║     ██║  ╚══██╔══╝██╔════╝███║    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║ ║
║     ██║     ██║   █████╗  ╚██║       ██║   █████╗  ██████╔╝██╔████╔██║ ║
║     ██║     ██║   ██╔══╝   ██║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║ ║
║     ███████╗██║   ██║      ██║       ██║   ███████╗██║  ██║██║ ╚═╝ ██║ ║
║     ╚══════╝╚═╝   ╚═╝      ╚═╝       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ║
║                                                                      ║
║     COMMAND CENTER v1.0.0 | TYPE 'help' OR '-h' FOR COMMANDS        ║
║     USER: ${user?.email?.padEnd(58) || 'ANONYMOUS'.padEnd(58)} ║
║     WORKSPACE: ${workspaces?.[0]?.name?.padEnd(54) || 'NO WORKSPACE'.padEnd(54)} ║
╚══════════════════════════════════════════════════════════════════════╝
`

  // Initialize terminal
  useEffect(() => {
    if (isOpen && output.length === 0) {
      setOutput([
        { type: 'info', text: welcomeMessage },
        { type: 'success', text: 'Terminal initialized. Type "help" or "-h" for available commands.' }
      ])
    }
  }, [isOpen])

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
  }, [currentPath, navigate, projects, tasks, user, onClose])

  // Handle tab completion
  const handleTabCompletion = useCallback(() => {
    const { command, args } = parseCommand(input)
    
    if (!command && input.length > 0) {
      // Complete command
      const suggestions = enhancedCommandRegistry.getSuggestions(input)
      
      if (suggestions.length === 1) {
        setInput(suggestions[0] + ' ')
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
    }
  }, [input, currentPath])

  // Handle input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        executeCommand(input)
        setInput('')
        break
      
      case 'ArrowUp':
        e.preventDefault()
        if (history.length > 0) {
          const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
          setHistoryIndex(newIndex)
          setInput(history[newIndex])
        }
        break
      
      case 'ArrowDown':
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
        }
        break
      
      case 'Tab':
        e.preventDefault()
        handleTabCompletion()
        break
      
      case 'Escape':
        onClose()
        break
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-event-horizon/95 z-[9998]"
        onClick={onClose}
      />

      {/* Terminal Window */}
      <div className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-1200px md:h-[80vh] bg-black border-4 border-primary-brutalist shadow-brutal-xl z-[9999] flex flex-col">
        {/* Terminal Header */}
        <div className="bg-primary-brutalist px-16px py-8px flex items-center justify-between">
          <div className="flex items-center gap-12px">
            <div className="flex gap-8px">
              <div className="w-12px h-12px bg-brutal-error" />
              <div className="w-12px h-12px bg-brutal-warning" />
              <div className="w-12px h-12px bg-brutal-success" />
            </div>
            <span className="font-mono text-event-horizon text-brutal-sm uppercase">
              LTF1 COMMAND CENTER
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-4px hover:bg-event-horizon/20 transition-colors"
          >
            <HiOutlineX className="w-16px h-16px text-event-horizon" />
          </button>
        </div>

        {/* Terminal Output */}
        <div 
          ref={outputRef}
          className="flex-1 overflow-y-auto p-16px font-mono text-sm"
          style={{ 
            backgroundColor: '#0a0a0a',
            color: '#00ff00',
            textShadow: '0 0 2px #00ff00'
          }}
        >
          {output.map((line, index) => (
            <div 
              key={index} 
              className={clsx(
                'whitespace-pre-wrap',
                line.type === 'input' && 'text-cathode-white',
                line.type === 'error' && 'text-brutal-error',
                line.type === 'success' && 'text-brutal-success',
                line.type === 'info' && 'text-primary-brutalist',
                line.type === 'output' && 'text-terminal-green'
              )}
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                lineHeight: '1.4'
              }}
            >
              {line.text}
            </div>
          ))}
          
          {/* Current Input Line */}
          <div className="flex items-center mt-8px">
            <span className="text-cathode-white mr-8px">
              {currentPath} $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              className="flex-1 bg-transparent outline-none text-terminal-green"
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                caretColor: '#00ff00'
              }}
              spellCheck={false}
              autoComplete="off"
            />
            {/* Blinking Cursor */}
            {isProcessing && <span className="animate-pulse ml-2px">█</span>}
            {!isProcessing && <span className="animate-pulse ml-2px">_</span>}
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="bg-carbon-plate border-t-2 border-basalt-border px-16px py-8px">
          <div className="flex items-center justify-between text-brutal-xs text-cathode-white/60 font-mono">
            <div className="flex items-center gap-16px">
              <span>TYPE 'help' FOR COMMANDS</span>
              <span>↑↓ FOR HISTORY</span>
              <span>TAB FOR COMPLETION</span>
            </div>
            <div className="flex items-center gap-16px">
              <span className={clsx(
                isProcessing ? 'text-brutal-warning animate-pulse' : 'text-brutal-success'
              )}>
                {isProcessing ? 'PROCESSING...' : 'READY'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}