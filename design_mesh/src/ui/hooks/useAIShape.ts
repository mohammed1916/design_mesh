// Hook for AI-powered shape operations
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { aiService, AIServiceConfig, AIGenerationRequest, AIGenerationResponse } from '../services/aiService';
import { addSymbol, updateSymbol } from '../store/appStore';
import type { SymbolType } from '../store/appStore';

export type ConnectionStatus = 'connected' | 'disconnected' | 'testing' | 'error';
export interface AIShapeHookState {
  isGenerating: boolean;
  isConnected: boolean;
  lastError: string | null;
  connectionStatus: ConnectionStatus;
}

export interface UseAIShapeOptions {
  onGenerated?: (result: string) => void;
  onError?: (error: string) => void;
}

export const useAIShape = (options?: UseAIShapeOptions) => {
  const dispatch = useDispatch();
  const [state, setState] = useState<AIShapeHookState>({
    isGenerating: false,
    isConnected: false,
    lastError: null,
    connectionStatus: 'disconnected',
  });

  // Update AI service configuration
  const updateAIConfig = useCallback((config: Partial<AIServiceConfig>) => {
    aiService.updateConfig(config);
    // Reset connection status when config changes
    setState(prev => ({ ...prev, connectionStatus: 'disconnected', isConnected: false }));
  }, []);

  // Test connection to AI service
  const testConnection = useCallback(async () => {
    setState(prev => ({ ...prev, connectionStatus: 'testing' }));
    
    try {
      const result = await aiService.testConnection();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          connectionStatus: 'connected',
          isConnected: true,
          lastError: null,
        }));
        return { success: true, model: result.model };
      } else {
        setState(prev => ({
          ...prev,
          connectionStatus: 'error',
          isConnected: false,
          lastError: result.error || 'Connection test failed',
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        isConnected: false,
        lastError: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Generic generate method for text-to-image/video
  const generate = useCallback(async (prompt: string) => {
    if (!state.isConnected) {
      const error = 'AI service not connected. Please test connection first.';
      setState(prev => ({ ...prev, lastError: error }));
      options?.onError?.(error);
      return { success: false, error };
    }
    setState(prev => ({ ...prev, isGenerating: true, lastError: null }));
    try {
      const request: AIGenerationRequest = { prompt };
      const response: AIGenerationResponse = await aiService.generate(request);
      setState(prev => ({ ...prev, isGenerating: false }));
      if (response.success && response.result) {
        options?.onGenerated?.(response.result);
        return { success: true, result: response.result };
      } else {
        const error = response.error || 'Failed to generate result';
        setState(prev => ({ ...prev, lastError: error }));
        options?.onError?.(error);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, isGenerating: false, lastError: errorMessage }));
      options?.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [state.isConnected, options]);


  // Get current AI service status
  const getStatus = useCallback(() => {
    return {
      ...state,
    };
  }, [state]);

  return {
    // State
    ...state,
    // Actions
    updateAIConfig,
    testConnection,
    generate,
    getStatus,
  };
};
