import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { Forbidden } from './pages/Forbidden';
import { supabase } from './src/lib/supabase';
import { Role } from './types';

// --- Auth Context ---
interface AuthContextType {
  user: any | null; // Supabase user
  profile: any | null; // App profile
  role: Role | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth redirect (extract session from hash fragment)
    const handleOAuthRedirect = async () => {
      // If URL contains hash with access_token, extract the session
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('Detected OAuth redirect, extracting session from URL...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session from URL:', error);
        }

        // Clean up the hash fragment from URL
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    };

    handleOAuthRedirect().then(() => {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Initial session:', session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      });
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, we might want to handle it (e.g. auto-create or show forbidden)
        // For now, let's assume if no profile, role is null
      }
      console.log('Profile data:', data);
      setProfile(data);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const role = profile?.role as Role | null;

  return (
    <AuthContext.Provider value={{ user, profile, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route Wrapper ---
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: Role[] }> = ({ children, allowedRoles }) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If user is logged in but has no role (profile missing or pending), redirect to forbidden
  if (!role) {
    return <Navigate to="/forbidden" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to their appropriate dashboard if they try to access wrong one
    if (role === Role.ADMIN) return <Navigate to="/admin" replace />;
    if (role === Role.STAFF) return <Navigate to="/staff" replace />;
    if (role === Role.STUDENT) return <Navigate to="/student" replace />;
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

// --- Main App ---
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forbidden" element={<Forbidden />} />

          <Route path="/student" element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={[Role.STAFF]}>
              <StaffDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}