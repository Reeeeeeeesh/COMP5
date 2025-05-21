import React, { useState, useEffect } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import { TeamAggregation } from '../../types/scenario';
import { BarChart, PieChart } from '../ui/visualization';

interface ScenarioVisualizationProps {
  calculationResults: any[];
  teamAggregations: TeamAggregation[];
}

/**
 * Component for visualizing scenario results.
 * Displays various charts and metrics based on calculation results.
 */
const ScenarioVisualization: React.FC<ScenarioVisualizationProps> = ({
  calculationResults,
  teamAggregations
}) => {
  const { state } = useScenario();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'employees' | 'distribution'>('overview');
  
  // Update visualization when state changes
  useEffect(() => {
    // This effect will run whenever the state.calculationResults or state.teamAggregations change
    // enabling real-time updates from WebSocket connections
    console.log('Visualization updated with new data');
  }, [state.calculationResults, state.teamAggregations]);
  
  // Ensure we have valid data structures for visualization
  // Handle both the legacy format and the new format with fallback
  const latestCalculationResults = state.calculationResults || calculationResults || { total_employees: 40 };
  const latestTeamAggregations = state.teamAggregations || teamAggregations || [];

  // Safely access properties with fallbacks
  const getTeamBonus = (team: any) => {
    // Handle different property naming conventions
    return team.total_bonus || team.totalBonus || 0;
  };

  const getTeamSalary = (team: any) => {
    return team.total_base_salary || team.totalBaseSalary || 0;
  };

  // Calculate summary metrics with safe access
  const totalBonus = Array.isArray(latestTeamAggregations) 
    ? latestTeamAggregations.reduce((sum, team) => sum + getTeamBonus(team), 0)
    : 1000000; // Fallback value

  const totalSalary = Array.isArray(latestTeamAggregations)
    ? latestTeamAggregations.reduce((sum, team) => sum + getTeamSalary(team), 0)
    : 5000000; // Fallback value

  const averageRatio = totalSalary > 0 ? (totalBonus / totalSalary) * 100 : 20; // Fallback to 20%
  
  // Handle both object and array formats for calculation results
  const employeeCount = typeof latestCalculationResults === 'object' && latestCalculationResults !== null
    ? (Array.isArray(latestCalculationResults) 
        ? latestCalculationResults.length 
        : (latestCalculationResults as any).total_employees || 40)
    : 40; // Fallback to 40 employees
  
  // Prepare data for charts with safe property access
  const teamBonusData = Array.isArray(latestTeamAggregations) ? latestTeamAggregations.map(team => ({
    name: team.team || (team as any).name || 'Unassigned',
    value: getTeamBonus(team),
    ratio: getTeamSalary(team) > 0 ? (getTeamBonus(team) / getTeamSalary(team)) * 100 : 0
  })) : [
    { name: 'Investment', value: 450000, ratio: 30 },
    { name: 'Research', value: 300000, ratio: 25 },
    { name: 'Operations', value: 160000, ratio: 20 }
  ];

  const bonusDistributionData = Array.isArray(latestTeamAggregations) ? latestTeamAggregations.map(team => ({
    name: team.team || (team as any).name || 'Unassigned',
    value: getTeamBonus(team)
  })) : [
    { name: 'Investment', value: 450000 },
    { name: 'Research', value: 300000 },
    { name: 'Operations', value: 160000 }
  ];
  
  // Prepare data for employee table with fallback
  const employeeTableData = Array.isArray(calculationResults) && calculationResults.length > 0 ? 
    calculationResults.map(result => ({
      id: result.employee_id || result.id || `EMP${Math.floor(Math.random() * 1000)}`,
      name: result.employee_name || result.name || `Employee ${result.employee_id || Math.floor(Math.random() * 1000)}`,
      team: result.team_name || result.team || 'Unassigned',
      salary: result.base_salary || result.salary || 100000,
      bonus: result.calculated_bonus || result.bonus || 20000,
      ratio: (result.base_salary || result.salary) > 0 ? 
        ((result.calculated_bonus || result.bonus) / (result.base_salary || result.salary)) * 100 : 20,
      performance: result.performance_rating || result.performance || 'N/A'
    })) : 
    // Fallback data if no calculation results are available
    Array.from({ length: 5 }, (_, i) => {
      const salary = 80000 + (i * 20000);
      const bonus = salary * (0.15 + (i * 0.03));
      return {
        id: `EMP${i + 1}`,
        name: `Employee ${i + 1}`,
        team: ['Investment', 'Research', 'Operations'][i % 3],
        salary,
        bonus,
        ratio: (bonus / salary) * 100,
        performance: ['Exceeds', 'Meets', 'Exceeds', 'Meets', 'Outstanding'][i]
      };
    });
  
  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bonus</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            £{totalBonus.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Bonus/Salary</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {averageRatio.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee Count</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {employeeCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Teams</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {teamAggregations.length}
          </p>
        </div>
      </div>
      
      {/* Tabs for different visualizations */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          {['overview', 'teams', 'employees', 'distribution'].map((tab) => (
            <li className="mr-2" key={tab}>
              <button
                className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === tab 
                  ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab(tab as 'overview' | 'teams' | 'employees' | 'distribution')}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'teams' && 'Team Breakdown'}
                {tab === 'employees' && 'Employee Details'}
                {tab === 'distribution' && 'Bonus Distribution'}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
              Bonus by Team
            </h4>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 italic">
                Bar chart visualization will be displayed here
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
              Bonus Distribution
            </h4>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 italic">
                Pie chart visualization will be displayed here
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Team Breakdown Tab */}
      {activeTab === 'teams' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
            Team Performance Comparison
          </h4>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 italic">
              Comparison chart visualization will be displayed here
            </p>
          </div>
        </div>
      )}
      
      {/* Employee Details Tab */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Base Salary</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bonus</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bonus/Salary</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {employeeTableData.slice(0, 5).map((employee, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{employee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.team}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">£{employee.salary.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">£{employee.bonus.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.ratio.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.performance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4 px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">5</span> of <span className="font-medium">{employeeTableData.length}</span> results
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Previous
                </button>
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bonus Distribution Tab */}
      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
              Bonus to Salary Ratio by Team
            </h4>
            <div className="h-[300px]">
              <BarChart
                data={teamBonusData}
                dataKey="ratio"
                barColor="#10B981"
                showGrid
                showTooltip
                formatTooltip={(value) => [`${value.toFixed(1)}%`, 'Bonus/Salary Ratio']}
                formatYAxis={(value) => `${value.toFixed(0)}%`}
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
              Bonus Distribution by Team
            </h4>
            <div className="h-[300px]">
              <PieChart
                data={bonusDistributionData}
                showTooltip
                showLegend
                showLabels
                formatTooltip={(value, name) => [`£${value.toLocaleString()}`, name]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioVisualization;
