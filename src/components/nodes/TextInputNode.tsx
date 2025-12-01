import { memo, useState, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, useReactFlow } from 'reactflow'
import { BaseNode } from './BaseNode'
import { BaseNodeData } from '../../types/workflow'
import { useWorkflowStore } from '../../stores/workflowStore'

const MIN_HEIGHT = 180
const MAX_HEIGHT = 320 // ~15 lines of text
const HEADER_HEIGHT = 45 // Approximate header height

export const TextInputNode = memo((props: NodeProps<BaseNodeData>) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const [text, setText] = useState(props.data.result || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { setNodes } = useReactFlow()

  // Sync local state with props.data.result
  useEffect(() => {
    if (props.data.result !== text) {
      setText(props.data.result || '')
    }
  }, [props.data.result])

  const autoResizeNode = () => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current

    // Create a hidden clone to measure actual content height
    const clone = document.createElement('textarea')
    clone.style.cssText = window.getComputedStyle(textarea).cssText
    clone.style.height = 'auto'
    clone.style.position = 'absolute'
    clone.style.visibility = 'hidden'
    clone.style.pointerEvents = 'none'
    clone.value = textarea.value
    document.body.appendChild(clone)

    const scrollHeight = clone.scrollHeight
    document.body.removeChild(clone)

    // Calculate required node height
    const requiredHeight = Math.min(
      Math.max(scrollHeight + HEADER_HEIGHT + 30, MIN_HEIGHT),
      MAX_HEIGHT
    )

    // Update node dimensions
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id
          ? {
              ...node,
              style: { ...node.style, height: requiredHeight },
            }
          : node
      )
    )
  }

  const handleChange = (value: string) => {
    setText(value)
    updateNodeData(props.id, { result: value })

    // Auto-resize after state update
    setTimeout(autoResizeNode, 0)
  }

  return (
    <>
      <NodeResizer
        minWidth={290}
        minHeight={MIN_HEIGHT}
        maxHeight={MAX_HEIGHT}
        isVisible={props.selected}
        lineClassName="!border-blue-500"
        handleClassName="!bg-blue-500 !w-2 !h-2"
      />
      <BaseNode {...props}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onWheel={(e) => e.stopPropagation()}
          placeholder="Enter text..."
          className="w-full flex-1 px-2 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500 resize-none nodrag nowheel"
          style={{ minHeight: '80px', overflowY: 'auto' }}
        />
      </BaseNode>
    </>
  )
})

TextInputNode.displayName = 'TextInputNode'
