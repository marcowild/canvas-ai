import { memo, useRef } from 'react'
import { NodeProps } from 'reactflow'
import { BaseNode } from './BaseNode'
import { BaseNodeData } from '../../types/workflow'
import { useWorkflowStore } from '../../stores/workflowStore'

export const ImageUploadNode = memo((props: NodeProps<BaseNodeData>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        updateNodeData(props.id, { result: dataUrl, status: 'complete' })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <BaseNode {...props}>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {!props.data.result ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 hover:bg-gray-600 transition"
          >
            Upload Image
          </button>
        ) : (
          <div>
            <img
              src={props.data.result}
              alt="Uploaded"
              className="w-full rounded border border-gray-700 mb-2"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition"
            >
              Change Image
            </button>
          </div>
        )}
      </div>
    </BaseNode>
  )
})

ImageUploadNode.displayName = 'ImageUploadNode'
