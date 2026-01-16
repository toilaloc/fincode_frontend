/**
 * Fincode key validation utilities
 * Ensures proper separation between public and secret keys
 */

export const fincodeKeyValidator = {
  /**
   * Validates that a key is a public key (starts with 'p_')
   * Public keys are safe to use in frontend for tokenization
   */
  isValidPublicKey: (key: string): boolean => {
    if (!key || typeof key !== 'string') {
      return false;
    }

    // Check basic format
    const isPublicFormat = key.startsWith('p_') && key.length > 10;

    // For test keys, allow combined format (public + secret) as Fincode test environment accepts it
    const isTestKey = key.startsWith('p_test_');
    if (isTestKey) {
      return isPublicFormat;
    }

    // For production keys, ensure no embedded secret data
    const hasEmbeddedSecret = key.includes('c18') || key.includes('s_') || key.includes('_s_');

    return isPublicFormat && !hasEmbeddedSecret;
  },

  /**
   * Validates that a key is a secret key (starts with 's_')
   * Secret keys should NEVER be used in frontend
   */
  isValidSecretKey: (key: string): boolean => {
    if (!key || typeof key !== 'string') {
      return false;
    }
    return key.startsWith('s_') && key.length > 10;
  },

  /**
   * Throws an error if the key is not a valid public key
   * Use this to validate keys before using them in frontend
   */
  validatePublicKey: (key: string, context: string = 'Fincode operation'): void => {
    if (!fincodeKeyValidator.isValidPublicKey(key)) {
      let errorMessage = `Invalid public key provided for ${context}. `;

      if (key.includes('c18') || key.includes('s_')) {
        errorMessage += 'Key appears to contain embedded secret key data. ';
        errorMessage += 'Backend is likely incorrectly concatenating or embedding secret keys in the public_key field. ';
      } else if (key.startsWith('s_')) {
        errorMessage += 'Received secret key instead of public key. ';
      } else {
        errorMessage += 'Public keys must start with "p_". ';
      }

      errorMessage += 'Make sure your backend returns a clean public key (starts with p_) for frontend tokenization.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Logs a warning if a secret key is detected (for debugging)
   */
  warnIfSecretKey: (key: string, context: string = 'operation'): void => {
    if (fincodeKeyValidator.isValidSecretKey(key)) {
      console.warn(
        `WARNING: Secret key detected in ${context}! ` +
        `Secret keys should never be used in frontend code. ` +
        `This is a security risk.`
      );
    }
  }
};