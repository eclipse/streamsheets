import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import InfoToolBar from './InfoToolBar';

import store from '../../store';

const div = document.createElement('div');

describe('InfoToolBar Component', () => {
	it('renders InfoToolBar without crashing', () => {
		ReactDOM.render(<Provider
			store={store}
		><InfoToolBar /></Provider>, div);
	});
});
