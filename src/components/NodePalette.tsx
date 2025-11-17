interface NodePaletteItemProps {
  type: string
  label: string
  description?: string
  onAdd: (type: string) => void
}

function NodePaletteItem({ type, label, description, onAdd }: NodePaletteItemProps) {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onClick={() => onAdd(type)}
      className="w-full text-left px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm transition group"
    >
      <div className="font-medium">{label}</div>
      {description && (
        <div className="text-xs text-gray-400 mt-0.5">{description}</div>
      )}
    </button>
  )
}

interface NodePaletteProps {
  onAddNode: (type: string) => void
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const nodeCategories = [
    {
      title: 'Input',
      nodes: [
        { type: 'textInput', label: 'Text Input', description: 'Enter text or prompts' },
        { type: 'imageUpload', label: 'Image Upload', description: 'Upload an image file' },
        { type: 'colorReference', label: 'Color Reference', description: 'Pick a color' },
      ],
    },
    {
      title: 'AI Generation',
      nodes: [
        { type: 'textToImage', label: 'Text to Image', description: 'Generate images from text' },
        { type: 'generate3D', label: 'Generate 3D', description: 'Image to 3D model (Rodin 2.0)' },
        { type: 'videoGen', label: 'Generate Video', description: 'Image to video (MiniMax/Kling)' },
      ],
    },
    {
      title: 'Output',
      nodes: [
        { type: 'preview', label: 'Preview', description: 'Display results' },
      ],
    },
  ]

  return (
    <div className="p-4">
      <h2 className="text-white text-sm font-semibold mb-3">Add Nodes</h2>
      <p className="text-xs text-gray-400 mb-4">Drag or click to add</p>

      <div className="space-y-4">
        {nodeCategories.map((category) => (
          <div key={category.title}>
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">
              {category.title}
            </div>
            <div className="space-y-2">
              {category.nodes.map((node) => (
                <NodePaletteItem
                  key={node.type}
                  type={node.type}
                  label={node.label}
                  description={node.description}
                  onAdd={onAddNode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-white text-xs font-semibold mb-2">Keyboard Shortcuts</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <div><kbd className="px-1 bg-gray-700 rounded">Delete</kbd> Delete node</div>
          <div><kbd className="px-1 bg-gray-700 rounded">Cmd/Ctrl + Z</kbd> Undo</div>
        </div>
      </div>
    </div>
  )
}
