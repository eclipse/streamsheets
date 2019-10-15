import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import OpenDialog from './OpenDialog';

import store from '../../store';

const div = document.createElement('div');

describe('OpenDialog Component', () => {
	it('renders OpenDialog without crashing', () => {
		ReactDOM.render(<Provider
			store={store}
		><OpenDialog />
		</Provider>, div);
	});
});
