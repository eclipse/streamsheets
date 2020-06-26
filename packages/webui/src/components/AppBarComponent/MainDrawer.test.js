/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
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
