// src/pages/UploadFiles.js
import React, { useState } from 'react';
import './UploadFiles.css';

const UploadFiles = () => {
  const [showFileUploadBox, setShowFileUploadBox] = useState(false);

  const handleUploadClick = () => {
    setShowFileUploadBox(!showFileUploadBox);
  };

  return (
    <div className={"upload-files-container ${showFileUploadBox ? 'buttons-moved' : ''}"}>
      <div className="button-container">
      
        <button className="glass-button" onClick={handleUploadClick}>
          Upload Files
        </button>

        
        <button className="glass-button">Delete Files</button>
        <button className="glass-button">View Files</button>
      </div>

      {showFileUploadBox && (
        <div className="file-upload-box">
          
          <h2>File Upload Box</h2>
          
        </div>
      )}
    </div>
  );
};

export default UploadFiles;