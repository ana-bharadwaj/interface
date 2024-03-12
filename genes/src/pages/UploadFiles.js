import axios from 'axios';
import React, { useEffect, useState } from 'react';
import './UploadFiles.css';

const CollectionList = () => {
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [showCollections, setShowCollections] = useState(false);
    const [showAddFileModal, setShowAddFileModal] = useState(false);
    const [fileInput, setFileInput] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25; // Changed for demonstration, you can set it to 50 for your actual use case

    useEffect(() => {
        getCollections();
    }, []);

    const getCollections = () => {
        axios.get('http://10.11.30.239:5000/get_collections')
            .then(response => setCollections(response.data.collections))
            .catch(error => console.error('Error fetching collections:', error));
    };

    const handleViewCollections = () => {
        if (!showCollections) {
            getCollections();
        }
        setSelectedCollection(null);
        setShowCollections(prevState => !prevState);
    };

    const handleDeleteCollection = () => {
        if (selectedCollection) {
            setDeleteConfirmation(true);
        }
    };

    const confirmDelete = () => {
        axios.post('http://10.11.30.239:5000/drop_collection', { collection: selectedCollection })
            .then(response => {
                console.log(response.data);
                getCollections();
                setSelectedCollection(null);
                setDeleteConfirmation(false);
            })
            .catch(error => {
                console.error('Error deleting collection:', error);
                setDeleteConfirmation(false);
            });
    };

    const cancelDelete = () => {
        setDeleteConfirmation(false);
    };

    const handleAddFile = () => {
        document.getElementById('fileInput').click();
    };

    const handleFileInputChange = (event) => {
        setFileInput(event.target.files);
        setShowAddFileModal(true);
        setErrorMessage('');
    };

    const handleAddFileSubmit = () => {
        if (!fileInput || fileInput.length === 0) {
            setErrorMessage('Error: No file chosen.');
            return;
        }

        setUploading(true);
        setErrorMessage('');

        const formData = new FormData();
        let invalidFiles = false;
        for (let i = 0; i < fileInput.length; i++) {
            const file = fileInput[i];


            // Extracting sample name from file name without extension
            const sampleName = file.name.replace(/\.[^/.]+$/, "");

            // Appending sampleName to formData instead of file
            formData.append('sampleNames', sampleName);
            formData.append('files', file);
        }

        if (invalidFiles) {
            setUploading(false);
            return;
        }

        axios.post('http://10.11.30.239:5000/add_file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        .then(response => {
            console.log(response.data);
            setUploading(false);
            setShowAddFileModal(false);
            setFileInput(null);
            getCollections();
            alert("Upload successful!");
        })
        .catch(error => {
            console.error('Error adding files:', error);
            setUploading(false);
            setErrorMessage('Error uploading files. Please try again.');
        });
    };

    const handleNextPage = () => {
        setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        setCurrentPage(currentPage - 1);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCollections = collections.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div>
            <h1>Database Collections</h1>

            <button onClick={handleDeleteCollection} disabled={!selectedCollection}>
                Delete Selected Collection
            </button>

            <button onClick={handleViewCollections}>
                {showCollections ? 'Hide Collections' : 'View Collections'}
            </button>

            {deleteConfirmation && (
                <div>
                    <p>Are you sure you want to delete the collection "{selectedCollection}"?</p>
                    <button onClick={confirmDelete}>Yes</button>
                    <button onClick={cancelDelete}>No</button>
                </div>
            )}

            <button onClick={handleAddFile}>Add File</button>

            <input
                id="fileInput"
                type="file"
                onChange={handleFileInputChange}
                multiple
                style={{ display: 'none' }}
            />

            {showAddFileModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowAddFileModal(false)}>&times;</span>
                        <h2>Add File to Database</h2>
                        <p>Selected Files: {fileInput && fileInput.length}</p>
                        {uploading && <p>Uploading files...</p>}
                        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                        <button onClick={handleAddFileSubmit}>Submit</button>
                        <button onClick={() => setShowAddFileModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {showCollections && (
                <table>
                    <thead>
                        <tr>
                            <th>Collection Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentCollections.map((collection, index) => {
                            // Splitting the collection path by '/' and taking the last part as the sample name
                            const sampleName = collection.split('/').pop();

                            return (
                                <tr key={collection}>
                                    <td
                                        onClick={() => setSelectedCollection(collection)}
                                        className={`collection-box-item ${collection === selectedCollection ? 'selected' : ''}`}
                                        >
                                        {sampleName}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {collections.length > itemsPerPage && (
                <div>
                    <p>
                        Showing {indexOfFirstItem + 1}-
                        {indexOfLastItem > collections.length ? collections.length : indexOfLastItem} of {collections.length} collections
                    </p>
                    <div className="pagination-buttons">
                        <button onClick={handlePrevPage} disabled={currentPage === 1}>Prev</button>
                        <button onClick={handleNextPage} disabled={indexOfLastItem >= collections.length}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollectionList;
