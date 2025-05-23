import { useState, useEffect } from 'react'
import FileUpload from './FileUpload'
import TemplateManager from './TemplateManager'
import ColumnMapper from './ColumnMapper' // Import ColumnMapper
import type { MappingResult } from './ColumnMapper' // Import MappingResult type

// Define types for API responses if not already available globally
interface BatchUploadFileResponse {
  message: string;
  upload_id: number;
  filename: string;
  status: string; // e.g., "awaiting_mapping", "ready_for_processing"
  session_id: string;
  source_columns_info: any[]; // Define more strictly if possible
  validation_results: any; // Define more strictly if possible
  // Fields from previous version of handleUpload that might be part of this response
  valid?: boolean; 
  error_type?: string;
  missing_columns?: string[];
  rows_processed?: number; // These might come from a /validate call or initial processing
  rows_saved?: number;
  template_applied?: boolean;
  template_name?: string;
}

interface MapAndProcessResponse {
  message: string;
  upload_id: number;
  rows_processed: number;
  rows_saved: number;
  // Add other fields if the actual response contains more
}

// This type should align with BatchCalculationResultWithEmployees from backend schemas
interface CalculationData {
  id: number;
  scenario_id: number;
  calculation_date: string; // Assuming ISO string
  total_bonus_pool: number;
  average_bonus: number;
  total_employees: number;
  capped_employees: number;
  employee_results: EmployeeCalculationResult[];
  // Add other fields from BatchCalculationResultBase and relationships if needed
}

interface EmployeeCalculationResult { // From backend schema EmployeeCalculationResult
  id: number;
  batch_result_id: number;
  employee_data_id: number; // This is the PK of the EmployeeData record (integer)
  investment_component: number;
  qualitative_component: number;
  weighted_performance: number;
  pre_raf_bonus: number;
  final_bonus: number;
  bonus_to_salary_ratio: number;
  policy_breach: boolean;
  applied_cap?: string | null;
  created_at: string;
  updated_at: string;
}

// For data from GET /api/batch/uploads/{uploadId}/employees
interface BackendEmployeeData { // From backend schema EmployeeData
  id: number; // Primary Key
  batch_upload_id: number;
  employee_id: string | null; // String Employee ID from input file
  name: string | null;
  team: string | null;
  base_salary: number;
  target_bonus_pct: number;
  investment_weight: number;
  qualitative_weight: number;
  investment_score_multiplier: number;
  qual_score_multiplier: number;
  raf: number;
  is_mrt: boolean;
  mrt_cap_pct: number | null;
  parameter_overrides: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// For data structure to be stored in sessionStorage
interface PlaygroundEmployeeData {
  id: string; // string employee_id
  name: string | null;
  team: string | null;
  salary: number;
  bonus: number;
  ratio: number;
  performance: string;
  // Raw input fields
  target_bonus_pct: number;
  investment_weight: number;
  qualitative_weight: number;
  investment_score_multiplier: number;
  qual_score_multiplier: number;
  raf: number;
  is_mrt: boolean;
  mrt_cap_pct: number | null;
}

interface PlaygroundData {
  employee_results: PlaygroundEmployeeData[];
  parameters: {
    bonusPool: number;
    capPercent: number; // Example default
  };
}


type Stage =
  | 'initial'
  | 'fileSelected'
  | 'uploadingFile'
  | 'fileUploaded'
  | 'mapping'
  | 'processingMapping'
  | 'calculatingBonuses'
  | 'calculationComplete'
  | 'fetchingEmployeeDetails' // New stage
  | 'calculationCompleteAndStored' // New stage for final success
  | 'error';

const BatchUploadContainer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  // const [isUploading, setIsUploading] = useState(false) // Replaced by currentStage
  const [uploadProgress, setUploadProgress] = useState(0)
  // const [uploadError, setUploadError] = useState<string | null>(null) // Consolidated into generalError

