import { useState, useEffect } from 'react'

interface ColumnMapperProps {
  uploadId: number
  onMappingComplete: (mappedData: MappingResult) => void
  templateId?: number | null
}

interface ColumnInfo {
  name: string
  sample: string[]
}

interface MappingResult {
  columnMappings: Record<string, string>
  defaultValues: Record<string, any>
  templateName?: string
  templateId?: number
}

const REQUIRED_FIELDS = [
  'employee_id',
  'name',
  'team',
  'base_salary',
  'target_bonus_pct',
  'investment_weight',
  'qualitative_weight',
  'investment_score_multiplier',
  'qual_score_multiplier',
  'raf'
]

const OPTIONAL_FIELDS = [
  'is_mrt',
  'mrt_cap_pct'
]

const FIELD_LABELS: Record<string, string> = {
  'employee_id': 'Employee ID',
  'name': 'Name',
  'team': 'Team',
  'base_salary': 'Base Salary',
  'target_bonus_pct': 'Target Bonus %',
  'investment_weight': 'Investment Weight',
  'qualitative_weight': 'Qualitative Weight',
  'investment_score_multiplier': 'Investment Score Multiplier',
  'qual_score_multiplier': 'Qualitative Score Multiplier',
  'raf': 'Revenue Adjustment Factor (RAF)',
  'is_mrt': 'Is MRT',
  'mrt_cap_pct': 'MRT Cap %'
}

