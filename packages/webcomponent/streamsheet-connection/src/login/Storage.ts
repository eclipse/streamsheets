// import { Credentials } from '../Credentials';


enum KEYS {
	CLIENT_ID = 'client-id',
	LICENSE = 'license',
	TOKEN = 'token',
	USER = 'user'
};

const set = (key: string, value: string | undefined) => {
	if (value === undefined) localStorage.removeItem(key);
	else localStorage.setItem(key, value);
};
const get = (key: string) => localStorage.getItem(key);

const parse = (str: string | null) => {
	let res;
	if (str) {
		try {
			res = JSON.parse(str);
		} catch (err) {
			/* ignore */
		}
	}
	return res;
};

class Storage {
	// pass undefined to remove...
	static setToken(token: string | undefined) {
		set(KEYS.TOKEN, token);
	}
	// pass undefined to remove...
	static setUser(user: string | undefined) {
		const descr = user ? JSON.stringify(user) : undefined;
		set(KEYS.USER, descr);
	}
	// pass undefined to remove...
	static setClientId(clientId: string | undefined) {
		set(KEYS.CLIENT_ID, clientId);
	}

	static getToken() {
		return get(KEYS.TOKEN);
	}
	static getUser() {
		return parse(get(KEYS.USER));
	}
	static getClientId() {
		return get(KEYS.CLIENT_ID);
	}

	// static getCredentials(): Credentials {
	// 	const user = Storage.getUser();
	// 	const token = Storage.getToken();
	// 	return token ? { user, token } : undefined;
	// }
}

export default Storage;
