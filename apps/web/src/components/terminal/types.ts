// Command System Type Definitions

export interface CommandResult {
  success: boolean
  output: string
  type?: 'output' | 'error' | 'success' | 'info' | 'warning'
  action?: {
    type: 'navigate' | 'clear' | 'exit' | 'reload' | 'theme'
    path?: string
    value?: any
  }
}

export interface CommandContext {
  flags: string[]
  navigate: (path: string) => void
  projects: any[]
  tasks: any[]
  workspaces: any[]
  currentPath: string
  setCurrentPath: (path: string) => void
  user: any
  history?: string[]
  mutations?: {
    createProject?: (args: any) => Promise<any>
    updateProject?: (args: any) => Promise<any>
    deleteProject?: (args: any) => Promise<any>
    connectRepository?: (args: any) => Promise<any>
    createTask?: (args: any) => Promise<any>
    updateTask?: (args: any) => Promise<any>
    deleteTask?: (args: any) => Promise<any>
    moveTask?: (args: any) => Promise<any>
    createSprint?: (args: any) => Promise<any>
    startSprint?: (args: any) => Promise<any>
    endSprint?: (args: any) => Promise<any>
    inviteTeamMember?: (args: any) => Promise<any>
    removeTeamMember?: (args: any) => Promise<any>
    updateMemberRole?: (args: any) => Promise<any>
  }
}

export interface Command {
  name: string
  aliases?: string[]
  description: string
  usage: string
  examples?: string[]
  execute: (args: string[], context: CommandContext) => Promise<CommandResult> | CommandResult
}