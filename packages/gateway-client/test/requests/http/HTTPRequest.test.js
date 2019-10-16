
'use strict';

const { HTTPRequest } = require('../../..');

describe('HTTPRequest', () => {
	describe('_getPath()', () => {
		it('should be overridden by subclasses', (done) => {
			const request = new HTTPRequest();
			try {
				request._getPath();
			} catch (error) {
				expect(error).toBeDefined();
				done();
			}
		});
	});
	describe('_getConfig()', () => {
		it('should be overridden by subclasses', (done) => {
			const request = new HTTPRequest();
			try {
				request._getConfig();
			} catch (error) {
				expect(error).toBeDefined();
				done();
			}
		});
	});
});
