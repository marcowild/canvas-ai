import { supabase } from './supabase'
import { WorkflowNode, WorkflowEdge } from '../types/workflow'

export interface SaveWorkflowParams {
  id?: string
  title: string
  description?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  thumbnail?: string
}

export class WorkflowService {
  /**
   * Save or update a workflow
   */
  static async saveWorkflow(params: SaveWorkflowParams): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      if (params.id) {
        // Update existing workflow
        await this.updateWorkflow(params.id, params)
        return params.id
      } else {
        // Create new workflow
        return await this.createWorkflow(params, user.id)
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      throw error
    }
  }

  /**
   * Create a new workflow
   */
  private static async createWorkflow(params: SaveWorkflowParams, userId: string): Promise<string> {
    // Create workflow record
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        owner_id: userId,
        title: params.title,
        description: params.description,
        thumbnail: params.thumbnail,
      })
      .select()
      .single()

    if (workflowError) throw workflowError

    // Create initial version
    const { error: versionError } = await supabase
      .from('workflow_versions')
      .insert({
        workflow_id: workflow.id,
        version_number: 1,
        nodes: params.nodes,
        edges: params.edges,
      })

    if (versionError) throw versionError

    return workflow.id
  }

  /**
   * Update existing workflow
   */
  private static async updateWorkflow(workflowId: string, params: SaveWorkflowParams) {
    // Update workflow metadata
    const { error: workflowError } = await supabase
      .from('workflows')
      .update({
        title: params.title,
        description: params.description,
        thumbnail: params.thumbnail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)

    if (workflowError) throw workflowError

    // Get latest version number
    const { data: versions, error: versionQueryError } = await supabase
      .from('workflow_versions')
      .select('version_number')
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })
      .limit(1)

    if (versionQueryError) throw versionQueryError

    const nextVersion = (versions?.[0]?.version_number || 0) + 1

    // Create new version
    const { error: versionError } = await supabase
      .from('workflow_versions')
      .insert({
        workflow_id: workflowId,
        version_number: nextVersion,
        nodes: params.nodes,
        edges: params.edges,
      })

    if (versionError) throw versionError
  }

  /**
   * Load a workflow by ID
   */
  static async loadWorkflow(workflowId: string) {
    // Get workflow metadata
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError) throw workflowError

    // Get latest version
    const { data: version, error: versionError } = await supabase
      .from('workflow_versions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError) throw versionError

    return {
      ...workflow,
      nodes: version.nodes || [],
      edges: version.edges || [],
    }
  }

  /**
   * List user's workflows
   */
  static async listWorkflows() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return data
  }

  /**
   * Delete a workflow
   */
  static async deleteWorkflow(workflowId: string) {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId)

    if (error) throw error
  }
}
