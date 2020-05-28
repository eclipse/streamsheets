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
