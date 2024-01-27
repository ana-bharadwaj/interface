import React, { useState } from 'react';
import './CheckOverlappingRegionsL.css';

function CheckOverlappingRegionsL() {
  const [inputData, setInputData] = useState('');
  const [serverResponse, setServerResponse] = useState({ matched_data: [], total_matched_documents: 0 });
  const [expandedCells, setExpandedCells] = useState([]);

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
      setExpandedCells([]); // Reset expanded cells when new data is loaded

    } catch (error) {
      console.error('Error:', error.message);
      setServerResponse({ matched_data: [], total_matched_documents: 0 });
      setExpandedCells([]);
    }
  };

  const toggleExpansion = (index) => {
    setExpandedCells((prevExpanded) => {
      if (prevExpanded.includes(index)) {
        return prevExpanded.filter((item) => item !== index);
      } else {
        return [...prevExpanded, index];
      }
    });
  };

  const isCellExpanded = (index) => expandedCells.includes(index);

  const renderTableCell = (value, index) => {
    if (typeof value === 'object') {
      return (
        <div>
          {Object.entries(value).map(([subHeading, subValue], idx) => (
            <div key={idx}>
              <strong>{subHeading}:</strong> {subValue}
            </div>
          ))}
        </div>
      );
    } else if (typeof value === 'string' && value.split('\n').length > 10) {
      return (
        <div>
          <div>{isCellExpanded(index) ? value : value.split('\n').slice(0, 10).join('\n')}</div>
          {value.split('\n').length > 10 && (
            <button onClick={() => toggleExpansion(index)}>
              {isCellExpanded(index) ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      );
    }
    return value;
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

      <div className="table-container">
        {serverResponse.matched_data.length > 0 && (
          <table className="result-table">
            <thead>
              <tr>
                <th>Collection Name</th>
                <th>Document ID</th>
                {Object.keys(serverResponse.matched_data[0]).map((field) => (
                  <th key={field}>{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serverResponse.matched_data.map((result, index) => (
                <tr key={index}>
                  <td>{result.collection_name}</td>
                  <td>{result.document_id}</td>
                  {Object.values(result).map((value, idx) => (
                    <td key={idx}>{renderTableCell(value, idx)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p>Total number of matched documents across all collections: {serverResponse.total_matched_documents}</p>
    </div>
  );
}

export default CheckOverlappingRegionsL;