import React, { Component } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'react-simplemde-editor/dist/simplemde.min.css';
import './EditPane.css';
import './katex/katex.min.css';

const fs = window.require('fs-extra');
const scrape = window.require('website-scraper');
const request = window.require('request');
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

  saveLinks = () => {
      const parser = require('markdown-it')({
          html: true,
          linkify: true,
          typographer: true,
          replaceLink: (link, env) => {
            if (/^http(s)?:\/\/[a-z0-9-]+(.[a-z0-9-]+)*(:[0-9]+)?(\/.*)?$/i.test(link)) {
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
                if (fs.lstatSync(scrapeOptions.directory).mtimeMs < Date.now() - 3*86400*1000) {
                    request.get(link, (err, res, body) => {
                        if (err || res.statusCode < 200 || res.statusCode >= 400) { return console.log(err ? err : 'Status Code: '+res.statusCode); }
                        if (fs.existsSync(scrapeOptions.directory)) {
                            fs.removeSync(scrapeOptions.directory);
                        }
                        scrape(scrapeOptions).catch(console.log).then((result)=>{ if(result){console.log('Cached '+link)} });
                    });
                } else { return console.log('Cached at least 3 days ago'); }
            } else { return link }
        }
      }).use(require('markdown-it-replace-link'));
      parser.render(this.state.text);
  }

  renderMD = (markdown) => {
      const md = require('markdown-it')({
          html: true,
          linkify: true,
          typographer: true,
          replaceLink: (link, env) => /^http(s)?:\/\/[a-z0-9-]+(.[a-z0-9-]+)*(:[0-9]+)?(\/.*)?$/i.test(link) ?
              'file://'+this.props.cacheDir+'/'
              +link.replace(/[^a-z0-9]/gi, '').toLowerCase()+'/'
              +(imageExts.some((ext) => link.endsWith(ext)) ? 'img/index.'+link.split('.').pop() : 'index.html')
              : link
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

  handleChange = (value) => {
      fs.writeFile(this.props.filepath, value, (err) => { if (err) return console.log(err); });
      this.setState({
          test: value 
      });   
      this.saveLinks();
  }

  render() {
    return (
      <div className="EditPane">
        <h2 className="filename">{ this.props.name }</h2>
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
