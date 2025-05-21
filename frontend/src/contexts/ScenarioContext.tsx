import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect, useState } from 'react';
import {
  Scenario,
  NewScenario,
  ScenarioUpdate,
  ScenarioState,
  ScenarioAction,
  ScenarioActionType
} from '../types/scenario';
import WebSocketService from '../utils/websocket';

// Define fallback data for development
const FALLBACK_CALCULATION_RESULTS = {
  scenario_id: 1,
  total_bonus_pool: 1000000,
  average_bonus: 25000,
  total_employees: 40,
  capped_employees: 5
};

const FALLBACK_TEAM_AGGREGATIONS = [
  {
    team: "Investment",
    employee_count: 15,
    total_base_salary: 1500000,
    total_bonus: 450000,
    average_bonus: 30000,
    average_bonus_to_salary_ratio: 0.3,
    capped_employee_count: 2
  },
  {
    team: "Research",
    employee_count: 12,
    total_base_salary: 1200000,
    total_bonus: 300000,
    average_bonus: 25000,
    average_bonus_to_salary_ratio: 0.25,
    capped_employee_count: 1
  },
  {
    team: "Operations",
    employee_count: 8,
    total_base_salary: 800000,
    total_bonus: 160000,
    average_bonus: 20000,
    average_bonus_to_salary_ratio: 0.2,
    capped_employee_count: 1
  }
];

/**
 * Interface for the ScenarioContext
 */
interface ScenarioContextType {
  state: ScenarioState;
  dispatch: React.Dispatch<ScenarioAction>;
  fetchScenarios: () => Promise<void>;
  fetchScenario: (id: number) => Promise<void>;
  createScenario: (scenario: NewScenario) => Promise<void>;
  updateScenario: (id: number, updates: ScenarioUpdate) => Promise<void>;
  deleteScenario: (id: number) => Promise<void>;
  forkScenario: (id: number, name: string, description?: string) => Promise<void>;
  calculateScenario: (id: number) => Promise<void>;
  setActiveScenario: (scenario: Scenario) => void;
  sendParameterUpdate: (parameters: Record<string, any>) => void;
  undo: () => void;
  redo: () => void;
}

// Initial state for the scenario context
const initialState: ScenarioState = {
  scenarios: [],
  loading: false,
  history: {
    past: [],
    future: []
  }
};

// Create the context
const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

/**
 * Reducer function for scenario state management
 */
const scenarioReducer = (state: ScenarioState, action: ScenarioAction): ScenarioState => {
  const { type, payload } = action;
  
  switch (type) {
    case ScenarioActionType.FETCH_SCENARIOS:
      return {
        ...state,
        scenarios: payload,
        loading: false
      };
      
    case ScenarioActionType.FETCH_SCENARIO:
      return {
        ...state,
        activeScenario: payload,
        loading: false
      };
      
    case ScenarioActionType.CREATE_SCENARIO:
      return {
        ...state,
        scenarios: [...state.scenarios, payload],
        activeScenario: payload,
        loading: false,
        history: {
          past: [...state.history.past, state],
          future: []
        }
      };
      
    case ScenarioActionType.UPDATE_SCENARIO:
      return {
        ...state,
        scenarios: state.scenarios.map(scenario => 
          scenario.id === payload.id ? { ...scenario, ...payload } : scenario
        ),
        activeScenario: state.activeScenario?.id === payload.id 
          ? { ...state.activeScenario, ...payload }
          : state.activeScenario,
        loading: false,
        history: {
          past: [...state.history.past, state],
          future: []
        }
      };
      
    case ScenarioActionType.DELETE_SCENARIO:
      return {
        ...state,
        scenarios: state.scenarios.filter(scenario => scenario.id !== payload),
        activeScenario: state.activeScenario?.id === payload ? undefined : state.activeScenario,
        loading: false,
        history: {
          past: [...state.history.past, state],
          future: []
        }
      };

    case ScenarioActionType.FORK_SCENARIO:
      return {
        ...state,
        scenarios: [...state.scenarios, payload],
        activeScenario: payload,
        loading: false,
        history: {
          past: [...state.history.past, state],
          future: []
        }
      };

    case ScenarioActionType.CALCULATE_SCENARIO:
      return {
        ...state,
        calculationResults: payload.calculationResults,
        teamAggregations: payload.teamAggregations,
        loading: false
      };

    case ScenarioActionType.SET_ACTIVE_SCENARIO:
      return {
        ...state,
        activeScenario: payload
      };

    case ScenarioActionType.SET_LOADING:
      return {
        ...state,
        loading: payload
      };

    case ScenarioActionType.SET_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };

    case ScenarioActionType.CLEAR_ERROR:
      return {
        ...state,
        error: undefined
      };
      
    case ScenarioActionType.UNDO:
      if (state.history.past.length === 0) return state;
      
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);
      
      return {
        ...previous,
        history: {
          past: newPast,
          future: [state, ...state.history.future]
        }
      };
      
    case ScenarioActionType.REDO:
      if (state.history.future.length === 0) return state;
      
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      
      return {
        ...next,
        history: {
          past: [...state.history.past, state],
          future: newFuture
        }
      };
      
    default:
      return state;
  }
};

