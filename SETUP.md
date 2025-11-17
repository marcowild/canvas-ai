# CanvasAI - Setup Guide

## What Has Been Built

### ✅ Phase 1: Foundation (COMPLETE)
- SSR-rendered React application with Vite and Express
- React Router v6 with SSR support
- TailwindCSS for styling
- TypeScript configuration
- Project structure and routing

### ✅ Phase 2: Authentication (COMPLETE)
- Supabase client setup
- Auth context and hooks (`useAuth`)
- Protected route component
- Login page with email/password and OAuth
- Signup page with email/password and OAuth
- Sign out functionality

### ✅ Phase 3: Database Schema (COMPLETE)
SQL migration file created with tables for:
- `profiles` - User profiles and credit balance
- `workflows` - Workflow metadata
- `workflow_versions` - Workflow graph data (nodes/edges)
- `executions` - Workflow execution history
- `assets` - Generated images/videos
- `workflow_shares` - Sharing permissions
- `credits_transactions` - Credit usage tracking

### ✅ Phase 4: React Flow Canvas (COMPLETE)
- React Flow integration
- Workflow canvas component with:
  - Background grid
  - Controls (zoom, pan)
  - MiniMap
  - Info panel
- Zustand store for workflow state management
- Workflow editor page with three-panel layout:
  - Left: Node palette (categorized by type)
  - Center: Canvas
  - Right: Properties panel

### ✅ Phase 5: Dashboard (COMPLETE)
- Dashboard page with:
  - User header with sign out
  - Empty state for workflows
  - Quick create button
  - Credits balance display
  - Template browse link
  - Execution stats

## Next Steps

### Immediate Tasks

1. **Set up Supabase**
   ```bash
   # 1. Create a Supabase project at https://supabase.com
   # 2. Run the migration SQL in Supabase SQL Editor:
   cat supabase/migrations/001_initial_schema.sql
   # 3. Enable email auth in Supabase Dashboard > Authentication > Providers
   # 4. (Optional) Enable Google/GitHub OAuth providers
   ```

