import { memo, useMemo } from 'react'
import { useWorkflowStore } from '../stores/workflowStore'
import { BaseNodeData, NodeParameter } from '../types/workflow'

export const PropertiesPanel = memo(() => {
  const { selectedNodeId, updateNodeData, nodes } = useWorkflowStore()

  // Get node from store to ensure we have latest data
  const node = useMemo(() =>
    selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null,
    [nodes, selectedNodeId]
  )

  const nodeData = node?.data as BaseNodeData | undefined

  // Filter parameters based on model selection for text-to-image and video-gen nodes
  const visibleParameters = useMemo(() => {
    if (!node || !nodeData) return []

    const modelParam = nodeData.parameters.find(p => p.id === 'model')

    // Handle text-to-image nodes
    if (node.type === 'textToImage') {
      const isGemini = modelParam?.value === 'gemini-2.5-flash'

      return nodeData.parameters.filter(param => {
        // Always show model parameter
        if (param.id === 'model') return true

        // For Gemini, show aspect ratio but hide width/height/steps
        if (isGemini) {
          return param.id === 'aspectRatio'
        }

        // For other models, hide aspect ratio but show width/height/steps
        return param.id !== 'aspectRatio'
      })
    }

    // Handle video-gen nodes
    if (node.type === 'videoGen') {
      const isVeo = modelParam?.value === 'veo-3'

      // For Veo, filter duration options to only show 4s, 6s, 8s
      if (isVeo) {
        return nodeData.parameters.map(param => {
          if (param.id === 'duration') {
            return {
              ...param,
              options: param.options?.filter(opt =>
                ['4s', '6s', '8s'].includes(opt.value as string)
              )
            }
          }
          return param
        })
      }
    }

    return nodeData.parameters
  }, [node, nodeData])

  // Early return AFTER all hooks
  if (!selectedNodeId || !node || !nodeData) {
    return (
      <div className="w-80 bg-gray-900 border-l border-gray-800 p-4">
        <div className="text-gray-400 text-sm">
          Select a node to view its properties
        </div>
      </div>
    )
  }

  const handleParameterChange = (parameterId: string, value: any) => {
    const updatedParameters = nodeData.parameters.map(param =>
      param.id === parameterId ? { ...param, value } : param
    )
    updateNodeData(selectedNodeId, { parameters: updatedParameters })
  }

  const renderParameterInput = (param: NodeParameter) => {
    switch (param.type) {
      case 'select':
        return (
          <select
            value={param.value as string}
            onChange={(e) => handleParameterChange(param.id, e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {param.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'number':
        return (
          <input
            type="number"
            value={param.value as number}
            onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
            min={param.min}
            max={param.max}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          />
        )

      case 'slider':
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={param.value as number}
              onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
              min={param.min}
              max={param.max}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-right">{param.value}</div>
          </div>
        )

      case 'text':
        return (
          <input
            type="text"
            value={param.value as string}
            onChange={(e) => handleParameterChange(param.id, e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-white font-semibold text-lg">{nodeData.label}</h3>
          <p className="text-gray-400 text-xs mt-1 capitalize">{nodeData.category?.replace('-', ' ')}</p>
        </div>

        {/* Node Status */}
        <div>
          <div className="text-xs text-gray-500 uppercase mb-1">Status</div>
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            nodeData.status === 'complete' ? 'bg-green-900/30 text-green-400' :
            nodeData.status === 'running' ? 'bg-blue-900/30 text-blue-400' :
            nodeData.status === 'error' ? 'bg-red-900/30 text-red-400' :
            'bg-gray-800 text-gray-400'
          }`}>
            {nodeData.status}
          </div>
        </div>

        {/* Parameters */}
        {visibleParameters.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-3">Parameters</div>
            <div className="space-y-4">
              {visibleParameters.map(param => (
                <div key={param.id}>
                  <label className="block text-sm text-gray-300 mb-2">
                    {param.label}
                  </label>
                  {renderParameterInput(param)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inputs */}
        {nodeData.inputs.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-2">Inputs</div>
            <div className="space-y-1">
              {nodeData.inputs.map(input => (
                <div key={input.id} className="text-sm text-gray-400">
                  <span className="text-gray-300">{input.label}</span>
                  {input.required && <span className="text-red-400 ml-1">*</span>}
                  <span className="text-gray-600 ml-2">({input.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outputs */}
        {nodeData.outputs.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-2">Outputs</div>
            <div className="space-y-1">
              {nodeData.outputs.map(output => (
                <div key={output.id} className="text-sm text-gray-400">
                  <span className="text-gray-300">{output.label}</span>
                  <span className="text-gray-600 ml-2">({output.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {nodeData.error && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-2">Error</div>
            <div className="text-sm text-red-400 bg-red-900/20 p-3 rounded border border-red-900/50">
              {nodeData.error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

PropertiesPanel.displayName = 'PropertiesPanel'
