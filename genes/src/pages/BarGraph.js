import Chart from 'chart.js/auto';
import React, { useEffect, useRef, useState } from 'react';

function BarGraph({ selectedCollection }) {
  const [delCount, setDelCount] = useState(0);
  const [dupCount, setDupCount] = useState(0);
  const [vusCount, setVusCount] = useState(0);
  const [benignCount, setBenignCount] = useState(0);
  const [likelyBenignCount, setLikelyBenignCount] = useState(0);
  const [likelyPathogenic,setLikelyPathogenic] =useState(0);
  const [pathogenic,setPathogenic]=useState(0);
  const chartRefDelDup = useRef(null);
  const chartRefClassification = useRef(null);

  useEffect(() => {
    fetchData();
  }, [selectedCollection]);

  useEffect(() => {
    if (chartRefDelDup.current) {
      updateChartDelDup();
    } else {
      createChartDelDup();
    }
  }, [delCount, dupCount]);

  useEffect(() => {
    if (chartRefClassification.current) {
      updateChartClassification();
    } else {
      createChartClassification();
    }
  }, [vusCount, benignCount, likelyBenignCount]);

  const fetchData = async () => {
    try {
      const responseDelDup = await fetch(`http://10.11.30.239:5000/count_del_dup?collection=${selectedCollection}`);
      const responseClassification = await fetch(`http://10.11.30.239:5000/count_classification?collection=${selectedCollection}`);
      if (!responseDelDup.ok || !responseClassification.ok) {
        throw new Error('Network response was not ok');
      }
      const dataDelDup = await responseDelDup.json();
      const dataClassification = await responseClassification.json();
      setDelCount(dataDelDup.delCount);
      setDupCount(dataDelDup.dupCount);
      setVusCount(dataClassification.vusCount);
      setBenignCount(dataClassification.benignCount);
      setLikelyBenignCount(dataClassification.likelyBenignCount);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const createChartDelDup = () => {
    const ctx = document.getElementById('barGraphDelDup');
    if (ctx) {
      chartRefDelDup.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['DEL', 'DUP'],
          datasets: [{
            label: 'Count',
            data: [delCount, dupCount],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  };

  const updateChartDelDup = () => {
    chartRefDelDup.current.data.datasets[0].data = [delCount, dupCount];
    chartRefDelDup.current.update();
  };

  const createChartClassification = () => {
    const ctx = document.getElementById('barGraphClassification');
    if (ctx) {
      chartRefClassification.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['VUS', 'Benign', 'Likely Benign', 'Likely Pathogenic','Pathogenic'],
          datasets: [{
            label: 'Count',
            data: [vusCount, benignCount, likelyBenignCount , likelyPathogenic,pathogenic],
            backgroundColor: [
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
            ],
            borderColor: [
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  };

  const updateChartClassification = () => {
    chartRefClassification.current.data.datasets[0].data = [vusCount, benignCount, likelyBenignCount,likelyPathogenic,pathogenic];
    chartRefClassification.current.update();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
  <div style={{marginLeft:'40%'}}>
    <h2>DEL and DUP Count</h2>
    <canvas id="barGraphDelDup" width="400" height="200"></canvas>
  </div>
  <div style={{ marginLeft: '80px' }}>
    <h2>Classification Count</h2>
    <canvas id="barGraphClassification" width="400" height="200"></canvas>
  </div>
</div>


  );
}

export default BarGraph;
