// Hook for AI-powered shape operations
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { aiService, AIServiceConfig, ShapeGenerationRequest, ShapeModificationRequest, AIShapeResponse } from '../services/aiService';
import { addSymbol, updateSymbol } from '../store/appStore';
import type { SymbolType } from '../store/appStore';

export interface AIShapeHookState {
  isGenerating: boolean;
  isModifying: boolean;
  isConnected: boolean;
  lastError: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'testing' | 'error';
}

export interface UseAIShapeOptions {
  onShapeGenerated?: (shape: SymbolType) => void;
  onShapeModified?: (shape: SymbolType) => void;
  onError?: (error: string) => void;
}

export const useAIShape = (options?: UseAIShapeOptions) => {
  const dispatch = useDispatch();
  const [state, setState] = useState<AIShapeHookState>({
    isGenerating: false,
    isModifying: false,
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

  // Generate a new shape using AI
  const generateShape = useCallback(async (prompt: string, context?: ShapeGenerationRequest['context']) => {
    if (!state.isConnected) {
      const error = 'AI service not connected. Please test connection first.';
      setState(prev => ({ ...prev, lastError: error }));
      options?.onError?.(error);
      return { success: false, error };
    }

    setState(prev => ({ ...prev, isGenerating: true, lastError: null }));

    try {
      const request: ShapeGenerationRequest = {
        prompt,
        context,
      };

      const response = await aiService.generateShape(request);

      if (response.success && response.shape) {
        // Convert AI response to SymbolType
        const newSymbol: SymbolType = {
          uuid: uuidv4(),
          inventoryId: uuidv4(),
          type: response.shape.type,
          x: response.shape.x,
          y: response.shape.y,
          width: response.shape.width,
          height: response.shape.height,
          // Extended properties for styling
          ...(response.shape.fill && { fill: response.shape.fill }),
          ...(response.shape.stroke && { stroke: response.shape.stroke }),
          ...(response.shape.strokeWidth && { strokeWidth: response.shape.strokeWidth }),
          ...(response.shape.cornerRadius && { cornerRadius: response.shape.cornerRadius }),
          ...(response.shape.points && { points: response.shape.points }),
        };

        // Add to store
        dispatch(addSymbol(newSymbol));
        
        setState(prev => ({ ...prev, isGenerating: false }));
        options?.onShapeGenerated?.(newSymbol);
        
        return {
          success: true,
          shape: newSymbol,
          reasoning: response.reasoning,
        };
      } else {
        const error = response.error || 'Failed to generate shape';
        setState(prev => ({ ...prev, isGenerating: false, lastError: error }));
        options?.onError?.(error);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, isGenerating: false, lastError: errorMessage }));
      options?.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [state.isConnected, dispatch, options]);

  // Modify an existing shape using AI
  const modifyShape = useCallback(async (shape: SymbolType, prompt: string) => {
    if (!state.isConnected) {
      const error = 'AI service not connected. Please test connection first.';
      setState(prev => ({ ...prev, lastError: error }));
      options?.onError?.(error);
      return { success: false, error };
    }

    setState(prev => ({ ...prev, isModifying: true, lastError: null }));

    try {
      // Only allow valid types for modification
      const allowedTypes = ["rect", "circle", "polygon"] as const;
      const safeType = allowedTypes.includes(shape.type as any) ? shape.type : "rect";
      const request: ShapeModificationRequest = {
        prompt,
        targetShape: {
          type: safeType as "rect" | "circle" | "polygon",
          properties: {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
            fill: (shape as any).fill,
            stroke: (shape as any).stroke,
            strokeWidth: (shape as any).strokeWidth,
            cornerRadius: (shape as any).cornerRadius,
            points: (shape as any).points,
          },
        },
      };

      const response = await aiService.modifyShape(request);

      if (response.success && response.shape) {
        // Update the existing shape
        const updatedShape: SymbolType = {
          ...shape,
          type: response.shape.type,
          x: response.shape.x,
          y: response.shape.y,
          width: response.shape.width,
          height: response.shape.height,
          // Extended properties for styling
          ...(response.shape.fill && { fill: response.shape.fill }),
          ...(response.shape.stroke && { stroke: response.shape.stroke }),
          ...(response.shape.strokeWidth && { strokeWidth: response.shape.strokeWidth }),
          ...(response.shape.cornerRadius && { cornerRadius: response.shape.cornerRadius }),
          ...(response.shape.points && { points: response.shape.points }),
        };

        // Update in store
        dispatch(updateSymbol(updatedShape));
        
        setState(prev => ({ ...prev, isModifying: false }));
        options?.onShapeModified?.(updatedShape);
        
        return {
          success: true,
          shape: updatedShape,
          reasoning: response.reasoning,
        };
      } else {
        const error = response.error || 'Failed to modify shape';
        setState(prev => ({ ...prev, isModifying: false, lastError: error }));
        options?.onError?.(error);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, isModifying: false, lastError: errorMessage }));
      options?.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [state.isConnected, dispatch, options]);

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
    generateShape,
    modifyShape,
    getStatus,
  };
};
