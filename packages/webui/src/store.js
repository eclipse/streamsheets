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
/* eslint-disable */
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createBrowserHistory} from 'history';
// import { createLogger } from 'redux-logger';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import LoggerMiddleware from './helper/LoggerMiddleware';
import appReducer from './reducers/appReducer';
import jsgReducer from './reducers/jsgReducer';
import exportReducer from './reducers/exportReducer';
import importReducer from './reducers/importReducer';
import requestReducer from './reducers/monitorreducers';
import machineReducer from './reducers/machineReducer';
import machinesReducer from './reducers/machinesReducer';
import metaInformationReducer from './reducers/metaInformationReducer';
import notificationsReducer from './reducers/notificationsReducer';
import userReducer from './reducers/userReducer';
import streamsReducer from './reducers/streamsReducer';
import adminSecurityReducer from './reducers/adminSecurityReducer';
import localeReducer from './reducers/localeReducer';

const history = createBrowserHistory();

const historyMiddleware = routerMiddleware(history);
const middleware = [thunkMiddleware, LoggerMiddleware, historyMiddleware];
//	middleware.push(createLogger());

const store = createStore(combineReducers({
	appState: appReducer,
	jsgState: jsgReducer,
	export: exportReducer,
	import: importReducer,
	meta: metaInformationReducer,
	monitor: requestReducer,
	notifications: notificationsReducer,
	router: routerReducer,
	machine: machineReducer,
	machines: machinesReducer,
	user: userReducer,
	streams: streamsReducer,
	adminSecurity: adminSecurityReducer,
	locales: localeReducer,
}), applyMiddleware(...middleware));

export { history };
export default store;
