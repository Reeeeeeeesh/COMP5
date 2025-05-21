import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CalculatorContainer from './components/calculator/CalculatorContainer'
import BatchUploadContainer from './components/batch/BatchUploadContainer'
import SimpleBatchUpload from './components/batch/SimpleBatchUpload'
import BatchResultsContainer from './components/batch/BatchResultsContainer'
import DocsContainer from './components/ui/docs/DocsContainer'
import AppProvider from './contexts/AppProvider'
import { Navbar, NavbarItem } from './components/ui/navigation'
import { useTheme } from './contexts/ThemeContext'
import { Button } from './components/ui/buttons'

// Theme toggle component
const ThemeToggle = () => {
  const { isDarkMode, toggleMode } = useTheme();
  
  return (
    <Button
      variant="outline"
      onClick={toggleMode}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      size="sm"
    >
      {isDarkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </Button>
  );
};

// Main application component
function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <Navbar
            brand={<h1 className="text-xl font-bold text-gray-800 dark:text-white">FVCC</h1>}
            rightContent={<ThemeToggle />}
            variant="light"
            fixed
            shadowed
          >
            <NavbarItem href="/" active={window.location.pathname === '/'}>
              Individual Calculator
            </NavbarItem>
            <NavbarItem href="/batch" active={window.location.pathname === '/batch'}>
              Batch Processing
            </NavbarItem>
            <NavbarItem href="/docs" active={window.location.pathname === '/docs'}>
              Component Docs
            </NavbarItem>
          </Navbar>

          <main className="py-10 pt-20"> {/* Added pt-20 to account for fixed navbar */}
            <Routes>
              <Route path="/" element={<CalculatorContainer />} />
              <Route path="/batch" element={<SimpleBatchUpload />} />
              <Route path="/batch/results/:batchResultId" element={<BatchResultsContainer />} />
              <Route path="/docs" element={<DocsContainer />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
