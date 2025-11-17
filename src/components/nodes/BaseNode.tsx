import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { BaseNodeData } from '../../types/workflow'

interface BaseNodeProps extends NodeProps<BaseNodeData> {
  children?: React.ReactNode
  onRun?: () => void
  onCancel?: () => void
  canRun?: boolean
}

const statusColors = {
  idle: 'bg-gray-700',
  running: 'bg-yellow-600',
  complete: 'bg-green-600',
  error: 'bg-red-600',
}

const categoryColors = {
  input: 'border-blue-500',
  'ai-generation': 'border-purple-500',
  processing: 'border-orange-500',
  output: 'border-green-500',
}

export const BaseNode = memo(({ data, selected, children, onRun, onCancel, canRun }: BaseNodeProps) => {
  const statusColor = statusColors[data.status || 'idle']
  const categoryColor = categoryColors[data.category]
  const isAINode = data.category === 'ai-generation'

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-lg border-2 ${categoryColor} ${
        selected ? 'ring-2 ring-blue-400' : ''
      } min-w-[200px] max-w-[300px]`}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
          <h3 className="text-sm font-semibold text-white">{data.label}</h3>
        </div>
        {isAINode && (
          <div className="flex items-center space-x-1">
            {data.status === 'running' && onCancel ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel()
                }}
                className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                title="Stop execution"
              >
                Stop
              </button>
            ) : onRun ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRun()
                }}
                disabled={!canRun || data.status === 'running'}
                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title={!canRun ? 'Required inputs missing' : 'Run this node'}
              >
                Run
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Inputs */}
      {data.inputs.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{
            top: `${((index + 1) * 100) / (data.inputs.length + 1)}%`,
            background: getHandleColor(input.type),
          }}
          className="w-3 h-3 border-2 border-gray-800"
        />
      ))}

      {/* Content */}
      <div className="px-4 py-3">
        {children || (
          <div className="text-xs text-gray-400">
            {/* Show model parameter prominently for AI nodes */}
            {isAINode && data.parameters.find(p => p.id === 'model') && (
              <div className="mb-2 pb-2 border-b border-gray-700">
                <div className="font-semibold text-gray-300 text-xs mb-1">Model:</div>
                <div className="text-white text-xs">
                  {data.parameters.find(p => p.id === 'model')?.options?.find(
                    opt => opt.value === data.parameters.find(p => p.id === 'model')?.value
                  )?.label || data.parameters.find(p => p.id === 'model')?.value}
                </div>
              </div>
            )}
            {data.inputs.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold text-gray-300 mb-1">Inputs:</div>
                {data.inputs.map((input) => (
                  <div key={input.id} className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: getHandleColor(input.type) }}
                    ></div>
                    <span>{input.label}</span>
                  </div>
                ))}
              </div>
            )}
            {data.parameters.length > 0 && !isAINode && (
              <div className="text-gray-400 text-xs">
                {data.parameters.length} parameter(s)
              </div>
            )}
          </div>
        )}

        {/* Status messages */}
        {data.status === 'running' && (
          <div className="mt-2 text-xs text-yellow-400">Processing...</div>
        )}
        {data.status === 'error' && data.error && (
          <div className="mt-2 text-xs text-red-400">{data.error}</div>
        )}
        {data.status === 'complete' && data.result && (
          <div className="mt-2">
            {typeof data.result === 'string' && data.result.startsWith('http') ? (
              // Check if it's a video file
              data.result.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video
                  src={data.result}
                  controls
                  className="w-full rounded border border-gray-700"
                />
              ) : data.result.match(/\.(glb|obj|gltf)$/i) ? (
                // 3D model - show link instead
                <a
                  href={data.result}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  View 3D Model
                </a>
              ) : (
                // Assume it's an image
                <img
                  src={data.result}
                  alt="Result"
                  className="w-full rounded border border-gray-700"
                />
              )
            ) : (
              <div className="text-xs text-green-400">✓ Complete</div>
            )}
          </div>
        )}
      </div>

      {/* Outputs */}
      {data.outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{
            top: `${((index + 1) * 100) / (data.outputs.length + 1)}%`,
            background: getHandleColor(output.type),
          }}
          className="w-3 h-3 border-2 border-gray-800"
        />
      ))}
    </div>
  )
})

BaseNode.displayName = 'BaseNode'

// Helper function to get handle color based on data type
function getHandleColor(type: string): string {
  const colors: Record<string, string> = {
    text: '#a855f7', // purple
    image: '#22c55e', // green
    number: '#3b82f6', // blue
    video: '#ef4444', // red
    array: '#06b6d4', // cyan
    mask: '#84cc16', // lime
  }
  return colors[type] || '#6b7280' // gray default
}
