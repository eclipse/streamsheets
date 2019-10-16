import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import NamesDialog from './NamesDialog';

import store from '../../store';

const div = document.createElement('div');

describe('NamesDialog Component', () => {
	it('renders NamesDialog without crashing', () => {
		ReactDOM.render(<Provider
			store={store}
		><NamesDialog /></Provider>, div);
	});
});
