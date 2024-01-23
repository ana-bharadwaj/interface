// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import CheckOverlappingRegions from './pages/CheckOverlappingRegions';
import StatisticalAnalysis from './pages/StatisticalAnalysis';
import UploadFiles from './pages/UploadFiles';
import CheckOverlappingRegionsS from './pages/CheckOverlappingRegionsS';
import StatisticalAnalysisS from './pages/StatisticalAnalysisS';
import UploadFilesS from './pages/UploadFilesS';
import CheckOverlappingRegionsL from './pages/CheckOverlappingRegionsL';
import StatisticalAnalysisL from './pages/StatisticalAnalysisL';
import UploadFilesL from './pages/UploadFilesL';




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/COR" element={<CheckOverlappingRegions />} />
        <Route path="/SA" element={<StatisticalAnalysis />} />
        <Route path="/UF" element={<UploadFiles />} />
        <Route path="/CORL" element={<CheckOverlappingRegionsL />} />
        <Route path="/SAL" element={<StatisticalAnalysisL />} />
        <Route path="/UFL" element={<UploadFilesL />} />
        <Route path="/CORS" element={<CheckOverlappingRegionsS />} />
        <Route path="/SAS" element={<StatisticalAnalysisS />} />
        <Route path="/UFS" element={<UploadFilesS />} />

      
      </Routes>
    </Router>
  );
}

export default App;