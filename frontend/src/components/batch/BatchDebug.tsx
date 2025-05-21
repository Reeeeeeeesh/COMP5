import React, { useState, useEffect } from 'react';

interface BatchDebugProps {
  uploadId: number | null;
}

const BatchDebug: React.FC<BatchDebugProps> = ({ uploadId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!uploadId) {
        setError('No upload ID provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch upload details
        const uploadResponse = await fetch(`/api/v1/batch/uploads/${uploadId}`);
        if (!uploadResponse.ok) {
          throw new Error(`Failed to fetch upload details: ${uploadResponse.statusText}`);
        }
        const uploadData = await uploadResponse.json();

        // Fetch employee data
        const employeeResponse = await fetch(`/api/v1/batch/uploads/${uploadId}/employees`);
        if (!employeeResponse.ok) {
          throw new Error(`Failed to fetch employee data: ${employeeResponse.statusText}`);
        }
        const employeeData = await employeeResponse.json();

        setData({
          upload: uploadData,
          employees: employeeData
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uploadId]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Batch Upload Debug</h2>
      
      <div className="mb-4">
        <p className="font-medium">Upload ID: {uploadId || 'None'}</p>
      </div>
      
      {loading && (
        <div className="p-4 bg-blue-100 text-blue-800 rounded-md mb-4">
          Loading data...
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-md mb-4">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {data && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Upload Details</h3>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-60">
              {JSON.stringify(data.upload, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Employee Data ({data.employees?.length || 0} records)</h3>
            {data.employees && data.employees.length > 0 ? (
              <div className="overflow-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {Object.keys(data.employees[0]).map(key => (
                        <th 
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {data.employees.map((employee: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                        {Object.values(employee).map((value: any, valueIndex: number) => (
                          <td 
                            key={valueIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                          >
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No employee data available</p>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <button
          onClick={() => window.location.href = '/batch'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Batch Upload
        </button>
      </div>
    </div>
  );
};

export default BatchDebug;