  const [currentStage, setCurrentStage] = useState<Stage>('initial');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);


  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setGeneralError(null)
    setUploadProgress(0)
    setCurrentStage('fileSelected');
    setStatusMessage(`${selectedFile.name} selected. Ready to upload.`);
  }

  const [uploadId, setUploadId] = useState<number | null>(null)
  const [uploadSummary, setUploadSummary] = useState<{
    rowsProcessed?: number; // Made optional as they might not be available initially
    rowsSaved?: number;
    teams?: string[];
    templateApplied?: boolean;
    templateName?: string;
    filename?: string;
    status?: string; // from BatchUploadFileResponse
  } | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [calculationData, setCalculationData] = useState<CalculationData | null>(null);


  const handleInitialUpload = async () => {
    if (!file) return

    setCurrentStage('uploadingFile');
    setGeneralError(null);
    setUploadProgress(0);
    setStatusMessage('Uploading file...');
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (selectedTemplateId) {
        formData.append('template_id', selectedTemplateId.toString())
        // If template is selected, it implies skipping mapping in some flows
        // For this task, we assume template_id might mean "skip_mapping=true" on backend
        // Or it's just a pre-selected template for the ColumnMapper
        // The backend /file endpoint has a skip_mapping Form parameter.
        // For now, we'll assume a template implies user wants to use it,
        // and the backend decides if it means skipping mapping or just pre-filling.
        // formData.append('skip_mapping', 'true'); // Example if template implies skipping
      }
      
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/batch/file') // Ensure this matches backend: /api/batch/uploads/file or /api/batch/file
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      }
      
      const responsePromise = new Promise<BatchUploadFileResponse>((resolve, reject) => {
        xhr.onload = () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response);
            } else {
              // Try to use detail from response, otherwise use statusText or generic error
              const errorMsg = response.detail || (xhr.statusText || `Upload failed with status ${xhr.status}`);
              reject(new Error(errorMsg));
            }
          } catch (e) {
            reject(new Error('Error parsing server response during initial upload.'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
      });
      
      xhr.send(formData);
      const responseData = await responsePromise;
      
      setUploadId(responseData.upload_id);
      setUploadSummary({
        filename: responseData.filename,
        status: responseData.status,
        // rowsProcessed and rowsSaved might not be in this initial response.
        // They usually come after /map_and_process or /validate
        templateApplied: responseData.template_applied, // Assuming backend sends this
        templateName: responseData.template_name, // Assuming backend sends this
      });

      // If backend indicates file is processed and doesn't need mapping (e.g. skip_mapping=true was effective)
      if (responseData.status === "processed" || responseData.status === "completed" ) {
         // Directly proceed to calculate if already processed (e.g. template auto-applied and valid)
        setStatusMessage("File processed, proceeding to calculations...");
        await handleCalculateBonuses(responseData.upload_id); // Pass upload_id directly
      } else if (responseData.status === "awaiting_mapping") {
        setCurrentStage('fileUploaded');
        setStatusMessage('File uploaded. Ready for column mapping.');
      } else {
        // Handle other statuses if necessary
        setCurrentStage('error');
        setGeneralError(`File uploaded with unhandled status: ${responseData.status}`);
      }
      
    } catch (error) {
      setCurrentStage('error');
      const specificMessage = error instanceof Error ? error.message : 'An unknown error occurred during file upload.';
      setGeneralError(`Initial file upload failed: ${specificMessage}`);
      setStatusMessage('File upload failed. Please try again.');
    }
  }

  const handleProceedToMapping = () => {
    if (uploadId) {
      setCurrentStage('mapping');
      setStatusMessage('Loading column mapper...');
      setGeneralError(null);
    } else {
      setGeneralError("Upload ID is not available. Cannot proceed to mapping.");
      setCurrentStage('error');
    }
  };

  const handleMappingSubmission = async (mappingResult: MappingResult) => {
    if (!uploadId) {
      setGeneralError("Upload ID is missing. Cannot process mapping.");
      setCurrentStage('error');
      return;
    }

    setCurrentStage('processingMapping');
    setStatusMessage('Processing mapped data...');
    setGeneralError(null);

    try {
      const response = await fetch(`/api/batch/uploads/${uploadId}/map_and_process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_mappings: mappingResult.columnMappings,
          default_values: mappingResult.defaultValues,
        }),
      });

      let responseData: MapAndProcessResponse;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, use the statusText or a generic error
        throw new Error(response.statusText || `Failed to process mapped data (status ${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(responseData.detail || `Failed to process mapped data (status ${response.status}).`);
      }
      
      setUploadSummary(prev => ({
        ...prev,
        rowsProcessed: responseData.rows_processed,
        rowsSaved: responseData.rows_saved,
      }));
      setStatusMessage('Data processing complete. Calculating bonuses...');
      
      // Now call the calculation endpoint
      await handleCalculateBonuses(uploadId);

    } catch (error) {
      setCurrentStage('error');
      const specificMessage = error instanceof Error ? error.message : 'An unknown error occurred while processing mapped data.';
      setGeneralError(`Error processing column mapping: ${specificMessage}`);
      setStatusMessage('Error processing mapped data. Please review mappings or file and try again.');
    }
  };

  const handleCalculateBonuses = async (currentUploadId: number) => {
    setCurrentStage('calculatingBonuses');
    setStatusMessage('Calculating bonuses...');
    setGeneralError(null);

    try {
      const calcResponse = await fetch(`/api/batch/uploads/${currentUploadId}/calculate_and_retrieve_results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No body needed for this request as per backend implementation
      });

      let calcResponseData: CalculationData;
      try {
        calcResponseData = await calcResponse.json();
      } catch (jsonError) {
        throw new Error(calcResponse.statusText || `Failed to calculate bonuses (status ${calcResponse.status}). Invalid server response.`);
      }

      if (!calcResponse.ok) {
        throw new Error(calcResponseData.detail || `Failed to calculate bonuses (status ${calcResponse.status}).`);
      }

      console.log('Calculation Data Received:', calcResponseData); // Keep for debugging
      setCalculationData(calcResponseData); // Storing it for potential display

      // ---- START: New logic to fetch EmployeeData and prepare for sessionStorage ----
      setCurrentStage('fetchingEmployeeDetails');
      setStatusMessage('Fetching employee details for playground...');

      try {
        const empDataResponse = await fetch(`/api/batch/uploads/${currentUploadId}/employees`);
        let employeesList: BackendEmployeeData[];

        if (!empDataResponse.ok) {
          let errorDetail = `Failed to fetch employee data (status ${empDataResponse.status}).`;
          try {
            const errorData = await empDataResponse.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) { /* Ignore if error response is not JSON */ }
          throw new Error(errorDetail);
        }
        
        try {
          employeesList = await empDataResponse.json();
        } catch (jsonError) {
          throw new Error(`Failed to parse employee data. Invalid server response.`);
        }
        
        const employeeDataMap = new Map<number, BackendEmployeeData>();
        employeesList.forEach(emp => employeeDataMap.set(emp.id, emp));

        const playgroundEmployeeResults: PlaygroundEmployeeData[] = calcResponseData.employee_results.map(calcResultItem => {
          const empData = employeeDataMap.get(calcResultItem.employee_data_id);
          if (!empData) {
            console.warn(`EmployeeData not found for id: ${calcResultItem.employee_data_id}. Skipping this result for playground.`);
            return null; // Or handle more gracefully
          }

          const ratio = empData.base_salary > 0 ? (calcResultItem.final_bonus / empData.base_salary) * 100 : 0;
          let performance = "Meets"; // Default
          if (calcResultItem.weighted_performance > 1.0) performance = "Exceeds";
          else if (calcResultItem.weighted_performance < 1.0) performance = "Below";
          
          return {
            id: empData.employee_id || `emp-${empData.id}`,
            name: empData.name,
            team: empData.team,
            salary: empData.base_salary,
            bonus: calcResultItem.final_bonus,
            ratio: parseFloat(ratio.toFixed(2)),
            performance: performance,
            target_bonus_pct: empData.target_bonus_pct,
            investment_weight: empData.investment_weight,
            qualitative_weight: empData.qualitative_weight,
            investment_score_multiplier: empData.investment_score_multiplier,
            qual_score_multiplier: empData.qual_score_multiplier,
            raf: empData.raf,
            is_mrt: empData.is_mrt,
            mrt_cap_pct: empData.mrt_cap_pct,
          };
        }).filter(item => item !== null) as PlaygroundEmployeeData[];


        const dataForPlayground: PlaygroundData = {
          employee_results: playgroundEmployeeResults,
          parameters: {
            bonusPool: calcResponseData.total_bonus_pool,
            capPercent: 200, // Default capPercent
          },
        };

        sessionStorage.setItem('batchResults', JSON.stringify(dataForPlayground));
        console.log('Data stored in sessionStorage for playground:', dataForPlayground);

        setCurrentStage('calculationCompleteAndStored');
        setStatusMessage('Bonus calculation complete! Data prepared for Scenario Playground.');

      } catch (empError) {
        setCurrentStage('error');
        setGeneralError(empError instanceof Error ? empError.message : 'An unknown error occurred while preparing data for playground.');
        setStatusMessage('Error preparing data for playground.');
      }
      // ---- END: New logic ----

    } catch (error) {
      setCurrentStage('error');
      const specificMessage = error instanceof Error ? error.message : 'An unknown error occurred during bonus calculation.';
      setGeneralError(`Bonus calculation failed: ${specificMessage}`);
      setStatusMessage('Error during bonus calculation. Please check data or try again.');
    }
  };


  const handleDownloadTemplate = (format: 'csv' | 'excel') => {
    window.location.href = `/api/batch/uploads/template/${format}`
  }

  // UI Rendering Logic
  const renderContent = () => {
    switch (currentStage) {
      case 'initial':
      case 'fileSelected':
      case 'uploadingFile':
        return (
          <>
            <FileUpload 
              onFileSelect={handleFileSelect}
              acceptedFileTypes=".csv,.xlsx,.xls"
              maxSizeMB={10}
              disabled={currentStage === 'uploadingFile'}
            />
            <TemplateManager 
              onSelectTemplate={setSelectedTemplateId}
              selectedTemplateId={selectedTemplateId}
              disabled={currentStage === 'uploadingFile'}
            />
            {selectedTemplateId && (
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-md">
                Template selected. This may pre-fill mappings or allow skipping the mapping step if applicable.
              </div>
            )}
            {file && currentStage !== 'initial' && (
              <button
                className={`mt-6 px-4 py-2 rounded-md font-medium ${
                  currentStage === 'uploadingFile'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
                onClick={handleInitialUpload}
                disabled={currentStage === 'uploadingFile' || !file}
              >
                {currentStage === 'uploadingFile' ? `Uploading (${uploadProgress}%)` : 'Upload File'}
              </button>
            )}
          </>
        );
      
      case 'fileUploaded':
        return (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md">
            File <strong>{uploadSummary?.filename}</strong> uploaded successfully (ID: {uploadId}). Status: {uploadSummary?.status}.
            <button
              className="mt-4 ml-2 px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-300 rounded-md hover:bg-green-300 dark:hover:bg-green-700 transition-colors"
              onClick={handleProceedToMapping}
            >
              Continue to Column Mapping
            </button>
          </div>
        );

      case 'mapping':
        if (!uploadId) {
          setCurrentStage('error');
          setGeneralError('Upload ID missing, cannot show mapper.');
          return null;
        }
        return (
          <ColumnMapper 
            uploadId={uploadId} 
            onMappingComplete={handleMappingSubmission}
            templateId={selectedTemplateId} 
          />
        );

      case 'processingMapping':
      case 'calculatingBonuses':
      case 'fetchingEmployeeDetails': // Added case for new loading state
        return (
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-md">
            {statusMessage || "Processing..."}
          </div>
        );

      case 'calculationComplete': // This stage might be very brief or skipped if data prep is fast
      case 'calculationCompleteAndStored':
        return (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md">
            {statusMessage || "Process complete!"}
            {calculationData && (
              <div className="mt-2 text-sm">
                <p><strong>Calculation Summary:</strong></p>
                <p>Total Bonus Pool: {calculationData.total_bonus_pool.toLocaleString()}</p>
                <p>Average Bonus: {calculationData.average_bonus.toLocaleString()}</p>
                <p>Employees Calculated: {calculationData.total_employees}</p>
                <p>Capped Employees: {calculationData.capped_employees}</p>
              </div>
            )}
            {currentStage === 'calculationCompleteAndStored' && (
              <button
                onClick={() => window.location.href = '/scenario-playground'} // Or use React Router Link
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
              >
                Go to Scenario Playground
              </button>
            )}
          </div>
        );
      
      case 'error':
        // Error message is shown via generalError state below
        return null; 

      default:
        return <p>Unknown stage.</p>;
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Batch Data Upload & Calculation
      </h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {currentStage === 'initial' || currentStage === 'fileSelected' || currentStage === 'uploadingFile' 
            ? 'Step 1: Upload Employee Data File'
            : currentStage === 'mapping' 
            ? 'Step 2: Column Mapping'
            : currentStage === 'fileUploaded'
            ? 'Step 1: File Uploaded'
            : 'Processing Data'}
        </h2>
        
        {renderContent()}

        {statusMessage && currentStage !== 'error' && (
           <div className={`mt-4 p-2 text-sm rounded-md ${
            currentStage === 'uploadingFile' || 
            currentStage === 'processingMapping' || 
            currentStage === 'calculatingBonuses' ||
            currentStage === 'fetchingEmployeeDetails'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : currentStage === 'calculationCompleteAndStored' || currentStage === 'fileUploaded'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {statusMessage}
          </div>
        )}
        
        {generalError && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Error: {generalError}</span>
            </div>
          </div>
        )}
      </div>
            
      {/* Static content like templates and field lists can remain here */}
      {(currentStage === 'initial' || currentStage === 'fileSelected') && (
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Supported File Formats & Required Fields
          </h3>
          {/* ... (rest of the static help text) ... */}
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
            <li>CSV (Comma Separated Values), Excel (.xlsx, .xls)</li>
          </ul>
          <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">
            Required Fields (example)
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
            <li>employee_id, name, team, base_salary, target_bonus_pct, etc.</li>
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
      )}
    </div>
  )
}

export default BatchUploadContainer
