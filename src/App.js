import React, { Component } from 'react';
import EditPane from './EditPane.js';
import TreePane from './TreePane.js';
import './App.css';
const testfile = '/Users/alexanderzhang/Documents/electron-test.txt';
const testdir = '/Users/alexanderzhang/Documents/js/learnyounode';
const dialog = window.require('electron').remote.dialog;

class App extends Component {
  constructor() {
      super();
      this.state = {
          file: testfile,
		  dir: testdir
      };
  }

  handleFileChange = path => {
      this.setState({
          file: path
      });
  }

  handleDirChange = () => {
      let newDir = dialog.showOpenDialog({
          properties: ['openDirectory']
      })[0];
      this.setState({
          dir: newDir
      });
  }

  render() {
    return (
      <div className="App">
        <div className="col-left">
          <h1 className="branding">ASTRONOTE</h1>
          <button className="file-button" onClick={ this.handleDirChange }>Open Directory</button>
          <div className="treepane">
		    <TreePane dir={ this.state.dir } changeFile={ this.handleFileChange }/>
          </div>
        </div>
        <div className="col-right">
          <EditPane filepath={ this.state.file }/>
        </div>
      </div>
    );
  }
}

export default App;
