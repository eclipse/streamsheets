'use strict';

module.exports = class Utils {
	static checkRequestBody(response) {
		['_topic', '_messages', '_messageReceivers'].forEach((property) => {
			if (!(property in response.body)) {
				throw new Error(`Missing property '${property}' in response`);
			}
		});
	}
};
