'use strict';

module.exports = class GatewayAPI {
	constructor(logger) {
		this._logger = logger;
	}

	get logger() {
		return this._logger;
	}
};
