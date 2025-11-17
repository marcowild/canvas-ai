import { WorkflowNode, WorkflowEdge } from '../types/workflow'

export interface ExecutionResult {
  success: boolean
  results: Record<string, any>
  errors: Record<string, string>
}

export class WorkflowExecutor {
  private nodes: WorkflowNode[]
  private edges: WorkflowEdge[]
  private results: Record<string, any> = {}
  private onNodeUpdate?: (nodeId: string, data: Partial<WorkflowNode['data']>) => void

  constructor(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    onNodeUpdate?: (nodeId: string, data: Partial<WorkflowNode['data']>) => void
  ) {
    this.nodes = nodes
    this.edges = edges
    this.onNodeUpdate = onNodeUpdate
  }

  /**
   * Execute the workflow by running nodes in topological order
   */
  async execute(): Promise<ExecutionResult> {
    const errors: Record<string, string> = {}

    try {
      // Get execution order using topological sort
      const executionOrder = this.topologicalSort()

      if (!executionOrder) {
        return {
          success: false,
          results: {},
          errors: { workflow: 'Workflow contains a cycle' },
        }
      }

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = this.nodes.find((n) => n.id === nodeId)
        if (!node) continue

        try {
          // Update node status to running
          this.updateNode(nodeId, { status: 'running', error: undefined })

          // Get input data from connected nodes
          const inputData = this.getNodeInputs(nodeId)

          // Execute the node
          const result = await this.executeNode(node, inputData)

          // Store result and update node
          this.results[nodeId] = result
          this.updateNode(nodeId, { status: 'complete', result })
        } catch (error: any) {
          const errorMessage = error.message || 'Execution failed'
          errors[nodeId] = errorMessage
          this.updateNode(nodeId, { status: 'error', error: errorMessage })

          // Stop execution on error
          break
        }
      }

      return {
        success: Object.keys(errors).length === 0,
        results: this.results,
        errors,
      }
    } catch (error: any) {
      return {
        success: false,
        results: this.results,
        errors: { workflow: error.message || 'Execution failed' },
      }
    }
  }

  /**
   * Topological sort to determine execution order
   */
  private topologicalSort(): string[] | null {
    const adjacencyList = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    // Initialize
    this.nodes.forEach((node) => {
      adjacencyList.set(node.id, [])
      inDegree.set(node.id, 0)
    })

    // Build adjacency list and in-degree map
    this.edges.forEach((edge) => {
      adjacencyList.get(edge.source)?.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    })

    // Queue nodes with no incoming edges
    const queue: string[] = []
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId)
      }
    })

    const result: string[] = []

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      result.push(nodeId)

      // Reduce in-degree for neighbors
      adjacencyList.get(nodeId)?.forEach((neighbor) => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1
        inDegree.set(neighbor, newDegree)
        if (newDegree === 0) {
          queue.push(neighbor)
        }
      })
    }

    // Check for cycle
    if (result.length !== this.nodes.length) {
      return null // Cycle detected
    }

    return result
  }

  /**
   * Get input data for a node from connected source nodes
   */
  private getNodeInputs(nodeId: string): Record<string, any> {
    const inputs: Record<string, any> = {}

    // Find all edges that target this node
    const incomingEdges = this.edges.filter((edge) => edge.target === nodeId)

    incomingEdges.forEach((edge) => {
      const sourceResult = this.results[edge.source]
      if (sourceResult !== undefined && edge.targetHandle) {
        inputs[edge.targetHandle] = sourceResult
      }
    })

    return inputs
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: WorkflowNode,
    inputs: Record<string, any>
  ): Promise<any> {
    // Handle different node types
    switch (node.type) {
      case 'textInput':
        return this.executeTextInput(node)

      case 'imageUpload':
        return this.executeImageUpload(node)

      case 'colorReference':
        return this.executeColorReference(node)

      case 'textToImage':
        return this.executeTextToImage(node, inputs)

      case 'generate3D':
        return this.executeGenerate3D(node, inputs)

      case 'videoGen':
        return this.executeVideoGen(node, inputs)

      case 'preview':
        return this.executePreview(node, inputs)

      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private executeTextInput(node: WorkflowNode): any {
    // Text input nodes just pass through their result
    return node.data.result || ''
  }

  private executeImageUpload(node: WorkflowNode): any {
    // Image upload nodes just pass through their result
    return node.data.result || null
  }

  private executeColorReference(node: WorkflowNode): any {
    // Color reference nodes just pass through their result (hex color)
    return node.data.result || '#3b82f6'
  }

  private async executeTextToImage(
    node: WorkflowNode,
    inputs: Record<string, any>
  ): Promise<any> {
    // Get the prompt from inputs
    const prompt = inputs.prompt

    if (!prompt) {
      throw new Error('Text to Image requires a prompt input')
    }

    // Get parameters from node
    const model = node.data.parameters.find((p) => p.id === 'model')?.value || 'flux-pro'
    const width = node.data.parameters.find((p) => p.id === 'width')?.value || 1024
    const height = node.data.parameters.find((p) => p.id === 'height')?.value || 1024
    const steps = node.data.parameters.find((p) => p.id === 'steps')?.value || 30

    // Import fal-ai dynamically to avoid issues if not configured
    try {
      const { fal } = await import('./fal-client')

      // Map model to fal.ai endpoint
      const modelEndpoint = this.getFalModelEndpoint(model)

      // Call fal.ai
      const result = await fal.subscribe(modelEndpoint, {
        input: {
          prompt,
          image_size: {
            width,
            height,
          },
          num_inference_steps: steps,
        },
        logs: true,
      })

      // Return the image URL
      return result.images?.[0]?.url || result.image?.url || null
    } catch (error: any) {
      throw new Error(`AI generation failed: ${error.message}`)
    }
  }

  private async executeGenerate3D(
    node: WorkflowNode,
    inputs: Record<string, any>
  ): Promise<any> {
    // Get the image from inputs
    const imageUrl = inputs.image

    if (!imageUrl) {
      throw new Error('3D Generation requires an image input')
    }

    // Get parameters from node
    const model = node.data.parameters.find((p) => p.id === 'model')?.value || 'rodin-2.0'

    // For now, simulate 3D generation (replace with actual Rodin API when ready)
    // In production, call Rodin API here
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Return simulated 3D model URL
      // In production: return actual GLB/OBJ file URL from Rodin API
      return `https://example.com/3d-model-${Date.now()}.glb`
    } catch (error: any) {
      throw new Error(`3D generation failed: ${error.message}`)
    }
  }

  private async executeVideoGen(
    node: WorkflowNode,
    inputs: Record<string, any>
  ): Promise<any> {
    // Get the image and prompt from inputs
    const imageUrl = inputs.image
    const prompt = inputs.prompt

    // Require at least one: image or prompt
    if (!imageUrl && !prompt) {
      throw new Error('Video Generation requires either an image or prompt input')
    }

    // Get parameters from node
    const duration = node.data.parameters.find((p) => p.id === 'duration')?.value || '5'

    try {
      const { fal } = await import('./fal-client')

      // Use different endpoints based on available inputs
      if (imageUrl && prompt) {
        // Image-to-video with prompt guidance
        const result = await fal.subscribe('fal-ai/kling-video/v2/master/image-to-video', {
          input: {
            image_url: imageUrl,
            prompt: prompt,
            duration: duration.toString(),
            aspect_ratio: '16:9',
            negative_prompt: 'blur, distort, and low quality',
          },
          logs: true,
        })
        return result.video?.url || null
      } else if (imageUrl) {
        // Image-to-video without prompt
        const result = await fal.subscribe('fal-ai/kling-video/v2/master/image-to-video', {
          input: {
            image_url: imageUrl,
            prompt: 'Animate this image with smooth, natural motion',
            duration: duration.toString(),
            aspect_ratio: '16:9',
            negative_prompt: 'blur, distort, and low quality',
          },
          logs: true,
        })
        return result.video?.url || null
      } else {
        // Text-to-video (prompt only)
        const result = await fal.subscribe('fal-ai/kling-video/v2/master/text-to-video', {
          input: {
            prompt: prompt,
            duration: duration.toString(),
            aspect_ratio: '16:9',
            negative_prompt: 'blur, distort, and low quality',
          },
          logs: true,
        })
        return result.video?.url || null
      }
    } catch (error: any) {
      throw new Error(`Video generation failed: ${error.message}`)
    }
  }

  private executePreview(node: WorkflowNode, inputs: Record<string, any>): any {
    // Preview nodes just pass through the input data
    return inputs.data || null
  }

  private getFalModelEndpoint(model: string): string {
    const modelMap: Record<string, string> = {
      'flux-pro': 'fal-ai/flux-pro',
      'sdxl': 'fal-ai/fast-sdxl',
      'sd-3.5': 'fal-ai/stable-diffusion-v3-medium',
    }
    return modelMap[model] || 'fal-ai/flux-pro'
  }

  private updateNode(nodeId: string, data: Partial<WorkflowNode['data']>) {
    if (this.onNodeUpdate) {
      this.onNodeUpdate(nodeId, data)
    }
  }
}
