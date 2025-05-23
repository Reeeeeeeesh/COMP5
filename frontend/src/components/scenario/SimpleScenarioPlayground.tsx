import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../ui';

// Helper function to generate mock employee data
const generateMockEmployeeData = () => {
  const teams = ['Emerging Markets', 'Fixed Income', 'Equity', 'Multi-Asset', 'Quant'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const baseSalary = 80000 + Math.floor(Math.random() * 120000);
    const targetBonusPct = 10 + Math.floor(Math.random() * 30);
    const targetBonus = baseSalary * (targetBonusPct / 100);
    const bonusMultiplier = 0.8 + Math.random() * 0.4;
    
    return {
      id: `EMP${String(i + 1).padStart(3, '0')}`,
      name: `Person_${i + 1}`,
      team: teams[i % teams.length],
      salary: baseSalary,
      bonus: targetBonus * bonusMultiplier,
      ratio: bonusMultiplier * 100,
      performance: ['Exceeds', 'Meets', 'Outstanding'][Math.floor(Math.random() * 3)]
    };
  });
};

// Helper function to generate team summary from employee data
const generateTeamSummary = (employees: any[]) => {
  const teamMap = new Map();
  
  employees.forEach(emp => {
    if (!teamMap.has(emp.team)) {
      teamMap.set(emp.team, {
        name: emp.team,
        employeeCount: 0,
        totalSalary: 0,
        totalBonus: 0,
        avgBonus: 0,
        ratio: 0
      });
    }
    
    const teamData = teamMap.get(emp.team);
    teamData.employeeCount += 1;
    teamData.totalSalary += emp.salary;
    teamData.totalBonus += emp.bonus;
    teamMap.set(emp.team, teamData);
  });
  
  // Calculate averages and ratios
  teamMap.forEach(team => {
    team.avgBonus = team.totalBonus / team.employeeCount;
    team.ratio = (team.totalBonus / team.totalSalary) * 100;
  });
  
  return Array.from(teamMap.values());
};

/**
 * A simplified Scenario Playground component that works without backend dependencies
 * and integrates with batch upload data
 */
