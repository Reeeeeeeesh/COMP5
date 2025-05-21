import React, { useState } from 'react';
import FileUpload from './FileUpload';

const SimpleBatchUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [useTemplateFormat, setUseTemplateFormat] = useState(true);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadError(null);
    setUploadProgress(0);
    setUploadSuccess(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skip_mapping', useTemplateFormat.toString());
      
      setUploadProgress(30);
      
      // Send the upload request
      const response = await fetch('/api/v1/batch/file', {
        method: 'POST',
        body: formData,
      });
      
      setUploadProgress(70);
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Upload response:', result);
      
      setUploadProgress(100);
      setUploadSuccess(`File uploaded successfully! Upload ID: ${result.upload_id}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        Batch Upload
      </h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
          Upload Employee Data
        </h3>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useTemplateFormat}
              onChange={() => setUseTemplateFormat(!useTemplateFormat)}
              className="mr-2"
            />
            <span className="text-gray-700 dark:text-gray-300">
              This file follows the template format (skip column mapping)
            </span>
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Check this if your file follows the expected column format. This will skip the column mapping step.
          </p>
        </div>
        
        <FileUpload onFileSelect={handleFileSelect} />
        
        {file && (
          <div className="mt-4 flex justify-end">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        )}
        
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
              {uploadProgress}% complete
            </p>
          </div>
        )}
        
        {uploadSuccess && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{uploadSuccess}</span>
            </div>
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
      </div>
    </div>
  );
};

export default SimpleBatchUpload;
