import { useRef, useState } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedFileTypes?: string
  maxSizeMB?: number
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedFileTypes = '.csv,.xlsx,.xls',
  maxSizeMB = 10
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateFile = (file: File): boolean => {
    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase() || ''
    const isValidType = acceptedFileTypes
      .split(',')
      .some(type => type.includes(fileType))
    
    if (!isValidType) {
      setError(`Invalid file type. Accepted types: ${acceptedFileTypes}`)
      return false
    }
    
    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds the limit of ${maxSizeMB}MB`)
      return false
    }
    
    setError(null)
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedFileTypes}
        />
        
        {!selectedFile ? (
          <div className="space-y-2">
            <div className="flex justify-center">
              <svg 
                className="w-12 h-12 text-gray-400 dark:text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Drag and drop your file here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Accepted file types: {acceptedFileTypes}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maximum file size: {maxSizeMB}MB
            </p>
          </div>
        ) : (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-green-500" 
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
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
            </p>
            <button
              className="px-3 py-1 text-sm text-red-600 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              onClick={handleRemoveFile}
            >
              Remove
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}

export default FileUpload
