/* eslint-disable */
const sdk = require('@cedalo/sdk-streams');
const BadStream = require('./BadStream');

module.exports = class BadProvider extends sdk.Provider {

	get Consumer() {
		return BadStream;
	}

};