const SimpleScenarioPlayground: React.FC = () => {
  const navigate = useNavigate();
  
  // State for the active scenario
  const [activeScenario, setActiveScenario] = useState<any | null>(null);
  
  // State for parameters
  const [bonusPool, setBonusPool] = useState(1000000);
  const [capPercent, setCapPercent] = useState(200);
  const [mrtEnabled, setMrtEnabled] = useState(true);
  
  // State for employee and team data
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [hasBatchData, setHasBatchData] = useState(false);
  
  // Load batch data from session storage if available
  useEffect(() => {
    const loadBatchData = () => {
      // Check if we have batch results in session storage
      const batchResultsJson = sessionStorage.getItem('batchResults');
      
      if (batchResultsJson) {
        try {
          const batchResults = JSON.parse(batchResultsJson);
          
          if (batchResults && batchResults.employee_results) {
            // Transform batch data to the format expected by the scenario playground
            const transformedEmployees = batchResults.employee_results.map((emp: any) => ({
              id: emp.id, // Use emp.id (string employee_id from PlaygroundEmployeeData)
              name: emp.name,
              team: emp.team,
              salary: emp.salary, // Use emp.salary
              bonus: emp.bonus, // Use emp.bonus
              ratio: emp.ratio, // Use emp.ratio (already calculated percentage)
              performance: emp.performance // Use pre-calculated emp.performance string
            }));
            
            setEmployees(transformedEmployees);
            setTeams(generateTeamSummary(transformedEmployees));
            setHasBatchData(true);
            
            // Set parameters from batch processing
            if (batchResults.parameters) {
              setBonusPool(batchResults.parameters.bonusPool ?? 1000000); // Use ?? for nullish coalescing
              setCapPercent(batchResults.parameters.capPercent ?? 200);
            } else {
              // Fallback if parameters object itself is missing
              setBonusPool(1000000);
              setCapPercent(200);
            }
            
            return true;
          }
        } catch (error) {
          console.error('Error parsing "batchResults" from sessionStorage:', error);
        }
      }
      
      return false;
    };
    
    // Try to load batch data, fall back to mock data if not available
    const batchDataLoaded = loadBatchData();
    
    if (!batchDataLoaded) {
      // Generate mock data if no batch data is available
      const mockEmployeeData = generateMockEmployeeData();
      setEmployees(mockEmployeeData);
      setTeams(generateTeamSummary(mockEmployeeData));
    }
  }, []);
  
  // Create a new scenario
  const handleCreateScenario = () => {
    // Calculate total salary for all employees to set a reasonable bonus pool
    const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
    const defaultBonusPool = Math.round(totalSalary * 0.2); // 20% of total salary as default
    
    setActiveScenario({
      id: Math.floor(Math.random() * 10000),
      name: `New Scenario ${new Date().toLocaleTimeString()}`,
      description: hasBatchData ? 'Created from Batch Upload Data' : 'Created from Scenario Playground',
      parameters: {
        bonusPool: hasBatchData ? bonusPool : defaultBonusPool,
        capPercent,
        mrtEnabled
      }
    });
    
    // If we just created a scenario, update the bonus pool to a reasonable default
    if (!hasBatchData) {
      setBonusPool(defaultBonusPool);
    }
  };
  
  // Update parameters
  const handleParameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    if (name === 'bonusPool') {
      setBonusPool(Number(value));
    } else if (name === 'capPercent') {
      setCapPercent(Number(value));
    } else if (name === 'mrtEnabled') {
      setMrtEnabled(checked);
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        Scenario Playground
      </h2>
      
      {/* Version toolbar */}
      <Card className="mb-6">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={!activeScenario}
            >
              {activeScenario ? activeScenario.name : "Select Scenario"}
            </Button>
            
            <Button
              variant="primary"
              onClick={handleCreateScenario}
            >
              New Scenario
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={!activeScenario}
            >
              Fork
            </Button>
            
            <Button
              variant="secondary"
              disabled={!activeScenario}
            >
              Save
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Parameter configuration */}
        <div className="md:col-span-4">
          <Card className="h-full">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Scenario Parameters
              </h3>
              
              {activeScenario ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bonus Pool
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                      <input
                        type="number"
                        name="bonusPool"
                        value={bonusPool}
                        onChange={handleParameterChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cap Percent
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="capPercent"
                        value={capPercent}
                        onChange={handleParameterChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-gray-500 dark:text-gray-400 ml-2">%</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Maximum bonus as a percentage of target
                    </p>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        name="mrtEnabled"
                        checked={mrtEnabled}
                        onChange={handleParameterChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Enable MRT rules</span>
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-6">
                      Apply Material Risk Taker bonus caps
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No scenario selected.</p>
                  <Button 
                    variant="primary" 
                    onClick={handleCreateScenario} 
                    className="mt-4"
                  >
                    Create New Scenario
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Visualization */}
        <div className="md:col-span-8">
          <Card className="h-full">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Results Visualization
              </h3>
              
              {activeScenario ? (
                <div>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Total Bonus
                      </h4>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        ${activeScenario ? bonusPool.toLocaleString() : 
                          (employees.length > 0 ? 
                            Math.round(employees.reduce((sum, emp) => sum + emp.bonus, 0)).toLocaleString() : 
                            bonusPool.toLocaleString())}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Average Bonus/Salary
                      </h4>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {employees.length > 0 ? 
                          (employees.reduce((sum, emp) => sum + emp.ratio, 0) / employees.length).toFixed(1) + '%' : 
                          '0.0%'}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Employee Count
                      </h4>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {employees.length}
                      </p>
                    </div>
                  </div>
                  
                  {/* Team Summary */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Team Summary
                    </h4>
                    
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
                              Total Salary
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
                          {teams.map((team: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                {team.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {team.employeeCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                ${Math.round(team.totalSalary).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                ${Math.round(team.totalBonus).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                ${Math.round(team.avgBonus).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Employee Details */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Employee Details
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Team
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Salary
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Bonus
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Bonus/Salary
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {employees.slice(0, 10).map((employee: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                {employee.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {employee.team}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                ${Math.round(employee.salary).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                ${Math.round(employee.bonus).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  employee.ratio >= 20 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {employee.ratio.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {employees.length > 10 && (
                        <div className="mt-2 text-right text-sm text-gray-500 dark:text-gray-400">
                          Showing 10 of {employees.length} employees
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Select or create a scenario to view results.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Development Notice */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
        <div className="flex justify-between items-center">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            <strong>Development Mode:</strong> This is a simplified version for development. 
            In production, this would connect to backend services for actual data processing.
          </p>
          
          <Button
            variant="secondary"
            onClick={() => navigate('/batch')}
            className="ml-4"
          >
            {hasBatchData ? 'Update Batch Data' : 'Upload Batch Data'}
          </Button>
        </div>
        
        {hasBatchData && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ✓ Using data from batch upload
          </p>
        )}
      </div>
    </div>
  );
};

export default SimpleScenarioPlayground;
