import { NodeTypes } from 'reactflow'
import { TextInputNode } from '../components/nodes/TextInputNode'
import { ImageUploadNode } from '../components/nodes/ImageUploadNode'
import { TextToImageNode } from '../components/nodes/TextToImageNode'
import { PreviewNode } from '../components/nodes/PreviewNode'
import { Generate3DNode } from '../components/nodes/Generate3DNode'
import { ColorReferenceNode } from '../components/nodes/ColorReferenceNode'
import { VideoGenNode } from '../components/nodes/VideoGenNode'
import { BaseNodeData } from '../types/workflow'

export const nodeTypes: NodeTypes = {
  textInput: TextInputNode,
  imageUpload: ImageUploadNode,
  colorReference: ColorReferenceNode,
  textToImage: TextToImageNode,
  generate3D: Generate3DNode,
  videoGen: VideoGenNode,
  preview: PreviewNode,
}

// Node templates for creating new nodes
export const nodeTemplates: Record<string, Partial<BaseNodeData>> = {
  textInput: {
    label: 'Text Input',
    category: 'input',
    inputs: [],
    outputs: [
      { id: 'text', label: 'Text', type: 'text' },
    ],
    parameters: [],
    status: 'idle',
    result: '', // Empty string by default
  },
  imageUpload: {
    label: 'Image Upload',
    category: 'input',
    inputs: [],
    outputs: [
      { id: 'image', label: 'Image', type: 'image' },
    ],
    parameters: [],
    status: 'idle',
  },
  textToImage: {
    label: 'Text to Image',
    category: 'ai-generation',
    inputs: [
      { id: 'prompt', label: 'Prompt', type: 'text', required: true },
    ],
    outputs: [
      { id: 'image', label: 'Image', type: 'image' },
    ],
    parameters: [
      {
        id: 'model',
        label: 'Model',
        type: 'select',
        value: 'flux-pro',
        options: [
          { label: 'Flux Pro', value: 'flux-pro' },
          { label: 'SDXL', value: 'sdxl' },
          { label: 'Stable Diffusion 3.5', value: 'sd-3.5' },
        ],
      },
      {
        id: 'width',
        label: 'Width',
        type: 'number',
        value: 1024,
        min: 256,
        max: 2048,
      },
      {
        id: 'height',
        label: 'Height',
        type: 'number',
        value: 1024,
        min: 256,
        max: 2048,
      },
      {
        id: 'steps',
        label: 'Steps',
        type: 'slider',
        value: 30,
        min: 1,
        max: 100,
      },
    ],
    status: 'idle',
  },
  colorReference: {
    label: 'Color Reference',
    category: 'input',
    inputs: [],
    outputs: [
      { id: 'color', label: 'Color', type: 'text' },
    ],
    parameters: [],
    status: 'complete',
    result: '#3b82f6', // Default blue color
  },
  generate3D: {
    label: 'Generate 3D Model',
    category: 'ai-generation',
    inputs: [
      { id: 'image', label: 'Image', type: 'image', required: true },
      { id: 'prompt', label: 'Prompt', type: 'text' },
    ],
    outputs: [
      { id: 'model', label: '3D Model', type: 'text' },
    ],
    parameters: [
      {
        id: 'model',
        label: 'Model',
        type: 'select',
        value: 'rodin-2.0',
        options: [
          { label: 'Rodin 2.0', value: 'rodin-2.0' },
        ],
      },
      {
        id: 'format',
        label: 'Format',
        type: 'select',
        value: 'glb',
        options: [
          { label: 'GLB', value: 'glb' },
          { label: 'OBJ', value: 'obj' },
        ],
      },
    ],
    status: 'idle',
  },
  videoGen: {
    label: 'Generate Video',
    category: 'ai-generation',
    inputs: [
      { id: 'image', label: 'Image', type: 'image', required: false },
      { id: 'prompt', label: 'Prompt', type: 'text', required: false },
    ],
    outputs: [
      { id: 'video', label: 'Video', type: 'video' },
    ],
    parameters: [
      {
        id: 'model',
        label: 'Model',
        type: 'select',
        value: 'minimax',
        options: [
          { label: 'MiniMax', value: 'minimax' },
          { label: 'Kling', value: 'kling' },
        ],
      },
      {
        id: 'duration',
        label: 'Duration (seconds)',
        type: 'slider',
        value: 5,
        min: 2,
        max: 10,
      },
    ],
    status: 'idle',
  },
  preview: {
    label: 'Preview',
    category: 'output',
    inputs: [
      { id: 'data', label: 'Data', type: 'image' },
    ],
    outputs: [],
    parameters: [],
    status: 'idle',
  },
}

// Helper to create a new node from template
export function createNodeFromTemplate(
  type: string,
  position: { x: number; y: number }
) {
  const template = nodeTemplates[type]
  if (!template) {
    throw new Error(`Unknown node type: ${type}`)
  }

  return {
    id: `${type}-${Date.now()}`,
    type,
    position,
    data: {
      ...template,
    } as BaseNodeData,
  }
}
