import React, { Component } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'react-simplemde-editor/dist/simplemde.min.css';
import './EditPane.css';

//const remote = window.require('electron').remote;
const fs = window.require('fs');

class EditPane extends Component {
  constructor(props) {
      super(props)
      this.state = {
          text: ''
      };
      fs.readFile(this.props.filepath, 'utf8', (err, data) => {
          if (err) return console.log(err);
          this.setState({
              text: data 
          });
      });
  }
    
  componentWillReceiveProps(nextProps) {
      fs.readFile(nextProps.filepath, 'utf8', (err, data) => {
          if (err) return console.log(err);
          this.setState({
              text: data 
          });
      });
  }

  handleChange = (value) => {
      fs.writeFile(this.props.filepath, value, (err) => { if (err) return console.log(err); });
      this.setState({
          test: value 
      });
  }

  render() {
    return (
      <div className="EditPane">
        <h2 className="filename">{ this.props.filepath.split('/').pop().split('.')[0] }</h2>
        <SimpleMDE
            onChange={ this.handleChange }
            value={ this.state.text }
        />
      </div>
    );
  }
}

export default EditPane;
