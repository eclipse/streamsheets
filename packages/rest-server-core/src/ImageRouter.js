'use strict';

const bodyParser = require('body-parser');
const ImageRoute = require('./routes/ImageRoute');
const { Router } = require('express');

module.exports = class ImageRouter extends Router {
	constructor(opts = ImageRouter.defaultOptions()) {
		super(opts);
		this.all(
			'/*',
			bodyParser.json({ 'inflate': true, 'strict': true, limit: '5mb' }),
			bodyParser.urlencoded({ extended: false }),
			bodyParser.text(),
			ImageRoute.handleMessage
		  );
	}

	static defaultOptions() {
		return { caseSensitive: true, strict: true };
	}
};
