import React, { Component } from 'react';
import EditPane from './EditPane.js';
import TreePane from './TreePane.js';
import SearchField from './SearchField.js';
import './App.css';

const fs = window.require('fs');
const path = window.require('path');
const settings = window.require('electron-settings');
const walkBack = window.require('walk-back');
const {ipcRenderer} = window.require('electron');
const {dialog, app} = window.require('electron').remote;

const helpfile = path.join(app.getAppPath(),'public','help.md');

class App extends Component {
  constructor() {
      super();
      let newDir = settings.has('lastDir') ? settings.get('lastDir') : this.askDir() 
      this.state = {
          file: fs.existsSync(path.join(newDir,'index.md')) ? path.join(newDir,'index.md') : helpfile,
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
      })[0];
      settings.set('lastDir', dir);
      return dir;
  }

  cacheDir = () => {
      let prevCache = walkBack(path.join(this.state.file,'..'), '_cache');
      if (prevCache && prevCache.startsWith(this.state.dir)) {
          return prevCache;
      } else {
          return path.join(this.state.dir,'_cache');
      }
  }

  handleFileChange = newPath => {
      this.setState({
          file: fs.existsSync(path.join(newPath,'index.md')) ? path.join(newPath,'index.md') : newPath
      });
  }

  handleDirChange = () => {
      let newDir = this.askDir();
      this.setState({
          file: fs.existsSync(path.join(newDir,'index.md')) ? path.join(newDir,'index.md') : helpfile,
          dir: newDir
      });
  }

  nameFromPath = (filepath) => {
      let name = filepath.split(path.sep).pop();
      if (name === 'index.md') {
          name = filepath.slice(0,filepath.length-'index.md'.length-path.sep.length).split(path.sep).pop();
      }
      return name
  }

  render() {
    return (
      <div className="App">
        <div className="col-left">
          <h1 className="branding">ASTRONOTE</h1>
          <TreePane dir={ this.state.dir } changeFile={ this.handleFileChange }/>
        </div>
        <div className="col-right">
          <SearchField getName={ this.nameFromPath } dir={ this.state.dir} changeFile={ this.handleFileChange }/>
          <EditPane name={ this.nameFromPath(this.state.file) } filepath={ this.state.file } cacheDir={ this.cacheDir() }/>
        </div>
      </div>
    );
  }
}

export default App;
