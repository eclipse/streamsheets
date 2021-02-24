const os = require('os');
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

	_checkConfig(config) {
		if (!config.headers) {
			config.headers = {};
		}
		if (!config.headers['User-Agent']) {
			// TODO: get Streamsheets version
			const productName = process.env.STREAMSHEETS_PRODUCT_NAME || 'Streamsheets';
			const version = process.env.STREAMSHEETS_VERSION ? `/${process.env.STREAMSHEETS_VERSION}` : '';
			config.headers['User-Agent'] = `${productName}${version} (${os.platform()} ${os.release()})`;
		}
		return config;
	}

	async request(config) {
		config = this._checkConfig(config);
		return axios.request(config)
	}

	async get(url, config) {
		config = this._checkConfig(config);
		return axios.get(url, config)
	}

	async delete(url, config) {
		config = this._checkConfig(config);
		return axios.delete(url, config)
	}

	async head(url, config) {
		config = this._checkConfig(config);
		return axios.head(url, config)
	}

	async options(url, config) {
		config = this._checkConfig(config);
		return axios.options(url, config)
	}

	async post(url, data, config) {
		config = this._checkConfig(config);
		// axios serialize json data
		return axios.post(url, data, config)
	}

	async put(url, data, config) {
		config = this._checkConfig(config);
		return axios.put(url, data, config)
	}

	async patch(url, data, config) {
		config = this._checkConfig(config);
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
