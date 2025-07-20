# Iceberg PM - Project Structure

```
iceberg-pm/
├── apps/
│   ├── web/                      # Main React web application
│   │   ├── src/
│   │   │   ├── components/       # Shared UI components
│   │   │   │   ├── layout/      # Layout components
│   │   │   │   ├── common/      # Common reusable components
│   │   │   │   └── features/    # Feature-specific components
│   │   │   ├── features/        # Feature modules
│   │   │   │   ├── auth/        # Authentication
│   │   │   │   ├── workspace/   # Workspace management
│   │   │   │   ├── projects/    # Project management
│   │   │   │   ├── tasks/       # Task management
│   │   │   │   ├── meetings/    # Meeting scheduler
│   │   │   │   ├── calendar/    # Calendar integration
│   │   │   │   ├── git/         # GitHub integration
│   │   │   │   ├── analytics/   # Developer metrics
│   │   │   │   └── ai/          # AI features
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── pages/           # Route pages
│   │   │   ├── styles/          # Global styles & themes
│   │   │   ├── utils/           # Frontend utilities
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── cli/                      # CLI application
│       ├── src/
│       │   ├── commands/         # CLI commands
│       │   │   ├── task/        # Task management commands
│       │   │   ├── project/     # Project commands
│       │   │   ├── workspace/   # Workspace commands
│       │   │   └── auth/        # Auth commands
│       │   ├── utils/           # CLI utilities
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── backend/                  # Convex backend
│   │   ├── convex/
│   │   │   ├── auth/            # Auth functions
│   │   │   ├── workspaces/      # Workspace functions
│   │   │   ├── projects/        # Project functions
│   │   │   ├── tasks/           # Task functions
│   │   │   ├── meetings/        # Meeting functions
│   │   │   ├── integrations/    # External integrations
│   │   │   │   ├── github/      # GitHub integration
│   │   │   │   └── google/      # Google services
│   │   │   ├── ai/              # AI functions
│   │   │   ├── notifications/   # Notification system
│   │   │   ├── _generated/      # Convex generated files
│   │   │   ├── schema.ts        # Database schema
│   │   │   └── functions.ts     # Shared functions
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                    # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── entities/        # Entity types
│   │   │   ├── api/             # API types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                       # Shared UI components
│   │   ├── src/
│   │   │   ├── components/      # Reusable components
│   │   │   ├── hooks/           # Shared hooks
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── utils/                    # Shared utilities
│       ├── src/
│       │   ├── date/            # Date utilities
│       │   ├── validation/      # Validation helpers
│       │   ├── formatting/      # Formatters
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── config/                       # Shared configuration
│   ├── eslint/                  # ESLint configs
│   ├── prettier/                # Prettier config
│   └── typescript/              # TypeScript configs
│
├── docs/                        # Documentation
│   ├── api/                     # API documentation
│   ├── architecture/            # Architecture decisions
│   └── guides/                  # User & dev guides
│
├── scripts/                     # Build & deployment scripts
│   ├── build.ts
│   ├── deploy.ts
│   └── dev.ts
│
├── .github/                     # GitHub configuration
│   └── workflows/               # CI/CD workflows
│
├── pnpm-workspace.yaml          # Monorepo configuration
├── package.json                 # Root package.json
├── tsconfig.base.json          # Base TypeScript config
├── .gitignore
├── .env.example
└── README.md
```

## Feature Module Structure Example (tasks/)

```
features/tasks/
├── components/              # Task-specific components
│   ├── TaskCard.tsx
│   ├── TaskList.tsx
│   ├── TaskBoard.tsx
│   └── TaskDetails.tsx
├── hooks/                   # Task-specific hooks
│   ├── useTask.ts
│   └── useTasks.ts
├── pages/                   # Task pages
│   ├── TasksPage.tsx
│   └── TaskDetailPage.tsx
├── utils/                   # Task utilities
│   └── taskHelpers.ts
└── index.ts                # Module exports
```

## Key Design Decisions

1. **Feature-based organization** in the web app for better scalability
2. **Separate backend package** for Convex to enable better testing and modularity
3. **Shared packages** for types, UI components, and utilities
4. **Clear separation** between business logic (Convex) and presentation (React)
5. **Organized integrations** in dedicated folders
6. **Consistent structure** across all packages and apps