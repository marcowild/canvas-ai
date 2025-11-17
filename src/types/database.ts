export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  credit_balance: number
  created_at: string
  updated_at: string
}

export interface Workflow {
  id: string
  owner_id: string
  title: string
  description: string | null
  thumbnail: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface WorkflowVersion {
  id: string
  workflow_id: string
  version_number: number
  nodes: any[]
  edges: any[]
  created_at: string
}

export interface Execution {
  id: string
  workflow_id: string
  user_id: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  results: Record<string, any>
  error: string | null
  credits_used: number
  started_at: string
  completed_at: string | null
}

export interface Asset {
  id: string
  execution_id: string | null
  user_id: string
  type: 'image' | 'video' | 'text' | 'other'
  url: string
  storage_path: string
  metadata: Record<string, any>
  file_size: number | null
  created_at: string
}

export interface WorkflowShare {
  id: string
  workflow_id: string
  shared_by: string
  share_token: string
  can_duplicate: boolean
  can_edit: boolean
  expires_at: string | null
  created_at: string
}

export interface CreditsTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  execution_id: string | null
  description: string | null
  created_at: string
}
