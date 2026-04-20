import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import CaseInput from './pages/CaseInput';
import Results from './pages/Results';
import EvidenceGraph from './pages/EvidenceGraph';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route — Login page (no navbar) */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes — wrapped with navbar + auth guard */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div className="min-h-screen flex flex-col bg-page">
                  <Navbar />
                  <main className="flex-1 flex flex-col relative">
                    <Routes>
                      <Route path="/" element={<CaseInput />} />
                      <Route path="/results" element={<Results />} />
                      <Route path="/graph" element={<EvidenceGraph />} />
                    </Routes>
                  </main>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