const ColumnMapper: React.FC<ColumnMapperProps> = ({ 
  uploadId, 
  onMappingComplete,
  templateId 
}) => {
  const [sourceColumns, setSourceColumns] = useState<ColumnInfo[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState<string | undefined>()
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [isPublicTemplate, setIsPublicTemplate] = useState(false)

  // Fetch source columns and template (if provided) on component mount
  useEffect(() => {
    fetchSourceColumns()
  }, [uploadId, templateId])

  const fetchSourceColumns = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch source columns from the uploaded file
      const response = await fetch(`/api/batch/uploads/${uploadId}/columns`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch columns: ${response.statusText}`)
      }
      
      const data = await response.json()
      setSourceColumns(data.columns || [])
      
      // If a template ID is provided, fetch and apply the template
      if (templateId) {
        await applyTemplate(templateId)
      } else {
        // Try to auto-map columns based on name similarity
        const autoMappings = generateAutoMappings(data.columns || [])
        setMappings(autoMappings)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const applyTemplate = async (templateId: number) => {
    try {
      const response = await fetch(`/api/batch/templates/${templateId}/apply?upload_id=${uploadId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to apply template: ${response.statusText}`)
      }
      
      const data = await response.json()
      setMappings(data.column_mappings || {})
      setDefaultValues(data.default_values || {})
      setTemplateName(data.template_name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template')
    }
  }

  const generateAutoMappings = (columns: ColumnInfo[]): Record<string, string> => {
    const autoMappings: Record<string, string> = {}
    
    // Create variations of field names for matching
    const fieldVariations: Record<string, string[]> = {}
    
    for (const field of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
      fieldVariations[field] = [
        field,
        field.toLowerCase(),
        field.toUpperCase(),
        field.replace(/_/g, ' '),
        field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        field.replace(/_(\w)/g, (_, c) => c.toUpperCase()),
        field.replace(/_/g, '')
      ]
    }
    
    // Try to match source columns to fields
    for (const column of columns) {
      const columnName = column.name
      
      // Check if the column name matches any field variation
      for (const [field, variations] of Object.entries(fieldVariations)) {
        if (variations.includes(columnName)) {
          autoMappings[columnName] = field
          break
        }
      }
    }
    
    return autoMappings
  }

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    // If this source column was previously mapped to a different field, remove that mapping
    const updatedMappings = { ...mappings }
    
    // If selecting "Not Mapped", remove the mapping
    if (targetField === '') {
      delete updatedMappings[sourceColumn]
    } else {
      updatedMappings[sourceColumn] = targetField
    }
    
    setMappings(updatedMappings)
  }

  const handleDefaultValueChange = (field: string, value: any) => {
    const updatedDefaultValues = { ...defaultValues }
    
    // Convert value to appropriate type based on field
    let typedValue: any = value
    
    if (['base_salary', 'target_bonus_pct', 'investment_weight', 'qualitative_weight', 
         'investment_score_multiplier', 'qual_score_multiplier', 'raf', 'mrt_cap_pct'].includes(field)) {
      typedValue = value === '' ? null : parseFloat(value)
    } else if (field === 'is_mrt') {
      typedValue = value === 'true'
    }
    
    updatedDefaultValues[field] = typedValue
    setDefaultValues(updatedDefaultValues)
  }

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
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
          name: newTemplateName,
          description: newTemplateDescription || null,
          is_public: isPublicTemplate,
          column_mappings: mappings,
          default_values: defaultValues
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save template: ${response.statusText}`)
      }
      
      const data = await response.json()
      setSaveAsTemplate(false)
      setNewTemplateName('')
      setNewTemplateDescription('')
      setIsPublicTemplate(false)
      setTemplateName(data.name)
      
      // Show success message
      alert('Template saved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    }
  }

  const handleComplete = () => {
    // Check if all required fields are mapped or have default values
    const unmappedRequiredFields = REQUIRED_FIELDS.filter(field => {
      // Check if the field is mapped from a source column
      const isMapped = Object.values(mappings).includes(field)
      // Check if the field has a default value
      const hasDefaultValue = field in defaultValues && defaultValues[field] !== null && defaultValues[field] !== undefined
      
      return !isMapped && !hasDefaultValue
    })
    
    if (unmappedRequiredFields.length > 0) {
      setError(`The following required fields are not mapped: ${unmappedRequiredFields.map(f => FIELD_LABELS[f]).join(', ')}`)
      return
    }
    
    // Pass the mapping result to the parent component
    onMappingComplete({
      columnMappings: mappings,
      defaultValues,
      templateName,
      templateId
    })
  }

  const getTargetFieldOptions = (sourceColumn: string) => {
    return [
      { value: '', label: 'Not Mapped' },
      ...REQUIRED_FIELDS.map(field => ({
        value: field,
        label: FIELD_LABELS[field],
        isRequired: true
      })),
      ...OPTIONAL_FIELDS.map(field => ({
        value: field,
        label: FIELD_LABELS[field],
        isRequired: false
      }))
    ]
  }

  const getMappedFields = () => {
    return Object.values(mappings)
  }

  const getUnmappedRequiredFields = () => {
    return REQUIRED_FIELDS.filter(field => !getMappedFields().includes(field))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Column Mapping
      </h2>
      
      {templateName && (
        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-md">
          <div className="flex items-center">
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Using template: <strong>{templateName}</strong></span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Loading columns...</p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Source Columns
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Map each column from your file to the appropriate field in the system.
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Source Column
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sample Data
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Field
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sourceColumns.map((column, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                        {column.name}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                        {column.sample.slice(0, 3).join(', ')}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                        <select
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          value={mappings[column.name] || ''}
                          onChange={(e) => handleMappingChange(column.name, e.target.value)}
                        >
                          {getTargetFieldOptions(column.name).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} {option.isRequired ? '(Required)' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {getUnmappedRequiredFields().length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Default Values for Unmapped Required Fields
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Provide default values for required fields that are not mapped to any source column.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getUnmappedRequiredFields().map((field) => (
                  <div key={field} className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {FIELD_LABELS[field]}
                    </label>
                    {field === 'is_mrt' ? (
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        value={defaultValues[field]?.toString() || 'false'}
                        onChange={(e) => handleDefaultValueChange(field, e.target.value === 'true')}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        value={defaultValues[field] || ''}
                        onChange={(e) => handleDefaultValueChange(field, e.target.value)}
                        placeholder={`Enter default value for ${FIELD_LABELS[field]}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-6">
            <div>
              {!saveAsTemplate && (
                <button
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70 transition-colors"
                  onClick={() => setSaveAsTemplate(true)}
                >
                  Save as Template
                </button>
              )}
            </div>
            
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleComplete}
            >
              Continue to Processing
            </button>
          </div>
          
          {saveAsTemplate && (
            <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Save as Template
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Enter template description"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    className="mr-2"
                    checked={isPublicTemplate}
                    onChange={(e) => setIsPublicTemplate(e.target.checked)}
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300">
                    Make this template public
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setSaveAsTemplate(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={handleSaveTemplate}
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ColumnMapper
