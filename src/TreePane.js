import React, { Component } from 'react';
import Tree from 'jab-react-tree';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import './react-contextmenu.css';
import 'react-ui-tree/dist/react-ui-tree.css';
import cx from 'classnames';
import './TreePane.css';

const fs = window.require('fs-extra');
const mv = window.require('mv');
const _path  = window.require('path');
 
class TreePane extends Component {
    constructor(props) {
        super(props);
        let filetree = this.pruneTree(this.props.dir); 
        this.state = {
            tree: filetree,
            dragged: null,
            active: null,
            isRenaming: false
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.tree.path !== nextProps.dir) {
            this.updateTree(nextProps.dir);
        }
    }

    updateTree = (newDir) => {
        let filetree = this.pruneTree(newDir); 
        this.setState({
            tree: filetree,
            dragged: null,
            active: null,
            isRenaming: false
        });
    }

    pruneTree = (newDir) => {
        const dirTree = window.require('directory-tree');
        let filetree = dirTree(newDir,{exclude:/([/\\]\.)|(.astro[/\\]_cache)|([/\\]index.md)/});
        this.prune(filetree);
        filetree = dirTree(newDir,{exclude:/([/\\]\.)|(.astro[/\\]_cache)|([/\\]index.md)/});
        this.setCollapse(filetree,false);
        return filetree;
    }

    prune = (o) => {
        for (let i in o) {
            if (!!o[i] && Array.isArray(o[i])) {
                if (o[i].length >= 1) {
                    for (let j in o[i]) {
                        if (!!o[i][j] && typeof(o[i][j]) === 'object') {
                            this.prune(o[i][j]);
                        }
                    }
                } else if (fs.lstatSync(o.path).isDirectory()) {
                    console.log('leaf directory at '+o.path);
                    if (!o.path.endsWith('.astro') && fs.readdirSync(o.path).indexOf('index.md') >= 0) { // turn folders into files
                        fs.moveSync(_path.join(o.path,'index.md'), o.path+'_temp', {overwrite:false});
                        fs.removeSync(o.path);
                        fs.moveSync(o.path+'_temp', o.path.endsWith('.md') ? o.path : o.path+'.md', {overwrite:false});
                    }
                }
            }
        }
    }

    setCollapse = (o,collapse=false) => {
        for (let i in o) {
            if (!!o[i] && Array.isArray(o[i])) {
                o.collapsed = collapse;
                if (o[i].length >= 1) {
                    for (let j in o[i]) {
                        if (!!o[i][j] && typeof(o[i][j]) === 'object') {
                            this.setCollapse(o[i][j]);
                        }
                    }
                }
            }
        }
    }

    locate = (o,node) => {
        if (o.path === node.path) {
            return node.name;
        }
        for (let i in o) {
            if (!!o[i] && Array.isArray(o[i]) && o[i].length >= 1) {
                for (let j in o[i]) {
                    if (!!o[i][j] && typeof(o[i][j]) === 'object') {
                        let newPath = this.locate(o[i][j],node);
                        if (newPath) { if (newPath === node.name) { return _path.join(o.path,newPath) } else { return newPath } }
                    }
                }
            }
        }
        return false;
    }

	renderNode = node => {
      let active = node && this.state.active && node.path === this.state.active.path;
      let nameComponent = this.state.isRenaming && active ? (
          <input autoFocus 
              className="noteNameField"
              value={this.state.active.name}
              onChange={ (evt) => {this.handleRename(this.state.active,evt.target.value)} }
              onBlur={ (evt) => {this.renameNote(this.state.active)} }
          />
          ) : ( node.name )
	  return (
        <div>
          <ContextMenuTrigger
          id="treepane-menu"
          collect={x=>node}>
            <span className={cx('node', {'is-active': active})} 
              onClick={this.onClickNode.bind(null, node)} onContextMenu={this.onClickNode.bind(null, node)}>
              { nameComponent }
            </span>
          </ContextMenuTrigger>
        </div>
      );
    }

