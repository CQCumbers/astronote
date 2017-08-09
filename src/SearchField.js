import React, { Component } from 'react';
import 'react-select/dist/react-select.css';
import './SearchField.css';
const Select = window.require('react-select');

const findInFiles = window.require('find-in-files')

class SearchField extends Component {
	handleChange = (newPath) => {
		this.props.changeFile(newPath.value);
	}

	getOptions = (input) => {
        try {
            new RegExp(input);
        } catch(e) {
            input = input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        }

		return findInFiles.find({'term': input, 'flags': 'ig'}, this.props.dir, '.md$')
			.then((results) => {
			    let list = [];
				for (var result in results) {
                    if (!!result) {
                        list.push({label: this.props.getName(result), value: result});
                    }
				}
				return { options: list };
			});
    }

    render() {
        return (
          <Select.Async
            className="SearchField"
            name="notebook-search"
            placeholder="Search Notebook"
			onChange={this.handleChange}
            loadOptions={this.getOptions}
            filterOption={() => true}
            ignoreCase={false}
          />
        );
    }
}

export default SearchField;
