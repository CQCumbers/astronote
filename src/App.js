import React, { Component } from 'react';
import EditPane from './EditPane.js';
import TreePane from './TreePane.js';
import './App.css';
const dialog = window.require('electron').remote.dialog;

class App extends Component {
  constructor() {
      super();
      this.state = {
          file: '/Users/alexanderzhang/Documents/astronote/src/help.txt',
		  //dir: dialog.showOpenDialog({
          //    properties: ['openDirectory']
          //})[0]
          dir: '/Users/alexanderzhang/Documents/js/javascripting'
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
          <EditPane filepath={ this.state.file } cacheDir={ '/Users/alexanderzhang/Documents/testcache' }/>
        </div>
      </div>
    );
  }
}

export default App;
