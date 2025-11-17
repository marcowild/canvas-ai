import { memo, useState } from 'react'
import { NodeProps } from 'reactflow'
import { BaseNode } from './BaseNode'
import { BaseNodeData } from '../../types/workflow'
import { useWorkflowStore } from '../../stores/workflowStore'

export const ColorReferenceNode = memo((props: NodeProps<BaseNodeData>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const [color, setColor] = useState(props.data.result || '#3b82f6')

  const handleChange = (value: string) => {
    setColor(value)
    updateNodeData(props.id, { result: value, status: 'complete' })
  }

  return (
    <BaseNode {...props}>
      <div>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={color}
            onChange={(e) => handleChange(e.target.value)}
            className="w-12 h-12 rounded border border-gray-600 cursor-pointer"
          />
          <div className="flex-1">
            <input
              type="text"
              value={color}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600 focus:outline-none focus:border-blue-500 font-mono"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
    </BaseNode>
  )
})

ColorReferenceNode.displayName = 'ColorReferenceNode'
