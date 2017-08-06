import React, { Component } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'react-simplemde-editor/dist/simplemde.min.css';
import './EditPane.css';
import './katex/katex.min.css';

const fs = window.require('fs');
const scrape = window.require('website-scraper');
const request = window.require('request');
const rimraf = window.require('rimraf');
const debounce = window.require('lodash.debounce');
const imageExts = ['.jpg', '.png', '.svg', '.jpeg'];

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
          this.saveLinks();
      });
  }

  saveLinks = debounce(() => {
      const parser = require('markdown-it')({
          html: true,
          linkify: true,
          typographer: true,
          replaceLink: (link, env) => {
            let scrapeOptions = {
                urls: [link],
                directory: this.props.cacheDir+'/'+link.replace(/[^a-z0-9]/gi, '').toLowerCase(),
                subdirectories: [
                    {directory: 'img', extensions: imageExts},
                    {directory: 'js', extensions: ['.js']},
                    {directory: 'css', extensions: ['.css']}
                ],
                defaultFilename: 'index.'+ (imageExts.some((ext) => link.endsWith(ext)) ? link.split('.').pop() : 'html')
            };
            request.get(link, (err, res, body) => {
                const { statusCode } = res;
                if (err || statusCode < 200 || statusCode >= 400) return console.log('Status Code: '+statusCode);
                if (fs.existsSync(scrapeOptions.directory)) {
                     rimraf.sync(scrapeOptions.directory);
                }
                scrape(scrapeOptions).catch(console.log);
                console.log('cached '+link);
            });
          }
      }).use(require('markdown-it-replace-link'));
      parser.render(this.state.text);
  },10000,{leading:true})

  renderMD = (markdown) => {
      const md = require('markdown-it')({
          html: true,
          linkify: true,
          typographer: true,
          replaceLink: (link, env) => 'file://'+this.props.cacheDir+'/'
              +link.replace(/[^a-z0-9]/gi, '').toLowerCase()+'/'
              +(imageExts.some((ext) => link.endsWith(ext)) ? 'img/index.'+link.split('.').pop() : 'index.html')
      }).use(require('markdown-it-katex')).use(require('markdown-it-replace-link'));
      return md.render(markdown);
  }
    
  componentWillReceiveProps(nextProps) {
      fs.readFile(nextProps.filepath, 'utf8', (err, data) => {
          if (err) return console.log(err);
          this.setState({
              text: data 
          });
          this.saveLinks();
      });
  }

  handleChange = debounce((value) => {
      console.log('saving...');
      fs.writeFile(this.props.filepath, value, (err) => { if (err) return console.log(err); });
      this.setState({
          test: value 
      });   
      this.saveLinks();
  },2000,{trailing:true})

  render() {
    return (
      <div className="EditPane">
        <h2 className="filename">{ this.props.filepath.split('/').pop().split('.')[0] }</h2>
        <SimpleMDE
            onChange={ this.handleChange }
            value={ this.state.text }
            options={{
                autofocus: true,
				spellChecker: false,
                previewRender: this.renderMD
            }}
        />
      </div>
    );
  }
}

export default EditPane;
