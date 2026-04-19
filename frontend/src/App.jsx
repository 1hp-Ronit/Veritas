import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CaseInput from './pages/CaseInput';
import Results from './pages/Results';
import EvidenceGraph from './pages/EvidenceGraph';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
