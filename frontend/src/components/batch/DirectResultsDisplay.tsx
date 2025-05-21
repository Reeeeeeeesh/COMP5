import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data generator for employee results
const generateMockEmployeeResults = () => {
  const teams = ['Emerging Markets', 'Fixed Income', 'Equity', 'Multi-Asset', 'Quant'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const baseSalary = 80000 + Math.floor(Math.random() * 120000);
    const targetBonusPct = 10 + Math.floor(Math.random() * 30);
    const targetBonus = baseSalary * (targetBonusPct / 100);
    const bonusMultiplier = 0.8 + Math.random() * 0.4;
    
    return {
      employee_id: `EMP${String(i + 1).padStart(3, '0')}`,
      name: `Person_${i + 1}`,
      team: teams[i % teams.length],
      base_salary: baseSalary,
      target_bonus_pct: targetBonusPct,
      target_bonus: targetBonus,
      calculated_bonus: targetBonus * bonusMultiplier,
      bonus_percent: Math.round(bonusMultiplier * 100),
      investment_score: 0.9 + Math.random() * 0.3,
      qualitative_score: 0.9 + Math.random() * 0.3,
      raf: 0.9 + Math.random() * 0.2
    };
  });
};

// Mock data generator for team summary
const generateTeamSummary = (employees: any[]) => {
  const teamMap = new Map();
  
  employees.forEach(emp => {
    if (!teamMap.has(emp.team)) {
      teamMap.set(emp.team, {
        count: 0,
        total_bonus: 0
      });
    }
    
    const teamData = teamMap.get(emp.team);
    teamData.count += 1;
    teamData.total_bonus += emp.calculated_bonus;
    teamMap.set(emp.team, teamData);
  });
  
  return Object.fromEntries(teamMap);
};

/**
 * A simplified results display component that works without backend dependencies
 */
const DirectResultsDisplay: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any | null>(null);
  
  useEffect(() => {
    const loadResults = async () => {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get parameters from session storage
      const parametersJson = sessionStorage.getItem('batchParameters');
      const parameters = parametersJson ? JSON.parse(parametersJson) : {
        bonusPool: 1000000,
        capPercent: 200
      };
      
      // Generate mock employee results
      const employeeResults = generateMockEmployeeResults();
      
      // Generate team summary
      const teamSummary = generateTeamSummary(employeeResults);
      
      // Create mock results object
      const mockResults = {
        id: sessionStorage.getItem('batchResultId') || Math.floor(Math.random() * 10000).toString(),
        upload_id: sessionStorage.getItem('lastUploadId') || Math.floor(Math.random() * 10000).toString(),
        scenario_id: Math.floor(Math.random() * 100),
        status: 'completed',
        created_at: new Date(Date.now() - 60000).toISOString(),
        completed_at: new Date().toISOString(),
        parameters: parameters,
        stats: {
          total: employeeResults.length,
          success: employeeResults.length,
          error: 0,
          teams: teamSummary
        },
        employee_results: employeeResults
      };
      
      // Store the results in session storage for the Scenario Playground to use
      sessionStorage.setItem('batchResults', JSON.stringify(mockResults));
      
      setResults(mockResults);
      setLoading(false);
    };
    
    loadResults();
  }, []);
  
  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading results...</p>
        </div>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md">
          <p className="font-medium">Error loading results</p>
          <p>Unable to retrieve batch processing results.</p>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/batch')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Upload
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Batch Processing Results
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Total Employees
          </h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {results.stats.total}
          </p>
        </div>
        
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Bonus Pool
          </h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            ${results.parameters.bonusPool.toLocaleString()}
          </p>
        </div>
        
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Processing Time
          </h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {Math.floor(Math.random() * 5) + 2}s
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
          Team Summary
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employees
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Bonus
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avg Bonus
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(results.stats.teams).map(([team, data]: [string, any]) => (
                <tr key={team}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                    {team}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {data.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    ${Math.round(data.total_bonus).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    ${Math.round(data.total_bonus / data.count).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
          Employee Results
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Base Salary
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Target Bonus
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Calculated Bonus
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  % of Target
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {results.employee_results.map((employee: any) => (
                <tr key={employee.employee_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                    {employee.employee_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {employee.team}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    ${employee.base_salary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    ${Math.round(employee.target_bonus).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    ${Math.round(employee.calculated_bonus).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.bonus_percent >= 100 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {employee.bonus_percent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => navigate('/batch/parameters')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Back to Parameters
        </button>
        <button
          onClick={() => navigate('/batch')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Batch Upload
        </button>
      </div>
    </div>
  );
};

export default DirectResultsDisplay;
