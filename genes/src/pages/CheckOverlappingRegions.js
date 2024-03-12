import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './CheckOverlappingRegions.css';

function CheckOverlappingRegions() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [chromosome, setChromosome] = useState('');
  const [duplicationDeletion, setDuplicationDeletion] = useState('');
  const [serverResponse, setServerResponse] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const samplesPerPage = 5; // Maximum samples per table
  const [graphUrl, setGraphUrl] = useState(null);  // To store the URL of the graph image
  const [showModal, setShowModal] = useState(false);

  const flattenNested = (obj, prefix = '') => {
    let flat = {};
    for (const [key, value] of Object.entries(obj)) {
      const flattenedKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        const nested = flattenNested(value, flattenedKey);
        Object.assign(flat, nested);
      } else {
        flat[flattenedKey] = value;
      }
    }
    return flat;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://10.11.30.239:5000/process_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end, chromosome, duplication_deletion: duplicationDeletion }),
      });

      const data = await response.json();
      setServerResponse(data);

      // Scroll to the top when there is a server response
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error:', error.message);
      setServerResponse({});
    }
  };

  const handleGenerateGraph = async () => {
    try {
      const response = await fetch('http://10.11.30.239:5000/get_matched_data_graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end, chromosome, duplication_deletion: duplicationDeletion }),
      });

      if (response.ok) {
        // Assuming the response is a file, you can handle it as needed
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGraphUrl(url);
        setShowModal(true);
      } else {
        const data = await response.json();
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setGraphUrl(null);
    setShowModal(false);
  };

  const renderTable = (data, title) => {
    const startIndex = (currentPage - 1) * samplesPerPage;
    const endIndex = startIndex + samplesPerPage;

    const totalPages = Math.ceil(data.length / samplesPerPage);

    const paginatedData = data.slice(startIndex, endIndex);

    return (
      <div className="table-box">
        <h3>{title}</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>collection_name</th>
                <th>Position</th>
                {Object.keys(data[0])
                  .filter((key) => key !== 'collection_name' && key !== 'Position')
                  .map((header) => (
                    <th key={header}>{header}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={index}>
                  <td>{item.collection_name}</td>
                  <td>
                    {item.Position}
                    {item.INFO && item.INFO.span && (
                      <span className="info-span">{item.INFO.span}</span>
                    )}
                  </td>
                  {Object.entries(item)
                    .filter(([key]) => key !== 'collection_name' && key !== 'Position' && key !== 'INFO')
                    .map(([key, value]) => (
                      <td key={key}>
                        {key === 'FORMAT' ? (
                          <table>
                            <thead>
                              <tr>
                                {Object.keys(value).map((subHeading) => (
                                  <th key={subHeading}>{subHeading}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {Object.values(value).map((subValue, subIndex) => (
                                  <td key={subIndex}>{subValue}</td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          JSON.stringify(value)
                        )}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            <span>{`Page ${currentPage} of ${totalPages}`}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('http://10.11.30.239:5000/process_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end, chromosome, duplication_deletion: duplicationDeletion }),
      });

      const data = await response.json();

      const wb = XLSX.utils.book_new();
      wb.SheetNames.push('Combined Data');

      const combinedData = [
        ...data.matched_data_alt_e.map((item) => flattenNested(item)),
        ...data.matched_data_alt_not_e.map((item) => flattenNested(item)),
      ];

      wb.Sheets['Combined Data'] = XLSX.utils.json_to_sheet(combinedData);

      XLSX.writeFile(wb, 'matched_data.xlsx');
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  const handleGetMatchedData = async () => {
    try {
      const response = await fetch('http://10.11.30.239:5000/get_matched_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end, chromosome, duplication_deletion: duplicationDeletion }),
      });

      const data = await response.json();
      setServerResponse({
        total_match: data.length,
        matched_data_alt_e: [],
        matched_data_alt_not_e: data,
      });

      // Scroll to the top when there is a new data response
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error:', error.message);
      setServerResponse({});
    }
  };

  return (
    <div className="App">
      <h1>Genetics Data Query</h1>
      <form onSubmit={handleSubmit} className="form-container">
        <label>
          Start Position:
          <input type="text" value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>

        <label>
          End Position:
          <input type="text" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </label>

        <label>
          Chromosome:
          <input type="text" value={chromosome} onChange={(e) => setChromosome(e.target.value)} required />
        </label>

        <label>
          Duplication/Deletion:
          <input type="text" value={duplicationDeletion} onChange={(e) => setDuplicationDeletion(e.target.value)} />
        </label>
        <button type="submit">Submit</button>
      </form>

      {/* Display table if there is a server response */}
      {Object.keys(serverResponse).length > 0 && (
        <div className="response-container">
          <h2>Total Match Found: {serverResponse.total_match}</h2>
          <div className="table-container horizontal-scroll">
            {serverResponse.matched_data_alt_e.length > 0 &&
              renderTable(serverResponse.matched_data_alt_e)}

            {serverResponse.matched_data_alt_not_e.length > 0 &&
              renderTable(serverResponse.matched_data_alt_not_e)}
          </div>

          {/* Add download button/icon... */}
          <button className="download-button" onClick={handleDownload}>
            Download Excel
          </button>

          {/* Add a button to generate graph */}
          <button className="generate-graph-button" onClick={handleGenerateGraph}>
            View Graph
          </button>

          {/* Add pagination controls... */}

          {/* New button to get matched data */}
          <button className="get-matched-data-button" onClick={handleGetMatchedData}>
            Get All
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <img src={graphUrl} alt="Graph" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckOverlappingRegions;
