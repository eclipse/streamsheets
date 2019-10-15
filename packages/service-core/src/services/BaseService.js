const IdGenerator = require('@cedalo/id-generator');
const os = require('os');

module.exports = class BaseService {
	constructor(metadata, config = {}) {
		this._metadata = metadata;
		this._addSystemInformationToMetadata();
		this._id = `${metadata.type}-${IdGenerator.generate()}`;
		this._metadata.id = this._id;
		this._name = metadata.name;
		this._type = metadata.type;
		this._config = config;
	}

	_addSystemInformationToMetadata() {
		this._metadata = Object.assign(
			this.metadata,
			{
				os: {
					hostname: os.hostname(),
					platform: os.platform(),
					arch: os.arch(),
					release: os.release()
				}
			}
		);
	}

	get metadata() {
		return this._metadata;
	}

	get id() {
		return this._id;
	}

	get name() {
		return this._name;
	}

	get type() {
		return this._type;
	}

	async start() {
		await this._preStart();
		await this._doStart();
		await this._postStart();
	}

	async _preStart() {
		return Promise.resolve();
	}

	async _doStart() {
		return Promise.resolve();
	}

	async _postStart() {
		return Promise.resolve();
	}

	async stop() {
		await this._preStop();
		await this._postStop();
	}

	async _preStop() {
		return Promise.resolve();
	}

	async _postStop() {
		return Promise.resolve();
	}

};
