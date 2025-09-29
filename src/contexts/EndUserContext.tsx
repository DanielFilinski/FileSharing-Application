/**
 * End User Context
 * Manages global state for end user selection and operations
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { 
  EndUser, 
  EndUserFormData, 
  EndUserUpdateData, 
  EndUserContextValue 
} from '../shared/types/endUser.types';
import { endUserApi } from '../shared/api/endUserApi';

// State interface
interface EndUserState {
  selectedEndUser: EndUser | null;
  endUsers: EndUser[];
  isLoading: boolean;
  error: string | null;
  lastRefresh: number;
}

// Action types
type EndUserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_END_USERS'; payload: EndUser[] }
  | { type: 'SET_SELECTED_END_USER'; payload: EndUser | null }
  | { type: 'ADD_END_USER'; payload: EndUser }
  | { type: 'UPDATE_END_USER'; payload: { id: string; endUser: EndUser } }
  | { type: 'REMOVE_END_USER'; payload: string }
  | { type: 'CLEAR_STATE' }
  | { type: 'SET_LAST_REFRESH' };

// Initial state
const initialState: EndUserState = {
  selectedEndUser: null,
  endUsers: [],
  isLoading: false,
  error: null,
  lastRefresh: 0
};

// Reducer
const endUserReducer = (state: EndUserState, action: EndUserAction): EndUserState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error // Clear error when starting to load
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case 'SET_END_USERS':
      return {
        ...state,
        endUsers: action.payload,
        isLoading: false,
        error: null,
        lastRefresh: Date.now()
      };
      
    case 'SET_SELECTED_END_USER':
      // Store in localStorage for persistence
      if (action.payload) {
        localStorage.setItem('selectedEndUser', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('selectedEndUser');
      }
      
      return {
        ...state,
        selectedEndUser: action.payload
      };
      
    case 'ADD_END_USER':
      return {
        ...state,
        endUsers: [...state.endUsers, action.payload]
      };
      
    case 'UPDATE_END_USER':
      return {
        ...state,
        endUsers: state.endUsers.map(endUser =>
          endUser.id === action.payload.id ? action.payload.endUser : endUser
        ),
        selectedEndUser: state.selectedEndUser?.id === action.payload.id 
          ? action.payload.endUser 
          : state.selectedEndUser
      };
      
    case 'REMOVE_END_USER':
      return {
        ...state,
        endUsers: state.endUsers.filter(endUser => endUser.id !== action.payload),
        selectedEndUser: state.selectedEndUser?.id === action.payload 
          ? null 
          : state.selectedEndUser
      };
      
    case 'SET_LAST_REFRESH':
      return {
        ...state,
        lastRefresh: Date.now()
      };
      
    case 'CLEAR_STATE':
      localStorage.removeItem('selectedEndUser');
      return initialState;
      
    default:
      return state;
  }
};

// Context
const EndUserContext = createContext<EndUserContextValue | null>(null);

// Provider Props
interface EndUserProviderProps {
  children: React.ReactNode;
  /** Auto-refresh interval in minutes */
  refreshInterval?: number;
  /** Whether to persist selected end user across sessions */
  persistSelection?: boolean;
}

