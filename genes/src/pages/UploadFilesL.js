import axios from 'axios';
import React, { useEffect, useState } from 'react';


function App() {
  const [files, setFiles] = useState([]);
  const [collectionName, setCollectionName] = useState('');
  const [viewCollectionData, setViewCollectionData] = useState([]);
  const [collections, setCollections] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showCollections, setShowCollections] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [collectionsPerPage] = useState(25);

  const handleFileChange = (event) => {
    setFiles(event.target.files);
    setUploadMessage(''); // Clear upload message when files are selected
  };

  const handleUpload = () => {
    if (files.length === 0) {
      setUploadMessage('No files selected.'); // Set message when no files are selected
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setUploadMessage('Uploading files to database...'); // Set uploading message

    axios.post('http://10.11.30.239:5000/upload_loh_data', formData)
      .then(response => {
        console.log(response.data);
        setUploadMessage('Files uploaded successfully!'); // Set success message
        setFiles([]); // Clear the selected files
        // Add any additional logic or UI updates here
      })
      .catch(error => {
        console.error(error);
        setUploadMessage('Failed to upload files.'); // Set error message
        // Handle error
      });
  };

  const handleViewCollections = () => {
    if (showCollections) {
      setViewCollectionData([]);
      setSelectedCollection('');
    } else {
      axios.get('http://10.11.30.239:5000/get_collectionsLOH')
        .then(response => {
          console.log(response.data);
          setViewCollectionData(response.data.collections || []);
        })
        .catch(error => {
          console.error(error);
          // Handle error
        });
    }
    setShowCollections(!showCollections);
  };

  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
  };

  const handleDeleteCollection = () => {
    setDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    axios.post('http://10.11.30.239:5000/delete_collection', { collection_name: selectedCollection })
      .then(response => {
        console.log(response.data);
        setDeleteConfirmation(false);
        // Add any additional logic or UI updates here
      })
      .catch(error => {
        console.error(error);
        // Handle error
      });
  };

  useEffect(() => {
    axios.get('http://10.11.30.239:5000/get_collectionsLOH')
      .then(response => {
        console.log(response.data);
        setCollections(response.data.collections || []);
      })
      .catch(error => {
        console.error(error);
        // Handle error
      });
  }, [showCollections]); // Fetch collections when showCollections state changes

  // Pagination
  const indexOfLastCollection = currentPage * collectionsPerPage;
  const indexOfFirstCollection = indexOfLastCollection - collectionsPerPage;
  const currentCollections = collections.slice(indexOfFirstCollection, indexOfLastCollection);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalCollections = collections.length;
  const maxRange = Math.min(indexOfLastCollection, totalCollections);
  const minRange = Math.min(indexOfFirstCollection + 1, totalCollections);

  return (
    <div className="App">
      <h1>MongoDB React App</h1>
      <div>
        <label>Select LOH Files:</label>
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload Data</button>
        {uploadMessage && <p>{uploadMessage}</p>}
      </div>
      <div className="top-buttons">
        <button onClick={handleViewCollections}>Toggle Collections</button>
        {showCollections && (
          <button onClick={handleDeleteCollection} className="delete-button">Delete Collection</button>
        )}
      </div>
      {selectedCollection && deleteConfirmation && (
        <div>
          <p>Selected Collection: {selectedCollection}</p>
          <div>
            <p>Are you sure you want to delete the collection "{selectedCollection}"?</p>
            <button onClick={handleConfirmDelete}>Yes</button>
            <button onClick={() => setDeleteConfirmation(false)}>No</button>
          </div>
        </div>
      )}
      {showCollections && (
        <div className="collections-box">
          <table className="collections-table">
            <thead>
              <tr>
                <th>Collection Name</th>
              </tr>
            </thead>
            <tbody>
              {currentCollections.map((collection, index) => (
                <tr key={index} onClick={() => handleSelectCollection(collection)}>
                  <td>{collection}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
            <span>{` ${minRange}-${maxRange} of ${totalCollections}`}</span>
            <button onClick={() => paginate(currentPage + 1)} disabled={indexOfLastCollection >= totalCollections}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
