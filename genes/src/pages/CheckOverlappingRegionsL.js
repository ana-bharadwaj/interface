import React, { useState } from 'react';
import './CheckOverlappingRegionsL.css';

function CheckOverlappingRegionsL() {
  const [inputData, setInputData] = useState('');
  const [serverResponse, setServerResponse] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/check_overlappingL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_data: inputData }),
      });

      const data = await response.json();
      console.log('Server response:', data); // Log the server response

      setServerResponse(data);

    } catch (error) {
      console.error('Error:', error.message);
      setServerResponse([]);
    }
  };

  return (
    <div className="CheckOverlappingRegionsL">
      <h1>Check Overlapping Regions</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Enter Region (e.g., 1:122456-34437793):
          <input type="text" value={inputData} onChange={(e) => setInputData(e.target.value)} required />
        </label>
        <button type="submit">Submit</button>
      </form>

      {serverResponse.map((result, index) => (
        <div key={index} className="result-container">
          {result.collection_name && (
            <>
              <h3>Collection: {result.collection_name}</h3>
              <p>Number of matched documents: {result.num_matched_documents || 0}</p>
            </>
          )}

          {result.document && (
            <div className="document-container">
              <h4>Document:</h4>
              <pre>{JSON.stringify(result.document, null, 2)}</pre>
            </div>
          )}

          {result.total_matched_documents && (
            <p>Total number of matched documents across all collections: {result.total_matched_documents}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default CheckOverlappingRegionsL;