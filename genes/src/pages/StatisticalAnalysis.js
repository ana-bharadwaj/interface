import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import BarGraph from './BarGraph'; // Assuming BarGraph.js is in the same directory
import './StatisticalAnalysis.css';

function App() {
  // State for the first set of input fields, button, count, and scrollable box
  const [min1, setMin1] = useState('-10');
  const [max1, setMax1] = useState('10');
  const [count1, setCount1] = useState(null);
  const [collectionsWithData1, setCollectionsWithData1] = useState([]);

  // State for the second set of input fields, button, count, and scrollable box
  const [min2, setMin2] = useState('-50000');
  const [max2, setMax2] = useState('50000');
  const [count2, setCount2] = useState(null);
  const [collectionsWithData2, setCollectionsWithData2] = useState([]);

  // State for collection count, selected collection, and collection names
  const [collectionCount, setCollectionCount] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [collectionNames, setCollectionNames] = useState([]);

  // Fetch collection count and names when the component mounts
  useEffect(() => {
    fetchCollectionCount();
    fetchCollectionNames();
  }, []);

  const handleAdjust1 = async () => {
    try {
      const response = await fetch('http://10.11.30.239:5000/adjust_values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ min: parseFloat(min1), max: parseFloat(max1) })
      });
      const data = await response.json();
      setCount1(data.count);
      setCollectionsWithData1(data.collections_with_data);
    } catch (error) {
      console.error('Error adjusting values:', error);
    }
  };

  const handleAdjust2 = async () => {
    try {
      const response = await fetch('http://10.11.30.239:5000/adjust_span', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ min: parseFloat(min2), max: parseFloat(max2) })
      });
      const data = await response.json();
      setCount2(data.countspan);
      setCollectionsWithData2(data.collections_with_data_span);
    } catch (error) {
      console.error('Error adjusting values:', error);
    }
  };

  const fetchDataForExcel = async () => {
    try {
      const response = await fetch('http://10.11.30.239:5000/get_data_for_excel');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data for Excel:', error);
    }
  };

  const handleExportToExcel = async () => {
    const dataForExcel = await fetchDataForExcel();
    if (dataForExcel) {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Collections");
      XLSX.writeFile(workbook, "collections.xlsx");
    }
  };

  const fetchCollectionCount = async () => {
    try {
      const response = await fetch('http://10.11.30.239:5000/count_collections');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setCollectionCount(data.count);
    } catch (error) {
      console.error('Error fetching collection count:', error);
    }
  };

  const fetchCollectionNames = async () => {
    try {
      const response = await fetch('http://10.11.30.239:5000/list_collections');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setCollectionNames(data.collections);
    } catch (error) {
      console.error('Error fetching collection names:', error);
    }
  };

  return (
    <div className="app-container">
      {/* Heading */}
      <h1 className="heading">Statistical Analysis</h1>
      <div className="count-container">
        <p>Number of collections in MongoDB: {collectionCount}</p>
        <button onClick={handleExportToExcel}>Export to Excel</button>

      </div>

      {/* Select Collection */}
      <div className="select-collection">
        <h2>Select Collection</h2>
        <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)}>
          <option value="All">All</option>
          {collectionNames.map(collection => (
            <option key={collection} value={collection}>{collection}</option>
          ))}
        </select>
      </div>

      {/* Graph container */}
      <div className="graph-container">
        <BarGraph selectedCollection={selectedCollection} />
      </div>

      {/* Content container */}
      <div  styleclassName="content-container">
        {/* First set of input fields, button, count, and scrollable box */}
        <div>
          <label>
            Min Z Score:
            <input type="text" value={min1} onChange={(e) => setMin1(e.target.value)} />
          </label>
          <label>
            Max Z Score:
            <input type="text" value={max1} onChange={(e) => setMax1(e.target.value)} />
          </label>
          <button onClick={handleAdjust1}>Adjust 1</button>
          {/* Button to export to Excel */}
          {count1 !== null && (
            <div>
              <p>Total collections 1: {count1}</p>
              <div className="scrollable-box">
                <ul>
                  {collectionsWithData1.map((collection, index) => (
                    <li key={index}>{collection}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Second set of input fields, button, count, and scrollable box */}
        <div>
          <label>
            Minimum Span Length:
            <input type="text" value={min2} onChange={(e) => setMin2(e.target.value)} />
          </label>
          <label>
            Maximum Span Length:
            <input type="text" value={max2} onChange={(e) => setMax2(e.target.value)} />
          </label>
          <button onClick={handleAdjust2}>Adjust 2</button>
          {count2 !== null && (
            <div>
              <p>Total collections 2: {count2}</p>
              <div className="scrollable-box">
                <ul>
                  {collectionsWithData2.map((collection, index) => (
                    <li key={index}>{collection}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collection count */}

    </div>
  );
                  }

export default App;
