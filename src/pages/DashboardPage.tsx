import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import { WorkflowService } from '../lib/workflow-service'

interface Workflow {
  id: string
  title: string
  description?: string
  thumbnail?: string
  updated_at: string
  created_at: string
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const data = await WorkflowService.listWorkflows()

      // For each workflow, try to load its latest version to get the last node result
      const workflowsWithThumbnails = await Promise.all(
        (data || []).map(async (workflow) => {
          try {
            const fullWorkflow = await WorkflowService.loadWorkflow(workflow.id)
            // Find the last node with a result (image or video)
            const nodesWithResults = fullWorkflow.nodes
              .filter((node: any) => node.data?.result && typeof node.data.result === 'string' && node.data.result.startsWith('http'))
              .reverse() // Get most recent first

            if (nodesWithResults.length > 0) {
              const lastResult = nodesWithResults[0].data.result
              return { ...workflow, thumbnail: lastResult }
            }
          } catch (error) {
            console.error(`Failed to load workflow ${workflow.id}:`, error)
          }
          return workflow
        })
      )

      setWorkflows(workflowsWithThumbnails)
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      await WorkflowService.deleteWorkflow(id)
      setWorkflows(workflows.filter(w => w.id !== id))
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      alert('Failed to delete workflow')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">CanvasAI</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Workflows</h2>
            <p className="text-gray-600 mt-1">Create and manage your AI workflows</p>
          </div>
          <button
            onClick={() => navigate('/workflow/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Workflow</span>
          </button>
        </div>

        {/* Workflows grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading workflows...</p>
            </div>
          ) : workflows.length === 0 ? (
            /* Empty state */
            <div className="col-span-full">
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first AI workflow</p>
                <button
                  onClick={() => navigate('/workflow/new')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          ) : (
            workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/workflow/${workflow.id}`)}
              >
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-t-lg flex items-center justify-center overflow-hidden">
                  {workflow.thumbnail ? (
                    workflow.thumbnail.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <video
                        src={workflow.thumbnail}
                        className="w-full h-full object-cover rounded-t-lg"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause()
                          e.currentTarget.currentTime = 0
                        }}
                      />
                    ) : (
                      <img src={workflow.thumbnail} alt={workflow.title} className="w-full h-full object-cover rounded-t-lg" />
                    )
                  ) : (
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{workflow.title}</h3>
                  {workflow.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{workflow.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated {formatDate(workflow.updated_at)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteWorkflow(workflow.id)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
