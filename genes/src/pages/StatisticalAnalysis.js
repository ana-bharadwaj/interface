import React, { Component } from 'react';
import igv from 'https://cdn.jsdelivr.net/npm/igv@2.10.5/dist/igv.esm.min.js';

const igvStyle = {
  fontFamily: 'open sans,helveticaneue,helvetica neue,Helvetica,Arial,sans-serif',
  paddingTop: '60px',
  margin: '5px'
};

class App extends Component {
  render() {
    return (
      <div className="App">
        {/* Render AppIgv component only once */}
        <AppIgv />
      </div>
    );
  }
}

class AppIgv extends Component {
  constructor(props) {
    super(props);
    this.igvBrowser = null;
  }

  componentDidMount() {
    // Ensure that this code is executed only once
    if (!this.igvBrowser) {
      const igvContainer = document.getElementById('igv-div');
      const igvOptions = {
        locus: 'chr22',
        genome: 'hg38',
        tracks: [
          {
            url: 'https://s3.amazonaws.com/igv.org.demo/nstd186.GRCh38.variant_call.vcf.gz',
            indexURL: 'https://s3.amazonaws.com/igv.org.demo/nstd186.GRCh38.variant_call.vcf.gz.tbi',
            name: 'Color by REGIONID',
            colorBy: 'REGIONID',
            visibilityWindow: -1
          }
        ]
      };

      // Store the IGV browser instance in the component's state
      this.igvBrowser = igv.createBrowser(igvContainer, igvOptions);
    }
  }

  render() {
    return <div id="igv-div" style={igvStyle}></div>;
  }
}

export default App;
