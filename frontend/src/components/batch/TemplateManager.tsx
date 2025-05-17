import { useState, useEffect } from 'react'

interface Template {
  id: number
  name: string
  description: string | null
  is_public: boolean
  column_mappings: Record<string, string>
  default_values: Record<string, any> | null
  session_id: string
  created_at: string
  updated_at: string
}

interface TemplateManagerProps {
  onSelectTemplate: (templateId: number | null) => void
  selectedTemplateId: number | null
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  onSelectTemplate, 
  selectedTemplateId 
}) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    is_public: false
  })

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/batch/templates')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`)
      }
      
      const data = await response.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      setError('Template name is required')
      return
    }
    
    try {
      const response = await fetch('/api/batch/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTemplate,
          column_mappings: {},
          default_values: {}
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create template: ${response.statusText}`)
      }
      
      const createdTemplate = await response.json()
      setTemplates([...templates, createdTemplate])
      setShowCreateForm(false)
      setNewTemplate({
        name: '',
        description: '',
        is_public: false
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/batch/templates/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete template: ${response.statusText}`)
      }
      
      // Remove the deleted template from the list
      setTemplates(templates.filter(template => template.id !== id))
      
      // If the deleted template was selected, clear the selection
      if (selectedTemplateId === id) {
        onSelectTemplate(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Import Templates
        </h3>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Template'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      {showCreateForm && (
        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
            Create New Template
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="Template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Template description"
                rows={3}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                className="mr-2"
                checked={newTemplate.is_public}
                onChange={(e) => setNewTemplate({...newTemplate, is_public: e.target.checked})}
              />
              <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300">
                Make this template public
              </label>
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={handleCreateTemplate}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
          <p className="text-gray-600 dark:text-gray-400">No templates found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Create a template to save your column mappings for future use.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            {templates.map(template => (
              <div 
                key={template.id}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedTemplateId === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
                onClick={() => onSelectTemplate(template.id === selectedTemplateId ? null : template.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      {template.name}
                      {template.is_public && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
                          Public
                        </span>
                      )}
                    </h4>
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTemplate(template.id)
                    }}
                    title="Delete template"
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateManager
