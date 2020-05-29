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
const getGUID = () => {
	const nav = window.navigator;
	const { screen } = window;
	let guid = nav.mimeTypes.length;
	guid += nav.userAgent.replace(/\D+/g, '');
	guid += nav.plugins.length;
	guid += screen.height || '';
	guid += screen.width || '';
	guid += screen.pixelDepth || '';
	return guid;
};

class AccessManager {
	constructor() {
		this._inited = false;
		this._cachedPermissions = [];
	}

	init(props, user) {
		this.user = user;
		this._inited = true;
	}

	get authToken() {
		return localStorage.getItem('jwtToken');
	}

	get sessionId() {
		return localStorage.getItem('sessionId');
	}

	generateGUID() {
		return getGUID();
	}

	logoutUI(preserveCurrentUrl /* user, sessionId */) {
		sessionStorage.removeItem('sessionId');
		localStorage.removeItem('jwtToken');
		localStorage.removeItem('user');
		localStorage.removeItem('streamsheets-prefs-listing-sortby');
		localStorage.removeItem('streamsheets-prefs-listing-layout');
		localStorage.removeItem('streamsheets-prefs-addnewdialog');
		const redirect =
			preserveCurrentUrl && !window.location.pathname.startsWith('/login')
				? `?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
				: '';
		window.location = `/login${redirect}`;
	}

	loginWithToken({ token, username }) {
		window.onbeforeunload= () => {
			localStorage.removeItem('jwtToken');
		};
		localStorage.setItem('jwtToken', token);
		localStorage.setItem(
			'user',
			JSON.stringify({
				username
			})
		);
		// window.location = newUrl;
	}

	loginUI(token, redirect) {
		localStorage.setItem('jwtToken', token);
		window.location = redirect ? decodeURIComponent(redirect) : '/dashboard';
	}

	can(/* resourceOrType, action */) {
		return true;
	}

	canViewUI(/* pId */) {
		return true;
	}

	canViewCompositeUI(/* pId */) {
		return true;
	}

	isAccessDisabled(/* perm, expr = true */) {
		return false;
	}

	get permissions() {
		return Array.from(this._authManager.permissionsMap.values());
	}

	get ready() {
		return this._inited;
	}
}
export const accessManager = new AccessManager();
accessManager.PERMISSIONS = {};
accessManager.RESOURCE_ACTIONS = {};
accessManager.RESOURCE_TYPES = {};
export const { PERMISSIONS, RESOURCE_ACTIONS, RESOURCE_TYPES } = accessManager;
