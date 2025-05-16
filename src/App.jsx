import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import getIcon from './utils/iconUtils';

// Pages
import Home from './pages/Home';
import NotFound from './pages/NotFound';

const App = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Update body class and localStorage when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Header with dark mode toggle
  const SunIcon = getIcon('Sun');
  const MoonIcon = getIcon('Moon');
  const ChecklistIcon = getIcon('CheckSquare');

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <header className="bg-gradient-to-r from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 border-b border-surface-200 dark:border-surface-700 shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-app p-1.5 rounded-lg shadow-sm"><ChecklistIcon className="text-white h-5 w-5" /></div>
            <h1 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50">
              TaskMaster
            </h1>
          </div>
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
      </header>

      <main className="flex-grow mt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="bg-gradient-to-r from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 border-t border-surface-200 dark:border-surface-700 py-4 mt-8 shadow-inner">
        <div className="container mx-auto px-4 text-center text-sm font-medium text-surface-600 dark:text-surface-400">
          &copy; {new Date().getFullYear()} TaskMaster. All rights reserved.
        </div>
      </footer>

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
  );
};

export default App;