import { memo, useCallback, useEffect } from 'react'
import { NodeProps } from 'reactflow'
import { BaseNode } from './BaseNode'
import { BaseNodeData } from '../../types/workflow'
import { useWorkflowStore } from '../../stores/workflowStore'

export const PreviewNode = memo((props: NodeProps<BaseNodeData>) => {
  const { updateNodeData, nodes: storeNodes, edges: storeEdges } = useWorkflowStore()

  // Automatically update preview when connected data changes
  useEffect(() => {
    const incomingEdges = storeEdges.filter(e => e.target === props.id)

    if (incomingEdges.length > 0) {
      const dataEdge = incomingEdges.find(e => e.targetHandle === 'data')
      if (dataEdge) {
        const sourceNode = storeNodes.find(n => n.id === dataEdge.source)
        if (sourceNode?.data?.result !== undefined) {
          // Auto-update the preview with the connected data
          if (sourceNode.data.result !== props.data.result) {
            updateNodeData(props.id, {
              result: sourceNode.data.result,
              status: 'complete'
            })
          }
        }
      }
    }
  }, [storeNodes, storeEdges, props.id, props.data.result, updateNodeData])

  const canRun = useCallback(() => {
    const incomingEdges = storeEdges.filter(e => e.target === props.id)
    const dataEdge = incomingEdges.find(e => e.targetHandle === 'data')
    if (!dataEdge) return false

    const sourceNode = storeNodes.find(n => n.id === dataEdge.source)
    return sourceNode?.data?.result !== undefined
  }, [props.id, storeNodes, storeEdges])

  const handleRun = useCallback(async () => {
    updateNodeData(props.id, { status: 'running', error: undefined })

    try {
      const incomingEdges = storeEdges.filter(e => e.target === props.id)
      const dataEdge = incomingEdges.find(e => e.targetHandle === 'data')

      if (dataEdge) {
        const sourceNode = storeNodes.find(n => n.id === dataEdge.source)
        if (sourceNode?.data?.result !== undefined) {
          updateNodeData(props.id, {
            status: 'complete',
            result: sourceNode.data.result,
            error: undefined
          })
          return
        }
      }

      throw new Error('No data connected to preview')
    } catch (error: any) {
      updateNodeData(props.id, {
        status: 'error',
        error: error.message || 'Preview failed'
      })
    }
  }, [props.id, storeNodes, storeEdges, updateNodeData])

  return (
    <BaseNode {...props} onRun={handleRun} canRun={canRun()}>
      <div className="text-xs text-gray-400">
        Connect any output to preview it here
      </div>
    </BaseNode>
  )
})

PreviewNode.displayName = 'PreviewNode'
