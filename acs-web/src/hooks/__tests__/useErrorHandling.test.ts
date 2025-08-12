import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandling } from '../useErrorHandling';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    expect(result.current.errors).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles basic errors', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const testError = new Error('Test error');
    
    act(() => {
      result.current.handleError(testError);
    });
    
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]).toMatchObject({
      code: 'UNKNOWN_ERROR',
      message: 'Test error',
      context: undefined,
    });
  });

  it('handles errors with custom options', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const testError = new Error('Test error');
    
    act(() => {
      result.current.handleError(testError, {
        context: 'Test context',
        showToast: false,
        logToConsole: false,
      });
    });
    
    expect(result.current.errors[0]).toMatchObject({
      message: 'Test error',
      context: 'Test context',
    });
  });

  it('handles API errors with status codes', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const apiError = {
      response: {
        status: 404,
        data: {
          message: 'Not found',
          error: {
            code: 'NOT_FOUND',
            details: { resource: 'user' },
          },
        },
      },
    };
    
    act(() => {
      result.current.handleError(apiError);
    });
    
    expect(result.current.errors[0]).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Not found',
      statusCode: 404,
      details: { resource: 'user' },
    });
  });

  it('handles async operations successfully', async () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const successfulOperation = vi.fn().mockResolvedValue('success');
    
    let operationResult;
    await act(async () => {
      operationResult = await result.current.handleAsyncOperation(successfulOperation);
    });
    
    expect(operationResult).toBe('success');
    expect(result.current.errors).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles async operations with errors', async () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const failingOperation = vi.fn().mockRejectedValue(new Error('Async error'));
    
    let operationResult;
    await act(async () => {
      operationResult = await result.current.handleAsyncOperation(failingOperation);
    });
    
    expect(operationResult).toBeNull();
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe('Async error');
    expect(result.current.isLoading).toBe(false);
  });

  it('sets loading state during async operations', async () => {
    const { result } = renderHook(() => useErrorHandling());
    
    let resolveOperation: (value: string) => void;
    const slowOperation = new Promise<string>((resolve) => {
      resolveOperation = resolve;
    });
    
    // Start the operation
    const operationPromise = act(async () => {
      return result.current.handleAsyncOperation(() => slowOperation);
    });
    
    // Check loading state
    expect(result.current.isLoading).toBe(true);
    
    // Resolve the operation
    act(() => {
      resolveOperation!('success');
    });
    
    await operationPromise;
    
    expect(result.current.isLoading).toBe(false);
  });

  it('retries operations with exponential backoff', async () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const failingOperation = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success');
    
    let operationResult;
    await act(async () => {
      operationResult = await result.current.retryOperation(
        failingOperation,
        3, // maxRetries
        100 // delay
      );
    });
    
    expect(failingOperation).toHaveBeenCalledTimes(3);
    expect(operationResult).toBe('success');
    expect(result.current.errors).toHaveLength(0);
  });

  it('fails after max retries', async () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const alwaysFailingOperation = vi.fn().mockRejectedValue(new Error('Always fails'));
    
    let operationResult;
    await act(async () => {
      operationResult = await result.current.retryOperation(
        alwaysFailingOperation,
        2, // maxRetries
        10 // delay
      );
    });
    
    expect(alwaysFailingOperation).toHaveBeenCalledTimes(2);
    expect(operationResult).toBeNull();
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].context).toContain('failed after 2 attempts');
  });

  it('clears all errors', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    // Add some errors
    act(() => {
      result.current.handleError(new Error('Error 1'));
      result.current.handleError(new Error('Error 2'));
    });
    
    expect(result.current.errors).toHaveLength(2);
    
    // Clear errors
    act(() => {
      result.current.clearErrors();
    });
    
    expect(result.current.errors).toHaveLength(0);
  });

  it('clears specific error by timestamp', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    // Add errors
    act(() => {
      result.current.handleError(new Error('Error 1'));
      result.current.handleError(new Error('Error 2'));
    });
    
    const firstErrorTimestamp = result.current.errors[0].timestamp;
    
    // Clear specific error
    act(() => {
      result.current.clearError(firstErrorTimestamp);
    });
    
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe('Error 2');
  });

  it('limits error history to 10 items', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    // Add 12 errors
    act(() => {
      for (let i = 0; i < 12; i++) {
        result.current.handleError(new Error(`Error ${i}`));
      }
    });
    
    // Should only keep the last 10
    expect(result.current.errors).toHaveLength(10);
    expect(result.current.errors[0].message).toBe('Error 11'); // Most recent first
    expect(result.current.errors[9].message).toBe('Error 2'); // Oldest kept
  });

  it('handles network errors appropriately', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    const networkError = {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    };
    
    act(() => {
      result.current.handleError(networkError);
    });
    
    expect(result.current.errors[0]).toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    });
  });
});
