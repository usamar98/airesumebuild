/**
 * Error Mapping Utility
 * Converts technical error codes to user-friendly messages
 * without revealing underlying technology details
 */

export interface ErrorResponse {
  success: boolean;
  error?: string;
  message?: string;
  requiresVerification?: boolean;
}

/**
 * Maps technical error codes to user-friendly messages
 * @param errorCode - The technical error code
 * @param defaultMessage - Default message if no mapping found
 * @returns User-friendly error message
 */
export const mapErrorToUserMessage = (errorCode: string, defaultMessage: string = 'Something went wrong. Please try again.'): string => {
  const errorMap: Record<string, string> = {
    // Authentication errors
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-disabled': 'This account has been temporarily disabled. Please contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again in a few minutes.',
    'auth/network-request-failed': 'Network connection error. Please check your internet connection.',
    'auth/timeout': 'Request timed out. Please try again.',
    
    // Registration errors
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password must be at least 6 characters long',
    'auth/operation-not-allowed': 'Registration is currently unavailable. Please try again later.',
    
    // Configuration and service errors
    'auth/configuration-not-found': 'Authentication service configuration error. Please contact support or check the setup guide.',
    'auth/api-key-not-valid': 'Authentication service is temporarily unavailable. Please try again later.',
    'auth/app-not-authorized': 'Authentication service is temporarily unavailable. Please try again later.',
    'auth/invalid-api-key': 'Authentication service is temporarily unavailable. Please try again later.',
    'auth/project-not-found': 'Authentication service is temporarily unavailable. Please try again later.',
    'auth/quota-exceeded': 'Service is temporarily busy. Please try again in a few minutes.',
    
    // Generic service errors
    'auth/internal-error': 'An unexpected error occurred. Please try again.',
    'auth/service-unavailable': 'Authentication service is temporarily unavailable. Please try again later.',
    'auth/unavailable': 'Authentication service is temporarily unavailable. Please try again later.',
  };

  return errorMap[errorCode] || defaultMessage;
};

/**
 * Creates a standardized error response for authentication operations
 * @param error - The error object or error code
 * @param defaultMessage - Default message if no mapping found
 * @returns Standardized error response
 */
export const createErrorResponse = (
  error: any, 
  defaultMessage: string = 'Something went wrong. Please try again.'
): ErrorResponse => {
  const errorCode = error?.code || error?.message || 'unknown-error';
  const userMessage = mapErrorToUserMessage(errorCode, defaultMessage);
  
  return {
    success: false,
    error: userMessage
  };
};

/**
 * Creates a standardized success response for authentication operations
 * @param message - Optional success message
 * @param additionalData - Additional data to include in response
 * @returns Standardized success response
 */
export const createSuccessResponse = (
  message?: string, 
  additionalData?: Partial<ErrorResponse>
): ErrorResponse => {
  return {
    success: true,
    message,
    ...additionalData
  };
};

/**
 * Logs technical errors for debugging while showing user-friendly messages
 * @param error - The technical error
 * @param context - Context where the error occurred
 */
export const logTechnicalError = (error: any, context: string): void => {
  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] Technical error:`, error);
  }
};