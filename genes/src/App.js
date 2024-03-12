import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import CheckOverlappingRegions from './pages/CheckOverlappingRegions';
import CheckOverlappingRegionsL from './pages/CheckOverlappingRegionsL';
import Home from './pages/Home';
import Login from './pages/Login';
import StatisticalAnalysis from './pages/StatisticalAnalysis';
import UploadFiles from './pages/UploadFiles';
import UploadFilesL from './pages/UploadFilesL';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/HOM" element={<Home />} />
        <Route path="/COR" element={<CheckOverlappingRegions />} />
        <Route path="/SA" element={<StatisticalAnalysis />} />
        <Route path="/UF" element={<UploadFiles />} />
        <Route path="/CORL" element={<CheckOverlappingRegionsL />} />
        <Route path="/UFL" element={<UploadFilesL />} />
      </Routes>
    </Router>
  );
}

export default App;
