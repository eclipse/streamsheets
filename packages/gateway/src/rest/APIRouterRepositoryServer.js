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

const bodyParser = require('body-parser');
const Router = require('express').Router;
const passport = require('passport');
const multer = require('multer');

const upload = multer({ dest: 'backups/' });
const IndexRoutes = require('./routes/IndexRoutes');
const ErrorRoutes = require('./routes/ErrorRoutes');
const AuthRoutes = require('./routes/AuthRoutes');
const MetaInformationRoutes = require('./routes/MetaInformationRoutes');
const BackupRestoreRoutes = require('./routes/BackupRestoreRoutes');
const SetupRoutes = require('./routes/SetupRoutes');

module.exports = class APIRouter extends Router {
	constructor(opts = APIRouter.defaultOptions()) {
		super(opts);

		this.all(
			'/system/setup',
			bodyParser.json({ inflate: true, strict: true }),
			SetupRoutes.getSetup
		);

		this.get('/healthcheck', (request, response) => {
			response.status(200).json({});
		});

		this.all(
			'/backup',
			passport.authenticate('jwt', { session: false }),
			BackupRestoreRoutes.backup
		);

		this.all(
			'/restore',
			passport.authenticate('jwt', { session: false }),
			upload.single('restoreData'),
			BackupRestoreRoutes.restore
		);

		this.post(
			'/login',
			bodyParser.json({ inflate: true, strict: true }),
			AuthRoutes.login
		);
		this.options('/login', APIRouter.noopOptions);
		this.post(
			'/pathlogin',
			bodyParser.json({ inflate: true, strict: true }),
			AuthRoutes.pathLogin
		);
		this.options('/pathlogin', APIRouter.noopOptions);
		this.post(
			'/logout',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			AuthRoutes.logout
		);
		this.options('/logout', APIRouter.noopOptions);
		this.get(
			'/meta',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			MetaInformationRoutes.getMetaInformation
		);

		this.all('/', IndexRoutes.index);

		/* ===== 404 Error handling ===== */
		this.use(ErrorRoutes._404);
	}

	static noopOptions(request, response) {
		response.set('Access-Control-Allow-Origin', '*');
		response.set('Access-Control-Allow-Methods', 'DELETE,POST,PUT');
		response.status(200).end();
	}

	static defaultOptions() {
		return { caseSensitive: true, strict: true };
	}
};
