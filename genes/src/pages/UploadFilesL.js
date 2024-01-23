import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [files, setFiles] = useState([]);
  const [collectionName, setCollectionName] = useState('');
  const [viewCollectionData, setViewCollectionData] = useState([]);
  const [collections, setCollections] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showCollections, setShowCollections] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  const handleFileChange = (event) => {
    setFiles(event.target.files);
  };

  const handleUpload = () => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    axios.post('http://localhost:5000/upload_loh_data', formData)
      .then(response => {
        console.log(response.data);
        setUploadMessage('Files uploaded successfully!');
        setFiles([]); // Clear the selected files
        // Add any additional logic or UI updates here
      })
      .catch(error => {
        console.error(error);
        // Handle error
      });
  };

  const handleViewCollections = () => {
    if (showCollections) {
      setViewCollectionData([]);
      setSelectedCollection('');
    } else {
      axios.get('http://localhost:5000/get_collectionsLOH')
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
    axios.post('http://localhost:5000/delete_collection', { collection_name: selectedCollection })
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
    axios.get('http://localhost:5000/get_collectionsLOH')
      .then(response => {
        console.log(response.data);
        setCollections(response.data.collections || []);
      })
      .catch(error => {
        console.error(error);
        // Handle error
      });
  }, [showCollections]); // Fetch collections when showCollections state changes

  return (
    <div className="App">
      <h1>MongoDB React App</h1>
      <div>
        <label>Select LOH Files:</label>
        <input type="file" multiple onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload Data</button>
        {uploadMessage && <p>{uploadMessage}</p>}
      </div>
      <div>
        <label>View Collections:</label>
        <button onClick={handleViewCollections}>Toggle Collections</button>
        {showCollections && (
          <div>
            <ul>
              {collections.map((collection, index) => (
                <li key={index} onClick={() => handleSelectCollection(collection)}>
                  {collection}
                </li>
              ))}
            </ul>
            {selectedCollection && (
              <div>
                <p>Selected Collection: {selectedCollection}</p>
                <button onClick={handleDeleteCollection}>Delete Collection</button>
                {deleteConfirmation && (
                  <div>
                    <p>Are you sure you want to delete the collection "{selectedCollection}"?</p>
                    <button onClick={handleConfirmDelete}>Yes</button>
                    <button onClick={() => setDeleteConfirmation(false)}>No</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;