import React from 'react';
import ReactDOM from 'react-dom';
import MultipleSelect from './MultipleSelect';

const div = document.createElement('div');

describe('MultipleSelect Component', () => {
	it('renders MultipleSelect without crashing', () => {
		ReactDOM.render(
			<MultipleSelect />
			, div,
		);
	});
});
