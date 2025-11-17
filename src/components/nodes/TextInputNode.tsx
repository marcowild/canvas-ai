import { memo, useState, useEffect } from 'react'
import { NodeProps } from 'reactflow'
import { BaseNode } from './BaseNode'
import { BaseNodeData } from '../../types/workflow'
import { useWorkflowStore } from '../../stores/workflowStore'

export const TextInputNode = memo((props: NodeProps<BaseNodeData>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const [text, setText] = useState(props.data.result || '')

  // Sync local state with props.data.result
  useEffect(() => {
    if (props.data.result !== text) {
      setText(props.data.result || '')
    }
  }, [props.data.result])

  const handleChange = (value: string) => {
    setText(value)
    updateNodeData(props.id, { result: value })
  }

  return (
    <BaseNode {...props}>
      <div>
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter text..."
          className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
        />
      </div>
    </BaseNode>
  )
})

TextInputNode.displayName = 'TextInputNode'
