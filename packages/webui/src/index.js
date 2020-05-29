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
import { addLocaleData } from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';
import deLocaleData from 'react-intl/locale-data/de';

import App from './App';
import AppIntlProvider from './helper/AppIntlProvider';
import IntlGlobalProvider from './helper/IntlGlobalProvider';
import './index.css';
import store from './store';

addLocaleData([...deLocaleData, ...enLocaleData]);

ReactDOM.render(
	<Provider store={store}>
		<AppIntlProvider>
			<IntlGlobalProvider>
				<App />
			</IntlGlobalProvider>
		</AppIntlProvider>
	</Provider>,
	document.getElementById('root'),
);
