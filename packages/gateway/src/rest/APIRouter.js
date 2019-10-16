'use strict';

const bodyParser = require('body-parser');
const Router = require('express').Router;
const passport = require('passport');

const MetaInformationRoutes = require('./routes/MetaInformationRoutes');
const AuthRoutes = require('./routes/AuthRoutes');
const ConfigRoutes = require('./routes/ConfigRoutes');
const NewsletterRoutes = require('./routes/NewsletterRoutes');

module.exports = class APIRouter extends Router {
	constructor(opts = APIRouter.defaultOptions()) {
		super(opts);

		this.get('/logout', passport.authenticate('jwt'), AuthRoutes.logout);

		this.post('/login', bodyParser.json({ inflate: true, strict: true }), AuthRoutes.login);

		// basic routes

		this.get(
			'/meta',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			MetaInformationRoutes.getMetaInformation
		);

		this.get('/get', bodyParser.json({ inflate: true, strict: true }), ConfigRoutes.config);

		this.get(
			'/',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			MetaInformationRoutes.getMetaInformation
		);

		// Newsletter routes

		this.all('/subscribe', bodyParser.json({ inflate: true, strict: true }), NewsletterRoutes.subscribe);
	}

	static noopOptions(request, response) {
		response.set('Access-Control-Allow-Origin', '*');
		response.set('Access-Control-Allow-Methods', 'DELETE,PUT,POST');
		response.status(200).end();
	}

	static defaultOptions() {
		return { caseSensitive: true, strict: true };
	}
};
