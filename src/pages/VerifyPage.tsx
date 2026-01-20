import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const VerifyPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (token && email) {
      verifyMagicLink(token, email);
    } else {
      setError('Invalid verification link. Missing token or email parameters.');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyMagicLink = async (token: string, email: string) => {
    try {
      setMessage('Verifying your magic link...');

      // Use axios directly for verification since it doesn't require auth
      const response = await api.get('/api/v1/magic_links/verify', {
        params: { token, email }
      });

      const { access_token, user } = response.data;

      // Store the token and user information
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      setMessage('Successfully logged in! Redirecting to home...');

      // Redirect to home after successful verification
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err: any) {
      console.error('Magic link verification failed:', err);
      setError(err.response?.data?.message || 'Failed to verify magic link. The link may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <div className="text-center">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            ) : error ? (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {loading ? 'Verifying...' : error ? 'Verification Failed' : 'Login Successful!'}
            </h2>

            {message && (
              <p className="text-green-600 mb-4">{message}</p>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {!loading && (
              <div className="space-y-4">
                {error && (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Go to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;