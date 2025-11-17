import { memo, useCallback } from 'react'
import { NodeProps, useReactFlow } from 'reactflow'
import { BaseNode } from './BaseNode'
import { BaseNodeData } from '../../types/workflow'
import { useWorkflowStore } from '../../stores/workflowStore'
import { WorkflowExecutor } from '../../lib/workflow-executor'

export const TextToImageNode = memo((props: NodeProps<BaseNodeData>) => {
  const { getNodes, getEdges } = useReactFlow()
  const { updateNodeData, nodes: storeNodes, edges: storeEdges } = useWorkflowStore()

  // Check if all required inputs are connected and have data
  const canRun = useCallback(() => {
    // Use store nodes/edges for more reliable state
    const nodes = storeNodes
    const edges = storeEdges

    // Find edges that connect to this node's inputs
    const incomingEdges = edges.filter(e => e.target === props.id)

    // Check if required prompt input is connected
    const promptInput = props.data.inputs.find(i => i.id === 'prompt' && i.required)
    if (promptInput) {
      const hasPromptConnection = incomingEdges.some(e => e.targetHandle === 'prompt')

      if (!hasPromptConnection) {
        return false
      }

      // Check if connected source has data
      const promptEdge = incomingEdges.find(e => e.targetHandle === 'prompt')
      if (promptEdge) {
        const sourceNode = nodes.find(n => n.id === promptEdge.source)
        if (!sourceNode?.data?.result) {
          return false
        }
      }
    }

    return true
  }, [props.id, props.data.inputs, storeNodes, storeEdges])

  const handleRun = useCallback(async () => {
    // Only execute this single node
    updateNodeData(props.id, { status: 'running', error: undefined })

    try {
      // Get input data from connected nodes
      const incomingEdges = storeEdges.filter(e => e.target === props.id)
      const inputData: Record<string, any> = {}

      incomingEdges.forEach((edge) => {
        const sourceNode = storeNodes.find((n) => n.id === edge.source)

        if (sourceNode?.data.result !== undefined && edge.targetHandle) {
          // If prompt already exists, concatenate with the new value
          if (edge.targetHandle === 'prompt' && inputData[edge.targetHandle]) {
            inputData[edge.targetHandle] += ', ' + sourceNode.data.result
          } else {
            inputData[edge.targetHandle] = sourceNode.data.result
          }
        }
      })

      // Get parameters
      const model = props.data.parameters.find((p) => p.id === 'model')?.value || 'flux-pro'
      const width = props.data.parameters.find((p) => p.id === 'width')?.value || 1024
      const height = props.data.parameters.find((p) => p.id === 'height')?.value || 1024
      const steps = props.data.parameters.find((p) => p.id === 'steps')?.value || 30
      const aspectRatio = props.data.parameters.find((p) => p.id === 'aspectRatio')?.value || '1:1'

      // Build request payload
      const payload: any = {
        prompt: inputData.prompt,
        model,
        width,
        height,
        steps,
        aspectRatio,
      }

      // Add reference image if provided
      if (inputData.referenceImage) {
        payload.referenceImage = inputData.referenceImage
      }

      // Call server-side API
      const response = await fetch('/api/generate/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Image generation failed')
      }

      const result = await response.json()

      const imageUrl = result.imageUrl
      updateNodeData(props.id, {
        status: 'complete',
        result: imageUrl,
        error: undefined
      })
    } catch (error: any) {
      console.error('TextToImage error:', error)
      updateNodeData(props.id, {
        status: 'error',
        error: error.message || 'Generation failed'
      })
    }
  }, [props.id, props.data.parameters, storeNodes, storeEdges, updateNodeData])

  return (
    <BaseNode {...props} onRun={handleRun} canRun={canRun()} />
  )
})

TextToImageNode.displayName = 'TextToImageNode'
