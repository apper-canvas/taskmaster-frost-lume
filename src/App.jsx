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
      <header className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChecklistIcon className="text-primary h-6 w-6" />
            <h1 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50">
              TaskMaster
            </h1>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors duration-200"
            aria-label="Toggle dark mode"
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
                  <SunIcon className="h-5 w-5 text-yellow-300" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-surface-600" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </header>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-surface-500">
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
        toastClassName="bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-50 shadow-md"
      />
    </div>
  );
};

export default App;