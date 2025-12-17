import { Alert } from 'react-native';

export interface AppError {
  message: string;
  code?: string;
  context?: string;
}

/**
 * Centralized error handler for the application
 */
export const handleError = (error: unknown, context: string, showAlert = true): AppError => {
  let errorMessage = 'An unexpected error occurred';
  let errorCode: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    errorCode = error.name;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message) || errorMessage;
    if ('code' in error) {
      errorCode = String(error.code);
    }
  }

  const appError: AppError = {
    message: errorMessage,
    code: errorCode,
    context,
  };

  // Log error for debugging (only in development)
  if (__DEV__) {
    console.error(`[${context}]`, appError);
  }

  // Show user-friendly alert
  if (showAlert) {
    Alert.alert('Error', errorMessage);
  }

  return appError;
};

/**
 * Handle API errors specifically
 */
export const handleApiError = (error: unknown, context: string): AppError => {
  return handleError(error, `API: ${context}`, true);
};

/**
 * Handle validation errors
 */
export const handleValidationError = (message: string): void => {
  Alert.alert('Validation Error', message);
};

