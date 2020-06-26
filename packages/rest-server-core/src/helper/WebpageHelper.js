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

const { logger } = require('@cedalo/logger');
const cheerio = require('cheerio');
const fs = require('fs-extra');
// const path = require('path');

// const templatePath = path.join(__dirname, '..', '', 'templates', 'index.pug');

module.exports = class WebpageHelper {
	static saveWebpage({
		content, // e.g., 0=[<html>], 1=[<head></head>], 2=[<body>Tests</body>], 3=[</html>]
		targetPath, // e.g., /Users/user/test/webpage/test
		indexPath, // e.g., /Users/user/test/webpage/test/index.html
		refresh = 5 // e.g., 5
	}) {
		return new Promise((resolve, reject) => {
			fs.mkdirs(targetPath, () => {
				logger.debug(content);
				logger.debug(targetPath);
				logger.debug(indexPath);
				logger.info('Directories created');
				let html = content;
				const $ = cheerio.load(content);
				$('head').append(
					`<meta http-equiv="refresh" content="${refresh}"></meta>`
				);
				html = $.html();
				fs.writeFile(indexPath, html, (error) => {
					logger.info('File created');
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			});
		});
	}
};
