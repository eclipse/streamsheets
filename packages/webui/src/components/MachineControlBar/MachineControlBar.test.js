import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import MachineControlBar from './MachineControlBar';

import store from '../../store';

const div = document.createElement('div');

describe('MachineControlBar Component', () => {
	it('renders MachineControlBar without crashing', () => {
		ReactDOM.render(<Provider
			store={store}
		><MachineControlBar />
		</Provider>, div);
	});
});
