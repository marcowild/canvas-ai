import { useCallback, ReactNode } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  Connection,
  Edge,
} from 'reactflow'
import { useWorkflowStore } from '../stores/workflowStore'
import { nodeTypes } from '../lib/nodeTypes'

interface WorkflowCanvasProps {
  children?: ReactNode
}

function WorkflowCanvasInner({ children }: WorkflowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore()

  const onInit = useCallback(() => {
    console.log('React Flow initialized')
  }, [])

  // Validate connections (type checking)
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      console.log('Validating connection:', connection)

      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)

      if (!sourceNode || !targetNode) {
        console.log('Node not found', { source: connection.source, target: connection.target })
        return false
      }

      console.log('Source node:', sourceNode)
      console.log('Target node:', targetNode)

      // For now, allow all connections to test
      // TODO: Add type checking back
      return true

      // Get the output handle from source node
      // const sourceOutput = sourceNode.data.outputs.find(
      //   (o) => o.id === connection.sourceHandle
      // )
      // // Get the input handle from target node
      // const targetInput = targetNode.data.inputs.find(
      //   (i) => i.id === connection.targetHandle
      // )

      // if (!sourceOutput || !targetInput) {
      //   console.log('Handle not found', {
      //     sourceHandle: connection.sourceHandle,
      //     targetHandle: connection.targetHandle,
      //     sourceOutputs: sourceNode.data.outputs,
      //     targetInputs: targetNode.data.inputs,
      //   })
      //   return false
      // }

      // // Check if types match
      // const isValid = sourceOutput.type === targetInput.type
      // console.log('Connection validation:', {
      //   sourceType: sourceOutput.type,
      //   targetType: targetInput.type,
      //   isValid,
      // })
      // return isValid
    },
    [nodes]
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onInit={onInit}
        fitView
        attributionPosition="bottom-left"
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-gray-100"
        />
        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-900">Workflow Editor</h3>
          <p className="text-sm text-gray-600 mt-1">
            {nodes.length} nodes, {edges.length} connections
          </p>
        </Panel>
        {children}
      </ReactFlow>
    </div>
  )
}

export function WorkflowCanvas({ children }: WorkflowCanvasProps) {
  return <WorkflowCanvasInner>{children}</WorkflowCanvasInner>
}
