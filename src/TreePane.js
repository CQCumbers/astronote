import React, { Component } from 'react';
import Tree from 'jab-react-tree';
import 'react-ui-tree/dist/react-ui-tree.css';
import cx from 'classnames';
import './TreePane.css';

const fs = window.require('fs');
const mv = window.require('mv');
const trash = window.require('trash');
const dirTree = window.require('directory-tree');
const _path  = window.require('path');
 
class TreePane extends Component {
    constructor(props) {
        super(props);
        let filetree = dirTree(this.props.dir,{exclude:/(\/\.)|(\.astro\/_cache)|(\/index.md)/});
        this.traverse(filetree,false);
        this.state = {
            tree: filetree,
            dragged: null,
            active: null
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.tree.path !== nextProps.dir) {
            this.updateTree(nextProps.dir);
        }
    }

    updateTree = (newDir) => {
        let filetree = dirTree(newDir,{exclude:/(\/\.)|(\.astro\/_cache)|(\/index.md)/});
        this.traverse(filetree,false);
        this.setState({
            tree: filetree,
            dragged: null,
            active: null
        });
    }

    traverse = (o,collapse=false) => {
        for (let i in o) {
            if (!!o[i] && Array.isArray(o[i]) && o[i].length >= 1) {
                o.collapsed = collapse;
                for (let j in o[i]) {
                    if (!!o[i][j] && typeof(o[i][j]) === 'object') {
                        this.traverse(o[i][j]);
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
	  return (
        <span
          className={cx('node', {
            'is-active': !!node && !!this.state.active && node.path === this.state.active.path
          })}
          onClick={this.onClickNode.bind(null, node)}
        >
		  { node.name }
        </span>
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
            
            if (fs.existsSync(newPath) && fs.lstatSync(newPath).isFile()) {
                mv(newPath,
                    _path.join(newPath,'index.'+newPath.split('.').pop()),
                    {mkdirp:true,clobber:false},
                    (err)=>{ if (err) { return console.log(err) } move(); }
                );
            } else {
                move();
            }
        }
      }
    }

    addNote = supernote => {
        let add = () => {
            let filepath = _path.join(supernote.path,'untitled');
            let count = 1;
            while (fs.existsSync(filepath+count+'.md')) {
                count++;
            }
            fs.openSync(filepath+count+'.md', 'a');
            this.updateTree(this.props.dir);
        }

        if (fs.lstatSync(supernote.path).isFile()) {
            mv(supernote.path,
                _path.join(supernote.path,'index.'+supernote.path.split('.').pop()),
                {mkdirp:true,clobber:false},
                (err)=>{ if (err) { return console.log(err) } add(); }
            );
        } else {
            add();
        }
    }
    
    deleteNote = note => {
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
        if (fs.existsSync(note.path)) {
            mv(note.path,
                _path.join(note.path,'..',note.name),
                {mkdirp:true,clobber:false},
                (err)=>{ if (err) { return console.log(err) } this.updateTree(this.props.dir); }
            );
        }
    }

    render() {
      return (
        <div className="Treepane">
          <button onClick={()=>this.addNote(this.state.active)} disabled={!this.state.active}>
              Add Note
          </button>
          <button onClick={()=>this.deleteNote(this.state.active)} disabled={!this.state.active}>
              Delete Note
          </button>
          <input
              disabled={!this.state.active}
              value={this.state.active ? this.state.active.name : 'Change Name'}
              onChange={ (evt) => {this.handleRename(this.state.active,evt.target.value)} }
              onKeyPress={ (evt) => {if(evt.key==='Enter'){this.renameNote(this.state.active)}} }
          />
          <hr/>
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