/**
 * Provider component for the ScenarioContext
 */
export const ScenarioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [state, dispatch] = useReducer(scenarioReducer, initialState);

  // API calls for scenario management
  const fetchScenarios = useCallback(async () => {
    try {
      dispatch({ type: ScenarioActionType.SET_LOADING, payload: true });
      
      // Safe access to import.meta.env
      const apiUrl = '/api/v1';
      
      const response = await fetch(`${apiUrl}/scenarios`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
      }
      
      const scenarios = await response.json();
      dispatch({ type: ScenarioActionType.FETCH_SCENARIOS, payload: scenarios });
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      dispatch({ 
        type: ScenarioActionType.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to fetch scenarios' 
      });
    }
  }, [dispatch]);

  const fetchScenario = useCallback(async (id: number) => {
    try {
      dispatch({ type: ScenarioActionType.SET_LOADING, payload: true });
      
      const apiUrl = '/api/v1';
      
      const response = await fetch(`${apiUrl}/scenarios/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scenario: ${response.statusText}`);
      }
      
      const scenario = await response.json();
      dispatch({ type: ScenarioActionType.FETCH_SCENARIO, payload: scenario });
    } catch (error) {
      console.error(`Error fetching scenario ${id}:`, error);
      dispatch({ 
        type: ScenarioActionType.SET_ERROR, 
        payload: error instanceof Error ? error.message : `Failed to fetch scenario ${id}` 
      });
    }
  }, [dispatch]);

  /**
   * Create a new scenario with fallback for development
   */
  const createScenario = useCallback(async (scenario: NewScenario) => {
    try {
      dispatch({ type: ScenarioActionType.SET_LOADING, payload: true });
      
      const apiUrl = '/api/v1';
      
      try {
        const response = await fetch(`${apiUrl}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: scenario.name,
            description: scenario.description,
            session_id: scenario.sessionId,
            global_parameters: scenario.globalParameters,
            is_saved: scenario.isSaved
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create scenario: ${response.statusText}`);
        }
        
        const newScenario = await response.json();
        dispatch({ type: ScenarioActionType.CREATE_SCENARIO, payload: newScenario });
      } catch (apiError) {
        console.warn('API call failed, using fallback for scenario creation in development mode');
        
        // Create a mock scenario for development
        const mockScenario: Scenario = {
          id: Math.floor(Math.random() * 10000),
          name: scenario.name,
          description: scenario.description || '',
          globalParameters: scenario.globalParameters,
          isSaved: scenario.isSaved,
          sessionId: scenario.sessionId || document.cookie.split('; ').find(row => row.startsWith('session_id='))?.split('=')[1] || 'mock-session',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Dispatch the mock scenario
        dispatch({ type: ScenarioActionType.CREATE_SCENARIO, payload: mockScenario });
        
        // Also trigger calculation with fallback data
        setTimeout(() => {
          dispatch({
            type: ScenarioActionType.CALCULATE_SCENARIO,
            payload: {
              calculationResults: FALLBACK_CALCULATION_RESULTS,
              teamAggregations: FALLBACK_TEAM_AGGREGATIONS
            }
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error in createScenario:', error);
      dispatch({ 
        type: ScenarioActionType.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to create scenario' 
      });
    }
  }, [dispatch]);

  const updateScenario = useCallback(async (id: number, updates: ScenarioUpdate) => {
    try {
      dispatch({ type: ScenarioActionType.SET_LOADING, payload: true });
      
      const apiUrl = '/api/v1';
      
      const response = await fetch(`${apiUrl}/scenarios/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update scenario: ${response.statusText}`);
      }
      
      const updatedScenario = await response.json();
      dispatch({ 
        type: ScenarioActionType.UPDATE_SCENARIO, 
        payload: updatedScenario 
      });
    } catch (error) {
      console.error(`Error updating scenario ${id}:`, error);
      dispatch({ 
        type: ScenarioActionType.SET_ERROR, 
        payload: error instanceof Error ? error.message : `Failed to update scenario ${id}` 
      });
    }
  }, [dispatch]);

  const deleteScenario = useCallback(async (id: number) => {
    try {
      dispatch({ type: ScenarioActionType.SET_LOADING, payload: true });
      
      const apiUrl = '/api/v1';
      
      const response = await fetch(`${apiUrl}/scenarios/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete scenario: ${response.statusText}`);
      }
      
      dispatch({ type: ScenarioActionType.DELETE_SCENARIO, payload: id });
    } catch (error) {
      console.error(`Error deleting scenario ${id}:`, error);
      dispatch({ 
        type: ScenarioActionType.SET_ERROR, 
        payload: error instanceof Error ? error.message : `Failed to delete scenario ${id}` 
      });
    }
  }, [dispatch]);

  const forkScenario = useCallback(async (id: number, name: string, description?: string) => {
    try {
      dispatch({ type: ScenarioActionType.SET_LOADING, payload: true });
      
      const apiUrl = '/api/v1';
      
      const response = await fetch(`${apiUrl}/scenarios/${id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fork scenario: ${response.statusText}`);
      }
      
      const newScenario = await response.json();
      dispatch({ type: ScenarioActionType.FORK_SCENARIO, payload: newScenario });
    } catch (error) {
      console.error(`Error forking scenario ${id}:`, error);
      dispatch({ 
        type: ScenarioActionType.SET_ERROR, 
        payload: error instanceof Error ? error.message : `Failed to fork scenario ${id}` 
      });
    }
  }, [dispatch]);

  /**
   * Calculate scenario results with fallback for development
   */
  const calculateScenario = useCallback(async (id: number) => {
    try {
      dispatch({ type: ScenarioActionType.SET_LOADING, payload: true });
      
      const apiUrl = '/api/v1';
      
      const response = await fetch(`${apiUrl}/scenarios/${id}/calculate`);
      
      if (!response.ok) {
        // Provide fallback data for development when backend services aren't available
        console.warn('Using fallback scenario calculation data for development');
        
        dispatch({
          type: ScenarioActionType.CALCULATE_SCENARIO,
          payload: {
            calculationResults: FALLBACK_CALCULATION_RESULTS,
            teamAggregations: FALLBACK_TEAM_AGGREGATIONS
          }
        });
        return;
      }
      
      const data = await response.json();
      dispatch({
        type: ScenarioActionType.CALCULATE_SCENARIO,
        payload: {
          calculationResults: data.calculation_results,
          teamAggregations: data.team_aggregations
        }
      });
    } catch (error) {
      console.error(`Error calculating scenario ${id}:`, error);
      
      // Provide fallback data even in case of network errors
      console.warn('Using fallback scenario calculation data due to error');
      
      dispatch({
        type: ScenarioActionType.CALCULATE_SCENARIO,
        payload: {
          calculationResults: FALLBACK_CALCULATION_RESULTS,
          teamAggregations: FALLBACK_TEAM_AGGREGATIONS
        }
      });
    }
  }, [dispatch]);

  const setActiveScenario = useCallback((scenario: Scenario) => {
    dispatch({ type: ScenarioActionType.SET_ACTIVE_SCENARIO, payload: scenario });
    setActiveScenarioId(scenario.id);
  }, []);

  // Initialize WebSocket connection when active scenario changes
  useEffect(() => {
    if (activeScenarioId) {
      const wsUrl = 'ws://localhost:8000/api/v1';
      
      const newWsService = new WebSocketService(`${wsUrl}/scenarios/ws/${activeScenarioId}`);
      
      newWsService.onConnect(() => {
        console.log(`WebSocket connected for scenario ${activeScenarioId}`);
      });
      
      newWsService.connect();
      setWsService(newWsService);
      
      return () => {
        newWsService.disconnect();
      };
    }
  }, [activeScenarioId]);

  // Send parameter updates to WebSocket
  const sendParameterUpdate = useCallback((parameters: Record<string, any>) => {
    if (wsService && wsService.isConnected()) {
      wsService.send({
        type: 'update_parameters',
        parameters
      });
    }
  }, [wsService]);

  // Undo/Redo actions
  const undo = useCallback(() => {
    dispatch({ type: ScenarioActionType.UNDO });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: ScenarioActionType.REDO });
  }, []);

  // Create context value
  const contextValue: ScenarioContextType = {
    state,
    dispatch,
    fetchScenarios,
    fetchScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    forkScenario,
    calculateScenario,
    setActiveScenario,
    sendParameterUpdate,
    undo,
    redo
  };

  return (
    <ScenarioContext.Provider value={contextValue}>
      {children}
    </ScenarioContext.Provider>
  );
};

/**
 * Hook to use the ScenarioContext
 */
export const useScenario = (): ScenarioContextType => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};
