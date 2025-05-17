import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import CalculatorContainer from './components/calculator/CalculatorContainer'
import BatchUploadContainer from './components/batch/BatchUploadContainer'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-800 dark:text-white">FVCC</h1>
                </div>
                <div className="ml-6 flex space-x-8">
                  <Link
                    to="/"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    Individual Calculator
                  </Link>
                  <Link
                    to="/batch"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    Batch Processing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="py-10">
          <Routes>
            <Route path="/" element={<CalculatorContainer />} />
            <Route path="/batch" element={<BatchUploadContainer />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