2. **Configure Environment Variables**
   Your `.env` file should have:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_FAL_API_KEY=your-fal-api-key
   ```

3. **Test the Application**
   ```bash
   npm run dev
   # Visit http://localhost:5173
   # 1. Sign up for an account
   # 2. Navigate to dashboard
   # 3. Click "New Workflow"
   # 4. See the workflow editor with empty canvas
   ```

### Phase 6: Implement Node System (NEXT)

Create draggable, connectable nodes:

**Files to create:**
- `src/components/nodes/BaseNode.tsx` - Reusable node component
- `src/components/nodes/TextInputNode.tsx` - Text input node
- `src/components/nodes/ImageUploadNode.tsx` - Image upload node
- `src/components/nodes/TextToImageNode.tsx` - AI text-to-image node
- `src/components/nodes/PreviewNode.tsx` - Preview output node

**Tasks:**
1. Create base node component with inputs/outputs
2. Implement node types with custom UI
3. Add drag-and-drop from palette to canvas
4. Implement node deletion (Delete key)
5. Add connection validation (type checking)
6. Style nodes with color coding by category

### Phase 7: fal.ai Integration

Integrate AI models:

**Files to create:**
- `src/lib/fal-models.ts` - Model definitions and metadata
- `src/lib/workflow-executor.ts` - Execution engine

**Tasks:**
1. Define available fal.ai models (Flux, SDXL, etc.)
2. Create model metadata (inputs, outputs, credit cost)
3. Build execution orchestrator with topological sort
4. Implement credit deduction system
5. Add progress tracking for executions
6. Display results on nodes

### Phase 8: Workflow Persistence

Save and load workflows:

**Files to create:**
- `src/lib/workflow-service.ts` - Supabase CRUD operations

**Tasks:**
1. Implement save workflow function
2. Implement load workflow function
3. Add auto-save functionality
4. Create workflow list on dashboard
5. Add workflow duplication
6. Implement version history

### Phase 9: Properties Panel

Node configuration UI:

**Files to create:**
- `src/components/PropertiesPanel.tsx` - Properties panel component
- `src/components/NodeParameter.tsx` - Individual parameter controls

**Tasks:**
1. Create dynamic form based on node type
2. Add parameter controls (text, number, slider, select)
3. Update node data on parameter change
4. Add validation and error messages

### Phase 10: Basic Editing Tools

Image manipulation:

**Files to create:**
- `src/components/ImageEditor.tsx` - Canvas-based image editor
- `src/components/nodes/CropResizeNode.tsx` - Crop/resize node
- `src/components/nodes/FilterNode.tsx` - Filter node

**Tasks:**
1. Create canvas-based image editor
2. Implement crop tool
3. Implement resize tool
4. Add basic filters (brightness, contrast, saturation)
5. Integrate editor as modal from node

## Application Structure

```
src/
├── components/
│   ├── ProtectedRoute.tsx        ✅ Auth wrapper
│   ├── WorkflowCanvas.tsx         ✅ React Flow canvas
│   └── nodes/                     🚧 Node components (next)
├── hooks/
│   └── useAuth.tsx                ✅ Auth context/hooks
├── lib/
│   ├── supabase.ts                ✅ Supabase client
│   ├── fal-client.ts              ✅ fal.ai client
│   └── workflow-engine.ts         🚧 Execution engine (next)
├── pages/
│   ├── HomePage.tsx               ✅ Landing page
│   ├── LoginPage.tsx              ✅ Login with Supabase
│   ├── SignupPage.tsx             ✅ Signup with Supabase
│   ├── DashboardPage.tsx          ✅ Workflow dashboard
│   ├── WorkflowEditorPage.tsx     ✅ Editor with 3-panel layout
│   └── TemplatesPage.tsx          🚧 Template gallery
├── stores/
│   ├── authStore.ts               ✅ Auth state
│   └── workflowStore.ts           ✅ Workflow state (React Flow)
├── types/
│   ├── workflow.ts                ✅ Workflow types
│   └── database.ts                ✅ Supabase table types
├── App.tsx                        ✅ Router + AuthProvider
├── entry-client.tsx               ✅ Client hydration
├── entry-server.tsx               ✅ SSR rendering
└── index.css                      ✅ Tailwind + React Flow styles
```

## Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v6** - Routing with SSR
- **Express** - SSR server
- **React Flow** - Node-based canvas
- **Supabase** - Auth, database, storage
- **fal.ai** - AI model inference
- **Zustand** - State management
- **TailwindCSS** - Styling

## Running the Application

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Testing Checklist

- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign out
- [ ] Protected routes redirect to login
- [ ] Dashboard loads after auth
- [ ] Navigate to workflow editor
- [ ] Canvas renders with grid background
- [ ] Controls (zoom/pan) work
- [ ] Node palette displays categories

## Common Issues

### 1. Supabase Connection Error
**Error:** "Missing Supabase environment variables"
**Fix:** Make sure `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### 2. React Flow Not Rendering
**Error:** Blank canvas
**Fix:** Make sure parent container has explicit height (`h-screen` or `h-full`)

### 3. Auth Not Working
**Error:** "Invalid login credentials"
**Fix:**
- Run the migration SQL in Supabase
- Enable email auth in Supabase settings
- Make sure user is created in `auth.users` table

### 4. SSR Hydration Mismatch
**Error:** Warning in console about hydration
**Fix:** Make sure client and server render the same initial HTML

## Database Setup Instructions

1. Go to https://app.supabase.com
2. Create a new project
3. Wait for project to be ready
4. Go to SQL Editor
5. Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
6. Run the SQL
7. Go to Authentication > Providers
8. Enable "Email" provider
9. (Optional) Enable Google/GitHub OAuth
10. Copy your project URL and anon key to `.env`

## Credits

This is a learning project cloning [Weavy.ai](https://weavy.ai) functionality using open-source tools.
