import React, { Component } from 'react';
import EditPane from './EditPane.js';
import TreePane from './TreePane.js';
import SearchField from './SearchField.js';
import SplitPane from 'react-split-pane';
import './App.css';

const fs = window.require('fs-extra');
const path = window.require('path');
const settings = window.require('electron-settings');
const electron = window.require('electron');
const ipcRenderer = electron.ipcRenderer;
const {dialog, app} = electron.remote;

const helpfile = path.join(app.getAppPath(), 'build', 'help.md');
const blankdir = path.join(app.getAppPath(), 'build', 'notebook.astro'); 
// just remember to rebuild after making any changes to these

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
          else if (arg === 'new_dir') { this.handleNewDir(); }
          else { console.log(arg) }
      });
  }

  askDir = () => {
      let dir = dialog.showOpenDialog({
          properties: ['openDirectory'],
      });
      dir = dir ? dir[0] : settings.get('lastDir');
      settings.set('lastDir', dir);
      return dir;
  }

  handleNewDir = () => {
      let dir = dialog.showOpenDialog({
          properties: ['openDirectory'],
      })[0];
      fs.copySync(blankdir, path.join(dir,'notebook.astro'), {overwrite:false});
      this.setState({
          file: path.join(dir,'notebook.astro','index.md'),
          dir: path.join(dir,'notebook.astro')
      });
  }

  cacheDir = () => {
      const walkBack = window.require('walk-back');
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
      <SplitPane className="App" primary="second" defaultSize="78%" minSize="0">
        <div>
          <h1 className="branding">ASTRONOTE</h1>
          <TreePane dir={ this.state.dir } changeFile={ this.handleFileChange }/>
        </div>
        <div>
          <SearchField getName={ this.nameFromPath } dir={ this.state.dir} changeFile={ this.handleFileChange }/>
          <EditPane name={ this.nameFromPath(this.state.file) } filepath={ this.state.file } cacheDir={ this.cacheDir() }/>
        </div>
      </SplitPane>
    );
  }
}

export default App;
