/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/

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
