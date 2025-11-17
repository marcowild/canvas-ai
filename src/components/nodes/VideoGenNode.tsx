import { memo, useCallback } from 'react'
import { NodeProps, useReactFlow } from 'reactflow'
import { BaseNode } from './BaseNode'
import { BaseNodeData } from '../../types/workflow'
import { useWorkflowStore } from '../../stores/workflowStore'
import { WorkflowExecutor } from '../../lib/workflow-executor'

export const VideoGenNode = memo((props: NodeProps<BaseNodeData>) => {
  const { getNodes, getEdges } = useReactFlow()
  const { updateNodeData } = useWorkflowStore()

  const canRun = useCallback(() => {
    const nodes = getNodes()
    const edges = getEdges()
    const incomingEdges = edges.filter(e => e.target === props.id)

    // Check if at least one input (image or prompt) is connected and has data
    const imageEdge = incomingEdges.find(e => e.targetHandle === 'image')
    const promptEdge = incomingEdges.find(e => e.targetHandle === 'prompt')

    let hasImageData = false
    let hasPromptData = false

    if (imageEdge) {
      const sourceNode = nodes.find(n => n.id === imageEdge.source)
      hasImageData = !!sourceNode?.data.result
    }

    if (promptEdge) {
      const sourceNode = nodes.find(n => n.id === promptEdge.source)
      hasPromptData = !!sourceNode?.data.result
    }

    // Require at least one input with data
    return hasImageData || hasPromptData
  }, [props.id, getNodes, getEdges])

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

      // Get parameters
      const model = props.data.parameters.find((p) => p.id === 'model')?.value || 'minimax'
      const duration = props.data.parameters.find((p) => p.id === 'duration')?.value || '5s'
      const aspectRatio = props.data.parameters.find((p) => p.id === 'aspectRatio')?.value || '9:16'

      // Determine which API endpoint to use
      let response
      let videoUrl

      if (inputData.image && inputData.prompt) {
        // Image-to-video with prompt
        response = await fetch('/api/generate/image-to-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: inputData.image,
            prompt: inputData.prompt,
            model,
            duration,
            aspectRatio,
          }),
        })
      } else if (inputData.image) {
        // Image-to-video only
        response = await fetch('/api/generate/image-to-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: inputData.image,
            model,
            duration,
            aspectRatio,
          }),
        })
      } else if (inputData.prompt) {
        // Text-to-video
        response = await fetch('/api/generate/text-to-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: inputData.prompt,
            model,
            duration,
            aspectRatio,
          }),
        })
      } else {
        throw new Error('Either image or prompt is required')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Video generation failed')
      }

      const result = await response.json()

      videoUrl = result.videoUrl
      updateNodeData(props.id, {
        status: 'complete',
        result: videoUrl,
        error: undefined
      })
    } catch (error: any) {
      console.error('VideoGen error:', error)
      updateNodeData(props.id, {
        status: 'error',
        error: error.message || 'Generation failed'
      })
    }
  }, [props.id, props.data.parameters, updateNodeData])

  return (
    <BaseNode {...props} onRun={handleRun} canRun={canRun()} />
  )
})

VideoGenNode.displayName = 'VideoGenNode'
