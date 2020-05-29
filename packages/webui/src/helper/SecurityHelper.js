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
const DEF_USER = {
	userId: 'New User',
	className: 'User',
	active: true,
	lastLogin: null,
	firstName: '',
	secondName: '',
	mail: '',
	avatar: 'images/avatar.png',
	settings: {
		locale: 'en',
		debug: false,
		displayMachines: 'grid',
		displayStreams: 'list',
		showNotifications: 'popup',
		homePage: '/dashboard',
		formatSettings: {
			numberFormat: '',
			fontSize: '',
			fontColor: '',
			backgroundColor: '',
		},
	},
};

export default class SecurityHelper {
	static createNewUser() {
		return Object.assign({}, DEF_USER, {name: DEF_USER.name});
	}
}
