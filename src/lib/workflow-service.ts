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

    // Clean up old versions (keep only last 20)
    await this.cleanupOldVersions(workflowId)
  }

  /**
   * Clean up old workflow versions, keeping only the last 20
   */
  private static async cleanupOldVersions(workflowId: string) {
    try {
      // Get all versions ordered by version number descending (newest first)
      const { data: allVersions, error: fetchError } = await supabase
        .from('workflow_versions')
        .select('id, version_number')
        .eq('workflow_id', workflowId)
        .order('version_number', { ascending: false })

      if (fetchError) {
        console.error('Error fetching versions for cleanup:', fetchError)
        return
      }

      // Only proceed if we have more than 20 versions
      if (!allVersions || allVersions.length <= 20) {
        return
      }

      // Get versions to delete (everything after index 19, which is the 20th item)
      const versionsToDelete = allVersions.slice(20)
      const idsToDelete = versionsToDelete.map(v => v.id)

      console.log(`Attempting to delete ${idsToDelete.length} versions for workflow ${workflowId}`, idsToDelete)

      // Delete in batches if there are many (Supabase has limits)
      const batchSize = 100
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize)

        const { error: deleteError } = await supabase
          .from('workflow_versions')
          .delete()
          .in('id', batch)

        if (deleteError) {
          console.error(`Error deleting batch of old versions:`, deleteError)
          return
        }
      }

      console.log(`Successfully cleaned up ${idsToDelete.length} old workflow versions for workflow ${workflowId}`)
    } catch (error) {
      console.error('Error in cleanupOldVersions:', error)
      // Don't throw - cleanup failures shouldn't break the save operation
    }
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

  /**
   * Clean up all old versions for all workflows (one-time maintenance)
   */
  static async cleanupAllWorkflowVersions() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get all user's workflows
      const { data: workflows, error: workflowsError } = await supabase
        .from('workflows')
        .select('id')
        .eq('owner_id', user.id)

      if (workflowsError) throw workflowsError

      let totalCleaned = 0

      // Clean up versions for each workflow
      for (const workflow of workflows || []) {
        const { data: allVersions, error: fetchError } = await supabase
          .from('workflow_versions')
          .select('id, version_number')
          .eq('workflow_id', workflow.id)
          .order('version_number', { ascending: false })

        if (fetchError) {
          console.error(`Error fetching versions for workflow ${workflow.id}:`, fetchError)
          continue
        }

        if (allVersions && allVersions.length > 20) {
          const versionsToDelete = allVersions.slice(20)
          const idsToDelete = versionsToDelete.map(v => v.id)

          const { error: deleteError } = await supabase
            .from('workflow_versions')
            .delete()
            .in('id', idsToDelete)

          if (deleteError) {
            console.error(`Error deleting old versions for workflow ${workflow.id}:`, deleteError)
          } else {
            totalCleaned += idsToDelete.length
            console.log(`Cleaned up ${idsToDelete.length} versions for workflow ${workflow.id}`)
          }
        }
      }

      console.log(`Total versions cleaned up: ${totalCleaned}`)
      return { success: true, totalCleaned }
    } catch (error) {
      console.error('Error in cleanupAllWorkflowVersions:', error)
      throw error
    }
  }
}
