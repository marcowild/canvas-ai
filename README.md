# CanvasAI - AI Workflow Builder

A node-based AI workflow builder inspired by Weavy.ai, built with React, React Flow, Supabase, and fal.ai integration.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Rendering**: SSR with react-router and Vite
- **Canvas**: React Flow (node-based workflow editor)
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Auth**: Supabase Authentication
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI Models**: fal.ai SDK
- **Server**: Express.js

## Features (Planned)

- ✅ SSR-rendered React application
- ✅ Project structure and routing
- ✅ Supabase authentication setup
- ✅ State management with Zustand
- 🚧 Node-based workflow canvas with React Flow
- 🚧 AI model integration (fal.ai)
- 🚧 Workflow execution engine
- 🚧 Basic image editing tools
- 🚧 Workflow sharing and templates
- 🚧 Credit system

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- fal.ai account

### Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FAL_API_KEY=your_fal_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server will start at `http://localhost:5173`

## Project Structure

```
src/
├── components/     # Reusable UI components
├── features/       # Feature-specific modules
├── hooks/          # Custom React hooks
├── lib/            # Utilities and API clients
│   ├── supabase.ts    # Supabase client
│   └── fal-client.ts  # fal.ai client
├── pages/          # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── DashboardPage.tsx
│   ├── WorkflowEditorPage.tsx
│   └── TemplatesPage.tsx
├── stores/         # Zustand state stores
│   ├── authStore.ts
│   └── workflowStore.ts
├── types/          # TypeScript type definitions
│   └── workflow.ts
├── App.tsx         # Main app component
├── entry-client.tsx  # Client-side entry point
├── entry-server.tsx  # Server-side entry point
└── index.css       # Global styles
```

## Database Schema (To be created in Supabase)

### Tables

- `profiles` - User profiles and credit balance
- `workflows` - Workflow metadata
- `workflow_versions` - Workflow graph data (nodes/edges)
- `executions` - Workflow execution history
- `assets` - Generated images/videos
- `workflow_shares` - Sharing permissions
- `credits_transactions` - Credit usage tracking

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Project setup with SSR
- [x] Routing with react-router
- [x] Authentication setup
- [x] State management

### Phase 2: Workflow Canvas (In Progress)
- [ ] React Flow canvas integration
- [ ] Node type system
- [ ] Connection validation
- [ ] Node palette/library

### Phase 3: Core Nodes
- [ ] Input nodes (text, image, number)
- [ ] AI generation nodes (text-to-image, image-to-image)
- [ ] Processing nodes (crop, resize, filters)
- [ ] Output nodes (preview, download)

### Phase 4: AI Integration
- [ ] fal.ai SDK integration
- [ ] Model metadata management
- [ ] Credit calculation
- [ ] Execution queue

### Phase 5: Workflow Engine
- [ ] Topological sort for dependencies
- [ ] Node execution orchestration
- [ ] Progress tracking
- [ ] Result caching

### Phase 6: Persistence
- [ ] Save/load workflows
- [ ] Workflow dashboard
- [ ] Version history

### Phase 7: Assets & Storage
- [ ] Supabase storage integration
- [ ] Asset library
- [ ] CDN delivery

### Phase 8: Sharing
- [ ] Public/private workflows
- [ ] Template gallery
- [ ] Workflow duplication

### Phase 9: Credit System
- [ ] Credit tracking
- [ ] Usage dashboard
- [ ] Stripe integration

### Phase 10: Editing Tools
- [ ] Canvas-based image editor
- [ ] Basic tools (crop, resize, filters)
- [ ] Result integration

### Phase 11: Polish
- [ ] Keyboard shortcuts
- [ ] Undo/redo
- [ ] Onboarding tutorial
- [ ] Performance optimization

## License

MIT
