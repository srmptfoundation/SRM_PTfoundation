import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../App';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user, profile, role, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user && role) {
      console.log('User authenticated with role:', role);
      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'staff') {
        navigate('/staff', { replace: true });
      } else if (role === 'student') {
        navigate('/student', { replace: true });
      } else {
        navigate('/forbidden', { replace: true });
      }
    } else if (!isLoading && user && !role) {
      // User is authenticated but has no role
      navigate('/forbidden', { replace: true });
    }
  }, [user, role, isLoading, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });
    if (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
        {/* Full Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo/logo2.1.png"
            alt="PTF Vizhuthugal"
            className="h-20 object-contain"
          />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Sign In</h1>
        <p className="mb-8 text-gray-600">Use your institutional Google account</p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};