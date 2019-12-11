'use strict';

const bodyParser = require('body-parser');
const Router = require('express').Router;
const passport = require('passport');
const multer = require('multer');

const upload = multer({ dest: 'backups/' });
const IndexRoutes = require('./routes/IndexRoutes');
const ErrorRoutes = require('./routes/ErrorRoutes');
const ExportImportRoutes = require('./routes/ExportImportRoutes');
const MachineRoutes = require('./routes/MachineRoutes');
const AuthRoutes = require('./routes/AuthRoutes');
const GraphRoutes = require('./routes/GraphRoutes');
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
			'/graphs',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			GraphRoutes.graphs
		);
		this.all(
			'/graphs/:graphId',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			GraphRoutes.graph
		);

		this.all(
			'/machines',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			MachineRoutes.machines
		);
		this.all(
			'/machines/overview',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			MachineRoutes.machinesOverview
		);
		this.all(
			'/machines/:machineId',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			MachineRoutes.machine
		);

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

		this.all(
			'/export',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			ExportImportRoutes.export
		);

		this.all(
			'/import',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true, limit: '50mb' }),
			ExportImportRoutes.import
		);

		this.all(
			'/exportall',
			passport.authenticate('jwt', { session: false }),
			bodyParser.json({ inflate: true, strict: true }),
			ExportImportRoutes.exportAll
		);

		this.post(
			'/login',
			bodyParser.json({ inflate: true, strict: true }),
			AuthRoutes.login
		);
		this.options('/login', APIRouter.noopOptions);
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
