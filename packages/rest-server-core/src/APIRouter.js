'use strict';

const bodyParser = require('body-parser');
const MessageRoute = require('./routes/MessageRoute');
const { Router } = require('express');

module.exports = class APIRouter extends Router {
	constructor(opts = APIRouter.defaultOptions()) {
		super(opts);
		this.all(
			'/v1.0/*',
			bodyParser.json({ inflate: true, strict: true }),
			bodyParser.urlencoded({ extended: false }),
			bodyParser.text(),
			MessageRoute.handleMessage
		);
	}

	static defaultOptions() {
		return { caseSensitive: true, strict: true };
	}
};
