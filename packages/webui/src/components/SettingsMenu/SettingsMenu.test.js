import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import SettingsMenu from './SettingsMenu';
import store from '../../store';

const div = document.createElement('div');

describe('SettingsMenu Component', () => {
	it('renders SettingsMenu without crashing', () => {
		ReactDOM.render(<Provider
			store={store}
		><SettingsMenu />
		</Provider>, div);
	});
});
