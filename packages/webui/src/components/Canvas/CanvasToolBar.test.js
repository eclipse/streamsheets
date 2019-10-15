import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import CanvasToolBar from './CanvasToolBar';

import store from '../../store';

const div = document.createElement('div');

describe('CanvasToolBar Component', () => {
	it('renders CanvasToolBar without crashing', () => {
		ReactDOM.render(
			<Provider store={store}>
				<CanvasToolBar />
			</Provider>,
			div,
		);
	});
});
