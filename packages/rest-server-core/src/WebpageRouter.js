'use strict';

const bodyParser = require('body-parser');
const WebpageRoute = require('./routes/WebpageRoute');
const { Router } = require('express');

module.exports = class WebpageRouter extends Router {
	constructor(opts = WebpageRouter.defaultOptions()) {
		super(opts);
		this.all(
			'/*',
			bodyParser.json({ 'inflate': true, 'strict': true }),
			bodyParser.urlencoded({ extended: false }),
			bodyParser.text(),
			WebpageRoute.handleMessage
		  );
	}

	static defaultOptions() {
		return { caseSensitive: true, strict: true };
	}
};
