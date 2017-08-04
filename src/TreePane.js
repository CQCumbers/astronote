import React, { Component } from 'react';
import Tree from 'react-ui-tree';
import 'react-ui-tree/dist/react-ui-tree.css';
import cx from 'classnames';
import './TreePane.css';

// const remote = window.require('electron').remote;
const dirTree = window.require('directory-tree');

class TreePane extends Component {
    constructor(props) {
        super(props);
        let filetree = dirTree(this.props.dir);

		(function traverse(o,collapse=true) {
			for (let i in o) {
				if (!!o[i] && typeof(o[i])==="object") {
					o.collapsed = collapse;
					traverse(o[i] );
				}
			}
		})(filetree,false);

        this.state = {
            tree: filetree,
            active: null
        };
    }

    componentWillReceiveProps(nextProps) {
        let filetree = dirTree(nextProps.dir);

		(function traverse(o,collapse=true) {
			for (let i in o) {
				if (!!o[i] && typeof(o[i])==="object") {
					o.collapsed = collapse;
					traverse(o[i] );
				}
			}
		})(filetree,false);

        this.setState({
            tree: filetree,
            active: null
        });
    }
	
	renderNode = node => {
	  return (
        <span
          className={cx('node', {
            'is-active': node === this.state.active
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
    };

    handleChange = tree => {
      this.setState({
        tree: tree
      });
    };

    render() {
      return (
		<Tree
            paddingLeft={20}
            tree={this.state.tree}
            onChange={this.handleChange}
            renderNode={this.renderNode}
          />
      );
    }
}

export default TreePane;
