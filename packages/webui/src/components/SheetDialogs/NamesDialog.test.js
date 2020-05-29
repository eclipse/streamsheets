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
