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

	generateClientId() {
		return `${this.user.username}-${getGUID()}`;
	}

	logoutUI(/* user, sessionId */) {
		sessionStorage.removeItem('sessionId');
		localStorage.removeItem('jwtToken');
		localStorage.removeItem('user');
		localStorage.removeItem('streamsheets-prefs-listing-sortby');
		localStorage.removeItem('streamsheets-prefs-listing-layout');
		localStorage.removeItem('streamsheets-prefs-addnewdialog');
		window.location = '/login';
	}

	loginWithToken({ token, username, newUrl }) {
		localStorage.setItem('jwtToken', token);
		localStorage.setItem(
			'user',
			JSON.stringify({
				username
			})
		);
		window.location = newUrl;
	}

	updateLocalStorageFromSession(session) {
		const { user } = session;
		this.user = user;
		const currentSavedUser = JSON.parse(localStorage.getItem('user') || '{}');
		if (user.username === currentSavedUser.username) {
			localStorage.setItem('user', JSON.stringify(user));
			sessionStorage.setItem('sessionId', session ? session.id : '');
			localStorage.setItem('streamsheet-client-id', this.generateClientId());
		}
	}

	loginUI(token, user, session, redirect) {
		this.user = user;
		localStorage.setItem('jwtToken', token);
		localStorage.setItem('user', JSON.stringify(user));
		sessionStorage.setItem('sessionId', session ? session.id : '');
		if (!this.clientId) {
			localStorage.setItem('streamsheet-client-id', this.generateClientId());
		}
		window.location = redirect ? decodeURIComponent(redirect) :'/dashboard';
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
