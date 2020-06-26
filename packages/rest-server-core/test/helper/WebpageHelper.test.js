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

const path = require('path');

const WebpageHelper = require('../../src/helper/WebpageHelper');

describe('WebpageHelper', () => {
	describe('saveWebpage', () => {
		it('should save a webpage', done => {
			const targetPath = path.join(__dirname, '..', 'webpage', 'test');
			const indexPath = path.join(targetPath, 'index.html');
			const content = [
				['<html>'],
				['<head></head>'],
				['<body>Tests</body>'],
				['</html>']
			]
			WebpageHelper
				.saveWebpage({content, targetPath, indexPath})
				.then(() => {
					// console.info('Webpage saved');
					done();
				})
				.catch(() => {
					// console.error(error);
					done();
				});
		});
	});
});
