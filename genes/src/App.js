// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import CheckOverlappingRegions from './pages/CheckOverlappingRegions';
import StatisticalAnalysis from './pages/StatisticalAnalysis';
import UploadFiles from './pages/UploadFiles';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/COR" element={<CheckOverlappingRegions />} />
        <Route path="/SA" element={<StatisticalAnalysis />} />
        <Route path="/UF" element={<UploadFiles />} />

      
      </Routes>
    </Router>
  );
}

export default App;