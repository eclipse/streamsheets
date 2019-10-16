const sdk = require('@cedalo/sdk-streams');
const FileProducer = require('./FileProducer');
const FileProviderConfiguration = require('./FileProviderConfiguration');

module.exports = class FileProvider extends sdk.Provider {
	constructor() {
		super(new FileProviderConfiguration());
	}

	get Producer() {
		return FileProducer;
	}

	get canConsume() {
		return false;
	}
};
