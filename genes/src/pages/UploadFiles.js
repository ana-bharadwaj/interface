import React, { useState } from 'react';
import axios from 'axios';
import './UploadFiles.css';


const CollectionList = () => {
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [showCollections, setShowCollections] = useState(false);
    const [showAddFileModal, setShowAddFileModal] = useState(false);
    const [fileInput, setFileInput] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(false);

    const getCollections = () => {
        axios.get('http://localhost:5000/get_collections')
            .then(response => setCollections(response.data.collections))
            .catch(error => console.error('Error fetching collections:', error));
    };

    const handleViewCollections = () => {
        if (!showCollections) {
            getCollections();
        }
        setSelectedCollection(null); // Reset selected collection
        setShowCollections(prevState => !prevState);
    };

    const handleDeleteCollection = () => {
        if (selectedCollection) {
            // Show a confirmation message before deleting
            setDeleteConfirmation(true);
        }
    };

    const confirmDelete = () => {
        // User confirmed deletion
        axios.post('http://localhost:5000/drop_collection', { collection: selectedCollection })
            .then(response => {
                console.log(response.data);
                getCollections(); // Refresh the collections after deleting
                setSelectedCollection(null); // Reset selected collection after deletion
                setDeleteConfirmation(false);
            })
            .catch(error => {
                console.error('Error deleting collection:', error);
                setDeleteConfirmation(false);
            });
    };

    const cancelDelete = () => {
        // User canceled deletion
        setDeleteConfirmation(false);
    };

    const handleAddFile = () => {
        // Trigger file input when the button is clicked
        document.getElementById('fileInput').click();
    };

    const handleFileInputChange = (event) => {
        // Handle the selected files
        setFileInput(event.target.files);
        setShowAddFileModal(true);
    };

    const handleAddFileSubmit = () => {
        if (fileInput) {
            const formData = new FormData();
            for (let i = 0; i < fileInput.length; i++) {
                formData.append('files', fileInput[i]);
            }

            axios.post('http://localhost:5000/add_file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
                .then(response => {
                    console.log(response.data);
                    setShowAddFileModal(false);
                    setFileInput(null);
                    getCollections(); // Refresh the collections after adding files
                })
                .catch(error => console.error('Error adding files:', error));
        } else {
            console.error('No files selected.');
        }
    };

    return (
        <div>
            <h1>Database Collections</h1>
            <button onClick={handleViewCollections}>
                {showCollections ? 'Hide Collections' : 'View Collections'}
            </button>
            <button onClick={handleDeleteCollection} disabled={!selectedCollection}>
                Delete Selected Collection
            </button>
            {deleteConfirmation && (
                <div>
                    <p>Are you sure you want to delete the collection "{selectedCollection}"?</p>
                    <button onClick={confirmDelete}>Yes</button>
                    <button onClick={cancelDelete}>No</button>
                </div>
            )}
            <button onClick={handleAddFile}>Add File</button>

            {/* Hidden file input triggered by the Add File button */}
            <input
                id="fileInput"
                type="file"
                onChange={handleFileInputChange}
                multiple
                webkitdirectory=""
                mozdirectory=""
                style={{ display: 'none' }}
            />

            {/* Add File Modal */}
            {showAddFileModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowAddFileModal(false)}>&times;</span>
                        <h2>Add File to Database</h2>
                        <p>Selected Files: {fileInput && fileInput.length}</p>
                        <button onClick={handleAddFileSubmit}>Submit</button>
                        <button onClick={() => setShowAddFileModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Collections List */}
            {showCollections && (
                <ul>
                    {collections.map(collection => (
                        <li
                            key={collection}
                            onClick={() => setSelectedCollection(collection)}
                            style={{ backgroundColor: selectedCollection === collection ? 'yellow' : 'transparent' }}
                        >
                            {collection}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CollectionList;