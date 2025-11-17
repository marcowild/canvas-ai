import { memo, useCallback } from 'react'
import { NodeProps, useReactFlow } from 'reactflow'
import { BaseNode } from './BaseNode'
import { BaseNodeData } from '../../types/workflow'
import { useWorkflowStore } from '../../stores/workflowStore'
import { WorkflowExecutor } from '../../lib/workflow-executor'

export const Generate3DNode = memo((props: NodeProps<BaseNodeData>) => {
  const { getNodes, getEdges } = useReactFlow()
  const { updateNodeData } = useWorkflowStore()

  const canRun = useCallback(() => {
    const nodes = getNodes()
    const edges = getEdges()
    const incomingEdges = edges.filter(e => e.target === props.id)

    // Check required image input
    const imageInput = props.data.inputs.find(i => i.id === 'image' && i.required)
    if (imageInput) {
      const hasImageConnection = incomingEdges.some(e => e.targetHandle === 'image')
      if (!hasImageConnection) return false

      const imageEdge = incomingEdges.find(e => e.targetHandle === 'image')
      if (imageEdge) {
        const sourceNode = nodes.find(n => n.id === imageEdge.source)
        if (!sourceNode?.data.result) return false
      }
    }

    return true
  }, [props.id, props.data.inputs, getNodes, getEdges])

  const handleRun = useCallback(async () => {
    const { nodes: storeNodes, edges: storeEdges } = useWorkflowStore.getState()

    // Only execute this single node
    updateNodeData(props.id, { status: 'running', error: undefined })

    try {
      // Get input data from connected nodes
      const incomingEdges = storeEdges.filter(e => e.target === props.id)
      const inputData: Record<string, any> = {}

      incomingEdges.forEach((edge) => {
        const sourceNode = storeNodes.find((n) => n.id === edge.source)
        if (sourceNode?.data.result !== undefined && edge.targetHandle) {
          inputData[edge.targetHandle] = sourceNode.data.result
        }
      })

      if (!inputData.image) {
        throw new Error('Image input is required')
      }

      // For now, simulate 3D generation
      // TODO: Replace with actual Rodin API when ready
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockResult = `https://example.com/3d-model-${Date.now()}.glb`

      updateNodeData(props.id, {
        status: 'complete',
        result: mockResult,
        error: undefined
      })
    } catch (error: any) {
      console.error('Generate3D error:', error)
      updateNodeData(props.id, {
        status: 'error',
        error: error.message || 'Generation failed'
      })
    }
  }, [props.id, updateNodeData])

  return (
    <BaseNode {...props} onRun={handleRun} canRun={canRun()}>
      <div className="text-xs text-gray-400">
        <div className="mb-2">
          <div className="font-semibold text-gray-300">AI Model:</div>
          <div>Rodin 2.0</div>
        </div>
        <div className="mb-2">
          <div className="font-semibold text-gray-300">Output:</div>
          <div>3D Model (GLB/OBJ)</div>
        </div>
        <div>
          <div className="font-semibold text-gray-300">Credits:</div>
          <div>15 credits per model</div>
        </div>
      </div>
    </BaseNode>
  )
})

Generate3DNode.displayName = 'Generate3DNode'
