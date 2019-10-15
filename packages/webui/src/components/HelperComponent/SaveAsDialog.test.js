import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import SaveAsDialog from './SaveAsDialog';

import store from '../../store';

const div = document.createElement('div');

describe('SaveAsDialog Component', () => {
	it('renders SaveAsDialog without crashing', () => {
		ReactDOM.render(<Provider
			store={store}
		><SaveAsDialog />
		</Provider>, div);
	});
});
