import { Node, Edge } from 'reactflow'

export type NodeCategory = 'input' | 'ai-generation' | 'processing' | 'output'

export type NodeDataType = 'text' | 'image' | 'number' | 'video' | 'array' | 'mask'

export interface BaseNodeData {
  label: string
  category: NodeCategory
  inputs: NodeInput[]
  outputs: NodeOutput[]
  parameters: NodeParameter[]
  status?: 'idle' | 'running' | 'complete' | 'error'
  result?: any
  error?: string
}

export interface NodeInput {
  id: string
  label: string
  type: NodeDataType
  required?: boolean
}

export interface NodeOutput {
  id: string
  label: string
  type: NodeDataType
}

export interface NodeParameter {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'slider' | 'checkbox'
  value: any
  options?: { label: string; value: any }[]
  min?: number
  max?: number
  step?: number
}

export type WorkflowNode = Node<BaseNodeData>
export type WorkflowEdge = Edge

export interface Workflow {
  id: string
  title: string
  description?: string
  thumbnail?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  created_at: string
  updated_at: string
  owner_id: string
  is_public: boolean
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  started_at: string
  completed_at?: string
  results: Record<string, any>
  error?: string
}
