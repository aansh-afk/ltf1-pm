# LTF1 - Dev-Focused Project Management Platform

A comprehensive project management platform built specifically for development teams, featuring deep Git integration, AI-powered task generation, and a powerful CLI tool.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Convex account
- Clerk account

### Setup

1. Clone the repository
```bash
git clone <your-repo-url>
cd iceberg-L
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Fill in your Convex and Clerk credentials
```

4. Set up Convex
```bash
cd packages/backend
npx convex dev
# This will guide you through creating a Convex project
```

5. Run the development server
```bash
# From the root directory
pnpm dev
```

## 🏗️ Architecture

### Monorepo Structure
- `apps/web` - React + Vite web application
- `apps/cli` - Node.js CLI tool
- `packages/backend` - Convex backend
- `packages/types` - Shared TypeScript types
- `packages/ui` - Shared UI components

### Tech Stack
- **Frontend**: React, Vite, TypeScript, DaisyUI, Tailwind CSS
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **State**: Zustand + Convex reactive queries
- **Animations**: Framer Motion

## 🎨 Features

### Core Features
- ✅ Multi-workspace support
- ✅ Project and task management
- ✅ Real-time collaboration
- ✅ Role-based permissions
- 🚧 Meeting scheduler with Google Calendar
- 🚧 GitHub integration
- 🚧 AI-powered task generation
- 🚧 CLI tool for developers

### Development Status
- Phase 1: Core Data Model & Auth ✅
- Phase 2: Workspace Management (In Progress)
- Phase 3: Project & Task CRUD
- Phase 4: Team Features
- Phase 5: Meeting Integration
- Phase 6: Git Integration
- Phase 7: AI Features
- Phase 8: CLI Tool

## 🔧 Development

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
```

### Deployment
The app is configured for deployment on Vercel with Convex backend.

## 📝 License

MIT