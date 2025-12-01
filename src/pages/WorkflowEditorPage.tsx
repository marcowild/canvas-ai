import { useEffect, useRef, useCallback, DragEvent, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ReactFlowProvider, useReactFlow } from 'reactflow'
import { WorkflowCanvas } from '../components/WorkflowCanvas'
import { NodePalette } from '../components/NodePalette'
import { PropertiesPanel } from '../components/PropertiesPanel'
import { useWorkflowStore } from '../stores/workflowStore'
import { createNodeFromTemplate } from '../lib/nodeTypes'
import { WorkflowExecutor } from '../lib/workflow-executor'
import { WorkflowService } from '../lib/workflow-service'

interface WorkflowEditorInnerProps {
  onRunWorkflow: () => void
  isExecuting: boolean
  executionError: string | null
}

function WorkflowEditorInner({ onRunWorkflow, isExecuting, executionError }: WorkflowEditorInnerProps) {
  const { project } = useReactFlow()
  const { addNode, nodes, selectedNodeId } = useWorkflowStore()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !reactFlowWrapper.current) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode = createNodeFromTemplate(type, position)
      addNode(newNode)
    },
    [project, addNode]
  )

  const handleAddNode = useCallback(
    (type: string) => {
      let position = { x: 250, y: 250 }

      // If a node is selected, place new node to the right of it
      if (selectedNodeId) {
        const selectedNode = nodes.find(n => n.id === selectedNodeId)
        if (selectedNode) {
          const nodeWidth = (selectedNode.style?.width as number) || 250
          position = {
            x: selectedNode.position.x + nodeWidth + 50,
            y: selectedNode.position.y,
          }
        }
      } else if (nodes.length > 0) {
        // Find rightmost node and place new node to the right of it
        const rightmostNode = nodes.reduce((rightmost, node) => {
          const nodeRight = node.position.x + ((node.style?.width as number) || 250)
          const rightmostRight = rightmost.position.x + ((rightmost.style?.width as number) || 250)
          return nodeRight > rightmostRight ? node : rightmost
        })
        position = {
          x: rightmostNode.position.x + ((rightmostNode.style?.width as number) || 250) + 50,
          y: rightmostNode.position.y,
        }
      }

      const newNode = createNodeFromTemplate(type, position)
      addNode(newNode)
    },
    [addNode, nodes, selectedNodeId]
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Error banner */}
      {executionError && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm">
          <strong>Execution Error:</strong> {executionError}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette - Left Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <NodePalette onAddNode={handleAddNode} />
        </aside>

        {/* Canvas */}
        <main
          ref={reactFlowWrapper}
          className="flex-1"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <WorkflowCanvas />
        </main>

        {/* Properties Panel - Right Sidebar */}
        <PropertiesPanel />
      </div>
    </div>
  )
}

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setNodes, setEdges, nodes, edges, updateNodeData } = useWorkflowStore()
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [workflowId, setWorkflowId] = useState<string | undefined>(id === 'new' ? undefined : id)
  const [workflowTitle, setWorkflowTitle] = useState('Untitled Workflow')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Load workflow on mount
  useEffect(() => {
    const loadWorkflow = async () => {
      if (id && id !== 'new') {
        try {
          const workflow = await WorkflowService.loadWorkflow(id)
          setWorkflowTitle(workflow.title)
          setNodes(workflow.nodes)
          setEdges(workflow.edges)
          setWorkflowId(workflow.id)
        } catch (error) {
          console.error('Failed to load workflow:', error)
        }
      } else {
        setNodes([])
        setEdges([])
        setWorkflowId(undefined)
      }
    }

    loadWorkflow()
  }, [id, setNodes, setEdges])

  // Auto-save workflow on changes (debounced)
  useEffect(() => {
    // Skip auto-save if no changes or still loading
    if (nodes.length === 0 && edges.length === 0) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (2 seconds after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        const savedId = await WorkflowService.saveWorkflow({
          id: workflowId,
          title: workflowTitle,
          nodes,
          edges,
        })

        // Update URL if this was a new workflow
        if (!workflowId && savedId) {
          setWorkflowId(savedId)
          navigate(`/workflow/${savedId}`, { replace: true })
        }

        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, 2000) // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [nodes, edges, workflowId, workflowTitle, navigate])

  const handleRunWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      setExecutionError('No nodes to execute')
      setTimeout(() => setExecutionError(null), 3000)
      return
    }

    setIsExecuting(true)
    setExecutionError(null)

    try {
      const executor = new WorkflowExecutor(nodes, edges, updateNodeData)
      const result = await executor.execute()

      if (!result.success) {
        const errorMessages = Object.entries(result.errors)
          .map(([nodeId, error]) => `${nodeId}: ${error}`)
          .join(', ')
        setExecutionError(errorMessages)
      } else {
        // Clear any previous errors on success
        setExecutionError(null)
      }
    } catch (error: any) {
      setExecutionError(error.message || 'Execution failed')
    } finally {
      setIsExecuting(false)
    }
  }, [nodes, edges, updateNodeData])

  const getSaveStatus = () => {
    if (isSaving) {
      return { text: 'Saving...', color: 'text-yellow-400' }
    }
    if (lastSaved) {
      const secondsAgo = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000)
      if (secondsAgo < 60) {
        return { text: 'Saved just now', color: 'text-green-400' }
      } else if (secondsAgo < 3600) {
        return { text: `Saved ${Math.floor(secondsAgo / 60)}m ago`, color: 'text-gray-400' }
      }
    }
    return { text: 'Not saved', color: 'text-gray-500' }
  }

  const saveStatus = getSaveStatus()

  const handleTitleClick = () => {
    setIsEditingTitle(true)
    setTimeout(() => {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }, 0)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkflowTitle(e.target.value)
  }

  const saveTitleImmediately = async () => {
    const finalTitle = workflowTitle.trim() || 'Untitled Workflow'
    setWorkflowTitle(finalTitle)

    // Save immediately if workflow exists
    if (workflowId) {
      setIsSaving(true)
      try {
        await WorkflowService.saveWorkflow({
          id: workflowId,
          title: finalTitle,
          nodes,
          edges,
        })
        setLastSaved(new Date())
      } catch (error) {
        console.error('Failed to save title:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleTitleBlur = async () => {
    setIsEditingTitle(false)
    await saveTitleImmediately()
  }

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false)
      await saveTitleImmediately()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a href="/dashboard" className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={workflowTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-white text-lg font-semibold bg-gray-700 px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500 w-full max-w-md"
                placeholder="Workflow name"
              />
            ) : (
              <h1
                onClick={handleTitleClick}
                className="text-white text-lg font-semibold cursor-pointer hover:text-gray-300 transition flex items-center space-x-2 group"
              >
                <span>{workflowTitle}</span>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </h1>
            )}
            <p className={`text-xs ${saveStatus.color} flex items-center space-x-1 mt-1`}>
              {isSaving && (
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{saveStatus.text}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunWorkflow}
            disabled={isExecuting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isExecuting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{isExecuting ? 'Running...' : 'Run Workflow'}</span>
          </button>
        </div>
      </header>

      {/* Main content area with ReactFlow provider */}
      <ReactFlowProvider>
        <WorkflowEditorInner
          onRunWorkflow={handleRunWorkflow}
          isExecuting={isExecuting}
          executionError={executionError}
        />
      </ReactFlowProvider>
    </div>
  )
}
