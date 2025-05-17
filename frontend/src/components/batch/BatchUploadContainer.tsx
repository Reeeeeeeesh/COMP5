import { useState } from 'react'
import FileUpload from './FileUpload'
import TemplateManager from './TemplateManager'

const BatchUploadContainer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setUploadError(null)
    setUploadProgress(0)
  }

  const [uploadId, setUploadId] = useState<number | null>(null)
  const [uploadSummary, setUploadSummary] = useState<{
    rowsProcessed: number;
    rowsSaved: number;
    teams: string[];
    templateApplied?: boolean;
    templateName?: string;
  } | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append('file', file)
      
      // Add template ID if selected
      if (selectedTemplateId) {
        formData.append('template_id', selectedTemplateId.toString())
      }
      
      // Track upload progress
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/batch/uploads/file')
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      }
      
      // Handle response
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
      })
      
      // Send the request
      xhr.send(formData)
      
      // Wait for the response
      const response = await uploadPromise
      
      // Handle validation errors
      if (!response.valid) {
        if (response.error_type === 'missing_columns') {
          throw new Error(`Missing required columns: ${response.missing_columns.join(', ')}`)
        } else if (response.error_type === 'invalid_data') {
          throw new Error('File contains invalid data. Please check the data types and ranges.')
        } else {
          throw new Error('File validation failed')
        }
      }
      
      // Store the upload ID and summary
      setUploadId(response.upload_id)
      setUploadSummary({
        rowsProcessed: response.rows_processed,
        rowsSaved: response.rows_saved,
        teams: [],
        templateApplied: response.template_applied,
        templateName: response.template_name
      })
      
      // Get validation summary
      if (response.upload_id) {
        const validationResponse = await fetch(`/api/batch/uploads/${response.upload_id}/validate`)
        if (validationResponse.ok) {
          const validationData = await validationResponse.json()
          setUploadSummary(prev => ({
            ...prev!,
            teams: validationData.teams || []
          }))
        }
      }
      
      // Reset upload state
      setIsUploading(false)
      setUploadProgress(100)
      
    } catch (error) {
      setIsUploading(false)
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred')
    }
  }

  const handleDownloadTemplate = (format: 'csv' | 'excel') => {
    window.location.href = `/api/batch/uploads/template/${format}`
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Batch Data Upload
      </h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Step 1: Upload Employee Data File
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Upload a CSV or Excel file containing employee data for batch processing.
          Make sure your file includes all required fields.
        </p>
        
        <FileUpload 
          onFileSelect={handleFileSelect}
          acceptedFileTypes=".csv,.xlsx,.xls"
          maxSizeMB={10}
        />
        
        <TemplateManager 
          onSelectTemplate={setSelectedTemplateId}
          selectedTemplateId={selectedTemplateId}
        />
        
        {selectedTemplateId && (
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-md">
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
              <span>Template will be applied during upload</span>
            </div>
          </div>
        )}
      </div>
      
      {file && (
        <div className="mt-6">
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              isUploading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
          
          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {uploadProgress}% Uploaded
              </p>
            </div>
          )}
          
          {uploadProgress === 100 && !isUploading && uploadId && uploadSummary && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>File uploaded successfully! Ready for column mapping.</span>
              </div>
              
              <div className="mt-2 text-sm">
                <p><strong>Upload ID:</strong> {uploadId}</p>
                <p><strong>Rows Processed:</strong> {uploadSummary.rowsProcessed}</p>
                <p><strong>Rows Saved:</strong> {uploadSummary.rowsSaved}</p>
                {uploadSummary.templateApplied && (
                  <p><strong>Template Applied:</strong> {uploadSummary.templateName}</p>
                )}
                {uploadSummary.teams.length > 0 && (
                  <div>
                    <p><strong>Teams:</strong></p>
                    <ul className="list-disc list-inside ml-2">
                      {uploadSummary.teams.map((team, index) => (
                        <li key={index}>{team}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* This button will be implemented in the next subtask */}
              <button
                className="mt-4 px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-300 rounded-md hover:bg-green-300 dark:hover:bg-green-700 transition-colors"
                onClick={() => console.log('Proceed to column mapping')}
              >
                Continue to Column Mapping
              </button>
            </div>
          )}
        </div>
      )}
      
      {uploadError && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{uploadError}</span>
          </div>
        </div>
      )}
      
      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Supported File Formats
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
          <li>CSV (Comma Separated Values)</li>
          <li>Excel (.xlsx, .xls)</li>
        </ul>
        
        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">
          Required Fields
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
          <li>Employee ID</li>
          <li>Name</li>
          <li>Team</li>
          <li>Base Salary</li>
          <li>Target Bonus Percentage</li>
          <li>Investment Weight</li>
          <li>Qualitative Weight</li>
          <li>Investment Score Multiplier</li>
          <li>Qualitative Score Multiplier</li>
          <li>Revenue Adjustment Factor (RAF)</li>
        </ul>
        
        <div className="mt-4 flex space-x-4">
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            onClick={() => handleDownloadTemplate('csv')}
          >
            Download CSV Template
          </button>
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            onClick={() => handleDownloadTemplate('excel')}
          >
            Download Excel Template
          </button>
        </div>
      </div>
    </div>
  )
}

export default BatchUploadContainer
