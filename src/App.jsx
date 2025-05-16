import { createContext, useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import getIcon from './utils/iconUtils';
import { setUser, clearUser } from './store/userSlice';

// Pages
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Callback from './pages/Callback';
import ErrorPage from './pages/ErrorPage';

// Create auth context
export const AuthContext = createContext(null);

const App = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Get authentication status with proper error handling
  const userState = useSelector((state) => state.user);
  const isAuthenticated = userState?.isAuthenticated || false;

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Initialize ApperUI once when the app loads
  useEffect(() => {
    const { ApperClient, ApperUI } = window.ApperSDK;
    const client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Initialize but don't show login yet
    ApperUI.setup(client, {
      target: '#authentication',
      clientId: import.meta.env.VITE_APPER_PROJECT_ID,
      view: 'both',
      onSuccess: function (user) {
        setIsInitialized(true);
        // CRITICAL: This exact currentPath logic must be preserved in all implementations
        // DO NOT simplify or modify this pattern as it ensures proper redirection flow
        let currentPath = window.location.pathname + window.location.search;
        let redirectPath = new URLSearchParams(window.location.search).get('redirect');
        const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || currentPath.includes(
            '/callback') || currentPath.includes('/error');
        if (user) {
          // User is authenticated
          if (redirectPath) {
            navigate(redirectPath);
          } else if (!isAuthPage) {
            if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
              navigate(currentPath);
            } else {
              navigate('/');
            }
          } else {
            navigate('/');
          }
          // Store user information in Redux
          dispatch(setUser(JSON.parse(JSON.stringify(user))));
        } else {
          // User is not authenticated
          if (!isAuthPage) {
            navigate(
              currentPath.includes('/signup')
               ? `/signup?redirect=${currentPath}`
               : currentPath.includes('/login')
               ? `/login?redirect=${currentPath}`
               : '/login');
          } else if (redirectPath) {
            if (
              ![
                'error',
                'signup',
                'login',
                'callback'
              ].some((path) => currentPath.includes(path)))
              navigate(`/login?redirect=${redirectPath}`);
            else {
              navigate(currentPath);
            }
          } else if (isAuthPage) {
            navigate(currentPath);
          } else {
            navigate('/login');
          }
          dispatch(clearUser());
        }
      },
      onError: function(error) {
        console.error("Authentication failed:", error);
      }
    });
  }, [dispatch, navigate]);

  // Update body class and localStorage when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Authentication methods to share via context
  const authMethods = {
    isInitialized,
    logout: async () => {
      try {
        const { ApperUI } = window.ApperSDK;
        await ApperUI.logout();
        dispatch(clearUser());
        navigate('/login');
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  // Header with dark mode toggle
  const SunIcon = getIcon('Sun');
  const MoonIcon = getIcon('Moon');
  const ChecklistIcon = getIcon('CheckSquare');

  // Don't render routes until initialization is complete
  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen text-lg">Initializing application...</div>;
  }

  return (
    <AuthContext.Provider value={authMethods}>
      <div className="min-h-screen flex flex-col transition-colors duration-200">
        {isAuthenticated && (
          <header className="bg-gradient-to-r from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 border-b border-surface-200 dark:border-surface-700 shadow-md py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-app p-1.5 rounded-lg shadow-sm"><ChecklistIcon className="text-white h-5 w-5" /></div>
                <h1 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50">
                  TaskMaster
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => authMethods.logout()}
                  className="text-sm px-3 py-1 text-surface-600 dark:text-surface-300 hover:text-red-500 dark:hover:text-red-400"
                >
                  Logout
                </button>
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors duration-200"
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={darkMode ? 'dark' : 'light'}
                      initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      {darkMode ? (
                        <SunIcon className="h-5 w-5 text-yellow-300 drop-shadow-md" />
                      ) : (
                        <MoonIcon className="h-5 w-5 text-indigo-400" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </header>
        )}

        <main className={`flex-grow ${isAuthenticated ? 'mt-6' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/" element={isAuthenticated ? <Home /> : <Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {isAuthenticated && (
          <footer className="bg-gradient-to-r from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 border-t border-surface-200 dark:border-surface-700 py-4 mt-8 shadow-inner">
            <div className="container mx-auto px-4 text-center text-sm font-medium text-surface-600 dark:text-surface-400">
              &copy; {new Date().getFullYear()} TaskMaster. All rights reserved.
            </div>
          </footer>
        )}

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? "dark" : "light"}
          toastClassName="bg-gradient-to-r from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 text-surface-900 dark:text-surface-50 shadow-md rounded-lg border border-surface-200 dark:border-surface-700"
        />
      </div>
    </AuthContext.Provider>
  );
};

export default App;