// Provider Component
export const EndUserProvider: React.FC<EndUserProviderProps> = ({
  children,
  refreshInterval = 5, // 5 minutes default
  persistSelection = true
}) => {
  const [state, dispatch] = useReducer(endUserReducer, initialState);
  
  // Load persisted selected end user on mount
  useEffect(() => {
    if (persistSelection) {
      try {
        const stored = localStorage.getItem('selectedEndUser');
        if (stored) {
          const endUser = JSON.parse(stored) as EndUser;
          dispatch({ type: 'SET_SELECTED_END_USER', payload: endUser });
        }
      } catch (error) {
        console.warn('Failed to load persisted end user selection:', error);
        localStorage.removeItem('selectedEndUser');
      }
    }
  }, [persistSelection]);
  
  // Auto-refresh end users
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshEndUsers();
      }, refreshInterval * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);
  
  // Load end users on mount
  useEffect(() => {
    refreshEndUsers();
  }, []);
  
  // Actions
  const refreshEndUsers = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await endUserApi.getEndUsers();
      dispatch({ type: 'SET_END_USERS', payload: response.endUsers });
      
      // If selected end user exists, update it with fresh data
      if (state.selectedEndUser) {
        const updatedSelectedUser = response.endUsers.find(
          endUser => endUser.id === state.selectedEndUser?.id
        );
        if (updatedSelectedUser) {
          dispatch({ type: 'SET_SELECTED_END_USER', payload: updatedSelectedUser });
        } else {
          // Selected user no longer exists
          dispatch({ type: 'SET_SELECTED_END_USER', payload: null });
        }
      }
      
    } catch (error: any) {
      console.error('Failed to refresh end users:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.selectedEndUser]);
  
  const createEndUser = useCallback(async (data: EndUserFormData): Promise<EndUser> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const endUser = await endUserApi.createEndUser(data);
      dispatch({ type: 'ADD_END_USER', payload: endUser });
      
      return endUser;
    } catch (error: any) {
      console.error('Failed to create end user:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);
  
  const updateEndUser = useCallback(async (id: string, data: EndUserUpdateData): Promise<EndUser> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const endUser = await endUserApi.updateEndUser(id, data);
      dispatch({ type: 'UPDATE_END_USER', payload: { id, endUser } });
      
      return endUser;
    } catch (error: any) {
      console.error('Failed to update end user:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);
  
  const selectEndUser = useCallback((endUser: EndUser) => {
    dispatch({ type: 'SET_SELECTED_END_USER', payload: endUser });
  }, []);
  
  const setSelectedEndUser = useCallback((endUser: EndUser | null) => {
    dispatch({ type: 'SET_SELECTED_END_USER', payload: endUser });
  }, []);
  
  const clearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_END_USER', payload: null });
  }, []);
  
  const getEndUserById = useCallback((id: string): EndUser | undefined => {
    return state.endUsers.find(endUser => endUser.id === id);
  }, [state.endUsers]);
  
  const getEndUsersByAccess = useCallback((accessLevel: EndUser['accessLevel']): EndUser[] => {
    return state.endUsers.filter(endUser => 
      endUser.accessLevel === accessLevel && endUser.isActive
    );
  }, [state.endUsers]);
  
  // Context value
  const contextValue: EndUserContextValue = {
    selectedEndUser: state.selectedEndUser,
    setSelectedEndUser,
    endUsers: state.endUsers,
    isLoading: state.isLoading,
    error: state.error,
    refreshEndUsers,
    createEndUser,
    updateEndUser,
    selectEndUser,
    clearSelection,
    getEndUserById,
    getEndUsersByAccess
  };
  
  return (
    <EndUserContext.Provider value={contextValue}>
      {children}
    </EndUserContext.Provider>
  );
};

// Hook to use the context
export const useEndUser = (): EndUserContextValue => {
  const context = useContext(EndUserContext);
  
  if (!context) {
    throw new Error('useEndUser must be used within an EndUserProvider');
  }
  
  return context;
};

// Hook for selected end user only (optimized)
export const useSelectedEndUser = (): {
  selectedEndUser: EndUser | null;
  selectEndUser: (endUser: EndUser) => void;
  clearSelection: () => void;
} => {
  const { selectedEndUser, selectEndUser, clearSelection } = useEndUser();
  
  return {
    selectedEndUser,
    selectEndUser,
    clearSelection
  };
};

// Hook for end users list only (optimized)  
export const useEndUsers = (): {
  endUsers: EndUser[];
  isLoading: boolean;
  error: string | null;
  refreshEndUsers: () => Promise<void>;
} => {
  const { endUsers, isLoading, error, refreshEndUsers } = useEndUser();
  
  return {
    endUsers,
    isLoading,
    error,
    refreshEndUsers
  };
};