    onClickNode = node => {
      this.props.changeFile(node.path);
      this.setState({
        active: node
      });
    }

    handleDrag = dragNode => {
      if (dragNode) {
          this.setState({
            dragged: dragNode.node
          });
      }
    }

    handleChange = newTree => {
      if (newTree && newTree !== this.state.tree && this.state.dragged && this.state.dragged.path !== this.state.tree.path) {
        let newPath = this.locate(newTree,this.state.dragged)
        if (newPath !== this.state.dragged.path) {
            let update = () => {
                this.setState({tree:newTree});
                this.updateTree(this.props.dir);
            }

            let move = () => {
                mv(this.state.dragged.path,
                    newPath,
                    {mkdirp:true,clobber:false},
                    (err)=>{ if (err) { return console.log(err) } update(); }
                );
            }
            
            let parentPath = _path.dirname(newPath);
            if (fs.existsSync(parentPath) && fs.lstatSync(parentPath).isFile()) { // turn files into folders
                mv(parentPath,parentPath+'_temp',{clobber:false},(err)=>{
                    if (err) { return console.log(err) }
                    mv(parentPath+'_temp',
                        _path.join(parentPath,'index.'+parentPath.split('.').pop()),
                        {mkdirp:true,clobber:false},
                        (err)=>{ if (err) { return console.log(err) } move(); }
                    );
                });
            } else {
                move();
            }
        }
      }
    }

    addNote = supernote => {
        let add = () => {
            let filepath = _path.join(supernote.path,'Untitled');
            let count = 1;
            while (fs.existsSync(filepath+count+'.md')) {
                count++;
            }
            fs.openSync(filepath+count+'.md', 'a');
            this.updateTree(this.props.dir);
            this.setState({active:supernote});
        }

        if (fs.lstatSync(supernote.path).isFile()) {
            mv(supernote.path,supernote.path+'_temp',{clobber:false},(err)=>{
                if (err) { return console.log(err) }
                mv(supernote.path+'_temp',
                    _path.join(supernote.path,'index.'+supernote.path.split('.').pop()),
                    {mkdirp:true,clobber:false},
                    (err)=>{ if (err) { return console.log(err) } add(); }
                );
            });
        } else {
            setTimeout(add, 0); // ensure tree refreshes
        }
    }
    
    deleteNote = note => {
        const trash = window.require('trash');
        this.forceUpdate();
        if (fs.existsSync(note.path)) {
            trash(note.path).then(() => {
                this.updateTree(this.props.dir);
            });
        }
    }
    
    handleRename = (note, name) => {
        this.setState({
            active: Object.assign({},this.state.active,{name:name})
        });
    }

    renameNote = (note) => {
        if (fs.existsSync(note.path) && note.path.split(_path.sep).pop() !== note.name) {
            mv(note.path,
                _path.join(note.path,'..',note.name),
                {mkdirp:true,clobber:false},
                (err)=>{ if (err) { return console.log(err) } this.updateTree(this.props.dir); }
            );
        } else {
            this.setState({isRenaming:false});
        }
    }

    render() {
      return (
        <div className="Treepane">
          <ContextMenu id="treepane-menu" holdToDisplay={-1}>
            <MenuItem onClick={(x,y,z)=>{this.addNote(y)}}>Add Subnote</MenuItem>
            <MenuItem onClick={(x,y,z)=>{this.deleteNote(y)}}>Delete Note</MenuItem>
            <MenuItem onClick={(x,y,z)=>{this.setState({isRenaming:true})}}>Rename Note</MenuItem>
          </ContextMenu>
          <Tree
              paddingLeft={15}
              tree={JSON.parse(JSON.stringify(this.state.tree))}
              onChange={this.handleChange}
              onDragStart={this.handleDrag}
              renderNode={this.renderNode}
            />
        </div>
      );
    }
}

export default TreePane;
