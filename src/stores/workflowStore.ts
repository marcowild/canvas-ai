import { create } from 'zustand'
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow'
import { WorkflowNode, WorkflowEdge } from '../types/workflow'

interface WorkflowState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNodeId: string | null
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: WorkflowEdge[]) => void
  addNode: (node: WorkflowNode) => void
  updateNodeData: (nodeId: string, data: Partial<WorkflowNode['data']>) => void
  setSelectedNodeId: (nodeId: string | null) => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    })
  },
  setNodes: (nodes: WorkflowNode[]) => {
    set({ nodes })
  },
  setEdges: (edges: WorkflowEdge[]) => {
    set({ edges })
  },
  addNode: (node: WorkflowNode) => {
    set({ nodes: [...get().nodes, node] })
  },
  updateNodeData: (nodeId: string, data: Partial<WorkflowNode['data']>) => {
    const updatedNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    )
    console.log('updateNodeData called:', { nodeId, data, updatedNodes })
    set({ nodes: updatedNodes })
  },
  setSelectedNodeId: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId })
  },
}))
