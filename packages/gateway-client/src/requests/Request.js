'use strict';

module.exports = class Request {
	constructor({ name = 'Request' } = {}) {
		this._name = name;
	}

	send() {
		return Promise.reject(
			new Error('Method send() must be implemented by subclass.')
		);
	}
};
