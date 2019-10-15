const request = require('request');

module.exports = class RESTClient {
	send(options, { baseUrl, user, pass } = {}) {
		options.baseUrl = baseUrl;
		if (options.json !== false) {
			options.json = true;
		}
		if (user && pass) {
			options.auth = {
				user,
				pass
			};
		}
		return new Promise((resolve, reject) => {
			request(options, (error, response, body) => {
				if (error) {
					reject(error);
				} else {
					resolve(body);
				}
			});
		});
	}
};
