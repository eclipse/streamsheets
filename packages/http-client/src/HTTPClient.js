const logger = require('@cedalo/logger').create({ name: 'HTTP Client' });
const IdGenerator = require('@cedalo/id-generator');

const axios = require('axios');

const CONFIG = {};

class HTTPClient {

	constructor(config) {
		this._init(config);
	}

	_init(config) {
		this.id = IdGenerator.generate();
	}

	async request(config) {
		return axios.request(config)

	}

	async get(url, config) {
		return axios.get(url, config)
	}

	async delete(url, config) {
		return axios.delete(url, config)
	}

	async head(url, config) {
		return axios.head(url, config)
	}

	async options(url, config) {
		return axios.options(url, config)
	}

	async post(url, data, config) {
		return axios.post(url, data, config)
	}

	async put(url, data, config) {
		return axios.put(url, data, config)
	}

	async patch(url, data, config) {
		return axios.patch(url, data, config)
	}

}

let instance;
const getInstance = () => {
	if (!instance) {
		instance = new HTTPClient(CONFIG);
	}
	return instance;
};

module.exports = {
	getInstance
};
