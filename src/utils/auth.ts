// Authentication utility functions
export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user data
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get current token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Logout user (clear all data and redirect to login)
  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Login user (store token and user data)
  login: (token: string, user: any): void => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Redirect to login with return URL
  redirectToLogin: (returnTo?: string): void => {
    const returnPath = returnTo || window.location.pathname + window.location.search;
    window.location.href = `/login?returnTo=${encodeURIComponent(returnPath)}`;
  }
};