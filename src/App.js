import React, { Component } from 'react';
import EditPane from './EditPane.js';
import TreePane from './TreePane.js';
const settings = window.require('electron-settings');
const fs = window.require('fs');
const {ipcRenderer} = window.require('electron');
const {dialog} = window.require('electron').remote;
import './App.css';
const helpfile = '/Users/alexanderzhang/Documents/astronote/src/help.txt';

class App extends Component {
  constructor() {
      super();
      let newDir = settings.has('lastDir') ? settings.get('lastDir') : this.askDir() 
      this.state = {
          file: fs.existsSync(newDir+'/index.md') ? newDir+'/index.md' : helpfile,
          dir: newDir
      };
  }

  componentDidMount() {
      ipcRenderer.on('astronote-msg', (event, arg) => {
          if (arg === 'open_dir') { this.handleDirChange(); }
          else { console.log(arg) }
      });
  }

  askDir = () => {
      let dir = dialog.showOpenDialog({
          properties: ['openDirectory'],
          filters: '*.astro'
      })[0];
      settings.set('lastDir', dir);
      return dir;
  }

  handleFileChange = path => {
      this.setState({
          file: path
      });
  }

  handleDirChange = () => {
      let newDir = this.askDir();
      this.setState({
          file: fs.existsSync(newDir+'/index.md') ? newDir+'/index.md' : helpfile,
          dir: newDir
      });
  }

  render() {
    return (
      <div className="App">
        <div className="col-left">
          <h1 className="branding">ASTRONOTE</h1>
          <div className="treepane">
		    <TreePane dir={ this.state.dir } changeFile={ this.handleFileChange }/>
          </div>
        </div>
        <div className="col-right">
          <EditPane filepath={ this.state.file } cacheDir={ this.state.dir+'/_cache' }/>
        </div>
      </div>
    );
  }
}

export default App;
