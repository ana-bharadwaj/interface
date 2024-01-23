// src/pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Header from '../Components/Header';

const Home = () => {
  const navigate = useNavigate();

  const handleBoxClick = (page) => {
    console.log('Navigating to ${page}');
    switch (page) {
      case 'UploadFiles':
        navigate('/UF');
        break;
      case 'CheckOverlappingRegions':
        navigate('/COR');
        break;
      case 'StatisticalAnalysis':
        navigate('/SA');
        case 'UploadFilesL':
          navigate('/UFL');
          break;
        case 'CheckOverlappingRegionsL':
          navigate('/CORL');
          break;
        case 'StatisticalAnalysisL':
          navigate('/SAL'); 
          case 'UploadFilesS':
            navigate('/UFS');
            break;
          case 'CheckOverlappingRegionsS':
            navigate('/CORS');
            break;
          case 'StatisticalAnalysisS':
            navigate('/SAS');
        break;
      default:
        // Handle default case or do nothing
        break;
    }
  };

  return (
    <>
      <div className="bg"></div>
      <div className="bg bg2"></div>
      <div className="bg bg3"></div>
      <div className="content"></div>

      <div className="home-container">
        <Header />

        <div className="box-container">
          <div className="box">
            CNV
            <div>
              <button onClick={() => handleBoxClick('UploadFiles')}>Upload Files</button>
            </div>
            <div>
              <button onClick={() => handleBoxClick('CheckOverlappingRegions')}>Check Overlapping Regions</button>
            </div>
            <div>
              <button onClick={() => handleBoxClick('StatisticalAnalysis')}>Statistical Analysis</button>
            </div>
          </div>
          <div className="box">
            SNV
            <div>
              <button onClick={() => handleBoxClick('UploadFilesS')}>Upload Files</button>
            </div>
            <div>
              <button onClick={() => handleBoxClick('CheckOverlappingRegionsS')}>Check Overlapping Regions</button>
            </div>
            <div>
              <button onClick={() => handleBoxClick('StatisticalAnalysisS')}>Statistical Analysis</button>
            </div>
          </div>
          <div className="box">
            LOH
            <div>
              <button onClick={() => handleBoxClick('UploadFilesL')}>Upload Files</button>
            </div>
            <div>
              <button onClick={() => handleBoxClick('CheckOverlappingRegionsL')}>Check Overlapping Regions</button>
            </div>
            <div>
              <button onClick={() => handleBoxClick('StatisticalAnalysisL')}>Statistical Analysis</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;