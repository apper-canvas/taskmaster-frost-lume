import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import getIcon from '../utils/iconUtils';

const NotFound = () => {
  const HomeIcon = getIcon('Home');
  const AlertTriangleIcon = getIcon('AlertTriangle');

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-xl mx-auto px-4"
      >
        <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 dark:bg-primary/20">
          <AlertTriangleIcon className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-surface-900 dark:text-surface-50">
          Page Not Found
        </h1>
        
        <p className="text-lg text-surface-600 dark:text-surface-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-200"
          >
            <HomeIcon className="h-5 w-5" />
            Go Back Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;