import axios from 'axios';
import { authUtils } from './auth';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3000';

// Add request interceptor to include Bearer token
axios.interceptors.request.use(
  (config) => {
    const token = authUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message?.toLowerCase() || '';

    // Handle various token-related errors
    if (
      status === 401 ||
      status === 403 ||
      errorMessage.includes('token') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('invalid')
    ) {
      console.log('Token error detected, clearing data and redirecting to login');

      // Clear all authentication data
      authUtils.logout();

      // Redirect to login page with current path as return URL
      const currentPath = window.location.pathname + window.location.search;
      authUtils.redirectToLogin(currentPath);

      // Return a resolved promise to prevent further error handling
      return Promise.resolve();
    }

    return Promise.reject(error);
  }
);

export default axios;