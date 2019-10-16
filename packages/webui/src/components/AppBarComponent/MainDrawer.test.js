import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import MainDrawer from './MainDrawer';

import store from '../../store';

const div = document.createElement('div');

describe('MainDrawer Component', () => {
	it('renders MainDrawer without crashing', () => {
		ReactDOM.render(<Provider
			store={store}
		><MainDrawer />
		</Provider>, div);
	});
});
