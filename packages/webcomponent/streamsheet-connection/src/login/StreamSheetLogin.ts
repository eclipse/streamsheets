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
import Credentials from '../Credentials';
import StreamSheetConnection from '../connection/StreamSheetConnection';
import Storage from './Storage';
import traverse from '../utils/traverse';
import validate from '../utils/validate';


const TAG = 'streamsheet-login';


const getConnections = (element: Element): StreamSheetConnection[] => {
	const connections: StreamSheetConnection[] = [];
	traverse.down(element, (el) => {
		if (validate.tagName(el, StreamSheetConnection.TAG)) {
			connections.push(<StreamSheetConnection>el);
		}
		return false;
	});
	return connections;
};

const displayName = (fstName = '', scdName?:string) => (scdName ? `${fstName} ${scdName}` : `${fstName}`);
const createUserDescriptor = (user: any): any => {
	const { firstName, secondName, roles, userId } = user;
	return {
		userId,
		displayName: displayName(firstName, secondName),
		roles
	};
};
// responses should contain same response for each connection, so simply take first defined...
const reduce = (responses: any[]): any => responses.reduce((_response, resp) => _response || resp, null);

const store = (response: any | null): Promise<boolean> => {
	if (response) {
		const { user, token } = response;
		if (user) Storage.setUser(createUserDescriptor(user));
		if (token) Storage.setToken(token);
		// license, client-id
		return Promise.resolve(true);
	}
	return Promise.reject(new Error('No response from login!'));
};

const loginTo = (connection: StreamSheetConnection, credentials = {}): Promise<any> => connection.login(credentials);
const logoutFrom = (connection: StreamSheetConnection, credentials = {}): Promise<any> => connection.login(credentials);

const notifyLoginSuccess = (response: any, loginElement: StreamSheetLogin) => {
	loginElement.onLoginSuccess();
	return response;
};

const loginFailed = (err: Error, loginElement: StreamSheetLogin) => {
	loginElement.onLoginFailed(err);
	loginElement.logout(); // from connected connections
	loginElement.login();
};

const getCredentials = (loginElement: StreamSheetLogin): Promise<Credentials> => {
	const token = Storage.getToken();
	return token ? Promise.resolve({ token }) : loginElement.getCredentials();
};

// note: we can use via sub-classing to prevent to much nested tag!!!
abstract class StreamSheetLogin extends HTMLElement {

	public static readonly TAG = TAG;


	private connections: StreamSheetConnection[] = [];

	constructor() {
		super();
	}

	connectedCallback() {
		this.connections = getConnections(this);
	}

	login(): Promise<any> {
		return getCredentials(this)
			.then((credentials) => {
				// we either connect to all or none!!
				Promise.all(this.connections.map((connection) => loginTo(connection, credentials)))
					.then((responses) => reduce(responses))
					.then((response) => notifyLoginSuccess(response, this))
					.then((response) => store(response))
					.catch((err: Error) => loginFailed(err, this));
			})
			.catch(() => console.log('Stop login! No credentials available!'));
	}

	logout(): Promise<any> {
		const token = Storage.getToken();
		// clear old token:
		Storage.setToken(undefined);
		return token ? Promise.all(this.connections.map((conn) => conn.logout(token))) : Promise.resolve([]);
	}

	// abstract methods
	abstract onLoginSuccess(/* pass additional information? */): void;
	abstract onLoginFailed(err: Error/* pass additional information? */): void;
	abstract getCredentials(/* pass additional information? */): Promise<Credentials>;
}

if (!customElements.get(TAG)) customElements.define(TAG, StreamSheetLogin);

export default StreamSheetLogin;