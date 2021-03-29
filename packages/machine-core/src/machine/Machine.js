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
const EventEmitter = require('events');
const { convert } = require('@cedalo/commons');
const IdGenerator = require('@cedalo/id-generator');
const logger = require('../logger').create({ name: 'Machine' });
const State = require('../State');
const NamedCells = require('./NamedCells');
const Outbox = require('./Outbox');
const StreamSheet = require('./StreamSheet');
const locale = require('../locale');
const Streams = require('../streams/Streams');
const FunctionRegistry = require('../FunctionRegistry');
const TaskQueue = require('./TaskQueue');

// REVIEW: move to streamsheet!
const defaultStreamSheetName = (streamsheet) => {
	let suffix = 1;
	const { machine } = streamsheet;
	while (machine.getStreamSheetByName(`S${suffix}`)) {
		suffix += 1;
	}
	return `S${suffix}`;
};

const defaultMachineName = () => `Machine${new Date().getUTCMilliseconds()}`;

const FILE_VERSION = '2.0.0';

const DEF_CONF = {
	name: '',
	state: State.STOPPED,
	metadata: {
		owner: 'anon',
		lastModified: Date.now(),
		lastModifiedBy: 'unknown'
	},
	settings: {
		view: {
			maximize: '',
			showInbox: false,
			showGrid: false,
			showHeader: false,
			showOutbox: false,
			allowZoom: false,
			allowScroll: true
		},
		locale: 'en',
		isOPCUA: false,
		cycletime: 100
	}
};

/**
 * A class representing a machine.
 *
 * @class Machine
 * @public
 */
class Machine {
	static get DEF_CYCLETIME() {
		return DEF_CONF.settings.cycletime;
	}

	constructor() {
		this._id = IdGenerator.generate();
		this.namedCells = new NamedCells();
		this._initialLoadTime = Date.now();
		this._name = DEF_CONF.name;
		this._state = DEF_CONF.state;
		// a Map keeps its insertion order
		this._streamsheets = new Map();
		this._pendingStreamSheets = new Map();
		// tmp. until event/message handling is improved
		this._isManualStep = false;
		this.metadata = { ...DEF_CONF.metadata };
		this._settings = { ...DEF_CONF.settings };
		// read only properties...
		Object.defineProperties(this, {
			stats: { value: { steps: 0 } },
			outbox: { value: Outbox.create(), enumerable: true },
			_emitter: { value: new EventEmitter() },
			cyclemonitor: {
				value: {
					id: null,
					counterSecond: 0,
					last: 0,
					lastSecond: 0
				},
				enumerable: false
			}
		});
		this.metadata.lastModified = Date.now();
		this.cycle = this.cycle.bind(this);
		this._lastEmitStep = 0;
		this._emitStep = this._emitStep.bind(this);
	}

	get className() {
		return 'Machine';
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			state: this.state,
			metadata: { ...this.metadata },
			streamsheets: this.streamsheets.map((streamsheet) => streamsheet.toJSON()),
			settings: {...this.settings, view: this.view},
			className: this.className,
			scope: this.scope,
			namedCells: this.namedCells.getDescriptors(),
			functionsHelp: FunctionRegistry.getFunctionsHelp(),
			functionDefinitions: FunctionRegistry.getFunctionDefinitions()
		};
	}

	async load(definition = {}, functionDefinitions = [], currentStreams = []) {
		FunctionRegistry.registerFunctionDefinitions(functionDefinitions);
		const def = Object.assign({}, DEF_CONF, definition);
		const streamsheets = def.streamsheets || [{}];
		this._id = def.isTemplate ? this._id : def.id || this._id;
		this._name = def.isTemplate ? defaultMachineName() : def.name;
		this._scope = def.scope;
		this.metadata = { ...this.metadata, ...definition.metadata };
		this._settings = { ...this.settings, ...definition.settings };
		// first time load named cells so that reference to named cells are resolved on streamsheets load
		this.namedCells.load(this, def.namedCells);
		// at least one streamsheet (required by graph-service!!):
		if (!streamsheets.length) streamsheets.push({});

		// load streamsheets:
		this.removeAllStreamSheets();
		streamsheets.forEach((transdef) => {
			const streamsheet = new StreamSheet(transdef);
			transdef.id = streamsheet.id;
			this.addStreamSheet(streamsheet);
		});
		// then load all
		streamsheets.forEach((transdef) => this.getStreamSheet(transdef.id).load(transdef, this));
		// second time load named cells so that references from named cells are resolved correctly
		this.namedCells.load(this, def.namedCells);

		currentStreams.forEach((descriptor) => Streams.registerSource(descriptor, this));
		setTimeout(() => {
			Streams.prune(currentStreams.map(({ id }) => id), this._initialLoadTime, this);
			this.notifyUpdate('namedCells');
		}, 60000);

		// update value of cells to which are not currently valid without changing valid values
		// => e.g. if a cell references another cell which was loaded later...
		this._streamsheets.forEach((streamsheet) => streamsheet.sheet.iterate((cell) => cell.update()));

		await this.outbox.load(undefined, this);

		// apply new fileVersion ofter load to allow adjustment on loading
		if (!this.metadata.fileVersion) this.metadata.fileVersion = FILE_VERSION;

		// apply loaded state:
		if (def.state === State.RUNNING) {
			this.start();
		} else if (def.state === State.PAUSED) {
			this.pause();
		}
	}

	loadFunctions(functionDefinitions = []) {
		FunctionRegistry.registerFunctionDefinitions(functionDefinitions);
		this._streamsheets.forEach((streamsheet) => {
			const { sheet } = streamsheet;
			const json = sheet.toJSON();
			sheet.load(json);
		});
		this._emitter.emit('update', 'functions', FunctionRegistry.getFunctionDefinitions());
	}

	get scope() {
		return this._scope;
	}

	get id() {
		return this._id;
	}
	get settings() {
		return this._settings;
	}

	set settings(settings) {
		this._settings = settings;
	}

	get owner() {
		return this.metadata.owner;
	}

	set owner(owner) {
		this.metadata.owner = owner || DEF_CONF.metadata.owner;
	}

	get name() {
		return this._name;
	}

	set name(name) {
		if (this.name !== name) {
			this._name = name;
			this._emitter.emit('update', 'name');
		}
	}

	get cycletime() {
		return this.settings.cycletime;
	}

	set cycletime(newtime) {
		const oldtime = this.cycletime;
		newtime = Math.max(1, convert.toNumber(newtime, oldtime));
		if (oldtime !== newtime) {
			this.settings.cycletime = newtime;
			this._emitter.emit('update', 'cycletime');
			// DL-1582: cancel old cycle and use new time...
			if (this.cyclemonitor.id) {
				clearTimeout(this.cyclemonitor.id);
				this.cyclemonitor.id = setTimeout(this.cycle, newtime, this.streamsheets);
			}
		}
	}

	get locale() {
		return this.settings.locale;
	}
	set locale(newLocale) {
		const doIt = this.settings.locale !== newLocale && locale.isSupported(newLocale);
		if (doIt) {
			this.settings.locale = newLocale;
			this._emitter.emit('update', 'locale');
		}
		return doIt;
	}
	get isOPCUA() {
		return this.settings.isOPCUA;
	}

	set isOPCUA(itIs) {
		if (itIs !== this.isOPCUA) {
			this.settings.isOPCUA = itIs;
			this._emitter.emit('update', 'opcua');
		}
	}

	get isManualStep() {
		return this._isManualStep;
	}

	get isRunning() {
		return this._state === State.RUNNING;
	}

	get state() {
		return this._state;
	}

	get streamsheets() {
		return Array.from(this._streamsheets.values());
	}

	get view() {
		let maximize = '';
		if (this.settings.view.maximize && this.streamsheets.some((s) => s.name === this.settings.view.maximize)) {
			maximize = this.settings.view.maximize;
		} else if (this.streamsheets[0]) {
			maximize = this.streamsheets[0].name;
		}

		return { ...this.settings.view, maximize };
	}

	set view(newView) {
		this.settings.view = newView;
		this._emitter.emit('update', 'view');
	}

	// name, cycletime, locale...
	update(props = {}) {
		this.name = props.name || this.name;
		this.locale = props.locale || this.locale;
		this.cycletime = props.cycletime || this.cycletime;
		this.view = props.view || this.view;
		if (props.isOPCUA != null) this.isOPCUA = props.isOPCUA;
	}

	addStreamSheet(streamsheet) {
		if (this._streamsheets.has(streamsheet.id)) {
			logger.warn(`Ignore streamsheet add! A streamsheet with same id (${streamsheet.id}) already exists!`);
		} else {
			streamsheet.machine = this;
			streamsheet.name = streamsheet.name || defaultStreamSheetName(streamsheet);
			streamsheet.on('finishedStep', this._emitStep);
			this._streamsheets.set(streamsheet.id, streamsheet);
			this._emitter.emit('update', 'streamsheet_added', streamsheet);
			// reflect state to streamsheet
			if (this.state === State.PAUSED) {
				streamsheet.pause();
			} else if (this.state === State.RUNNING) {
				streamsheet.start();
			}
		}
	}

	removeStreamSheet(streamsheet) {
		streamsheet.dispose();
		streamsheet.off('finishedStep', this._emitStep);
		streamsheet.machine = undefined;
		if (this._streamsheets.delete(streamsheet.id)) {
			this._emitter.emit('update', 'streamsheet_removed', streamsheet);
		}
	}

	removeAllStreamSheets() {
		this._streamsheets.forEach((streamsheet) => {
			streamsheet.dispose();
			streamsheet.machine = undefined;
		});
		this._streamsheets.clear();
		this._emitter.emit('update', 'streamsheet_removed_all');
	}

	setStreamSheetsOrder(ids = []) {
		let didIt = false;
		if (ids.length === this._streamsheets.size) {
			const neworder = new Map();
			const invalidIDs = ids.some((id) => {
				const streamsheet = this.getStreamSheet(id);
				if (streamsheet) {
					neworder.set(streamsheet.id, streamsheet);
				}
				return streamsheet == null;
			});
			if (!invalidIDs) {
				this._streamsheets = neworder;
				this._emitter.emit('update', 'streamsheets_order', ids);
				didIt = true;
			}
		}
		return didIt;
	}

	getStreamSheet(id) {
		return this._streamsheets.get(id);
	}

	getStreamSheetByName(name, caseInSensitive) {
		let streamsheet;
		caseInSensitive = !!caseInSensitive;
		name = caseInSensitive ? name.toLowerCase() : name;
		this._streamsheets.forEach((tr) => {
			const trName = caseInSensitive ? tr.name.toLowerCase() : tr.name;
			if (trName === name) streamsheet = streamsheet || tr;
		});
		return streamsheet;
	}

	async reload() {
		logger.info(`reloading streamsheets of machine: ${this.id}`);
		this._loadStreamSheets(this.streamsheets.map((t) => t.toJSON()));
		const data = {
			timestamp: new Date(),
			attached: true,
			streams: this.streamManager.configurations
		};
		this._emitter.emit('update', 'streams_reloaded', data);
	}

	notifyUpdate(type, message) {
		this._emitter.emit('update', type, message);
	}

	on(event, callback) {
		this._emitter.on(event, callback);
	}
	off(event, callback) {
		this._emitter.removeListener(event, callback);
	}

	async dispose(deleted) {
		this.stop();
		this.streamsheets.forEach((streamsheet) => streamsheet.dispose());
		this._emitter.removeAllListeners('update');
		return this.outbox.dispose(deleted);
	}

	async start() {
		if (this._state !== State.RUNNING && this._state !== State.WILL_STOP) {
			const oldstate = this._state;
			this._isManualStep = false;
			try {
				const resumed = this._state !== State.STOPPED;
				this._state = State.RUNNING;
				if (resumed) this._streamsheets.forEach((streamsheet) => streamsheet.resume());
				else this._streamsheets.forEach((streamsheet) => streamsheet.start());
				this.cyclemonitor.counterSecond = 0;
				this.cyclemonitor.last = Date.now();
				this.cyclemonitor.lastSecond = Date.now();
				this._emitter.emit('update', 'state', { new: this._state, old: oldstate });
				if (resumed) this._resume();
				else this.cycle();
				this._emitter.emit('didStart', this);
				logger.info(`Machine: -> STARTED machine ${this.id}`);
			} catch (err) {
				this._clearCycle();
				this._state = oldstate;
				throw err;
			}
		}
	}

	async stop(forced) {
		const prevstate = this._state;
		this._isManualStep = false;
		forced = forced || prevstate === State.WILL_STOP;
		if (prevstate !== State.STOPPED) {
			this._clearCycle();
			this._willStop(forced);
			this._pendingStreamSheets.clear();
			this._streamsheets.forEach((streamsheet) => {
				if (!streamsheet.stop(forced)) this._pendingStreamSheets.set(streamsheet.id, streamsheet);
			});
			if (!this._pendingStreamSheets.size) this._didStop();
			logger.info(`Machine: -> ${this._state} machine ${this.id}`);
			this._emitter.emit('update', 'state', { new: this._state, old: prevstate });
		}
	}
	finishedPending(streamsheet) {
		if (this._pendingStreamSheets.delete(streamsheet.id) && !this._pendingStreamSheets.size) {
			this._didStop();
		}
	}
	_willStop() {
		this._state = State.WILL_STOP;
		this._emitter.emit('willStop', this);
	}
	_didStop() {
		this._state = State.STOPPED;
		// DL-565 reset steps on stop...
		this.stats.steps = 0;
		this.stats.cyclesPerSecond = 0;
		// we have no listener for this one -> remove
		this._emitter.emit('didStop', this);
	}

	async pause() {
		if (this._state !== State.PAUSED && this._state !== State.WILL_STOP) {
			const oldstate = this._state;
			this._isManualStep = false;
			this._clearCycle();
			this._state = State.PAUSED;
			this.cyclemonitor.resumeIn = Date.now() - this.cyclemonitor.last;
			this.stats.cyclesPerSecond = 0;
			this.streamsheets.forEach((streamsheet) => streamsheet.pause());
			this._emitter.emit('update', 'state', { new: this._state, old: oldstate });
			logger.info(`Machine: -> PAUSED machine ${this.id}`);
		}
	}

	async step() {
		if (this._state !== State.RUNNING) {
			try {
				this._isManualStep = true;
				await this._doStep(true);
			} catch (err) {
				logger.error(`Error while performing manual step on machine ${this.id}!!`, err);
				this._emitter.emit('error', err);
			}
		}
	}

	async _doStep(manual) {
		this.stats.steps += 1;
		// wait for tasks which are triggered outside any steps, e.g. by cell replace
		await TaskQueue.done();
		this._streamsheets.forEach((streamsheet) => streamsheet.step(manual));
		await TaskQueue.done();
		// currently for testing purpose only:
		this._emitter.emit('finishedStep');
		// send step event if last emit was too long ago (important if finishedStep is never emit by sheet)
		if (Date.now() - this._lastEmitStep >= this.cycletime) this._emitStep();
	}

	async _resume() {
		const t0 = Date.now();
		this._scheduleNextCycle(t0, t0 + this.cyclemonitor.resumeIn);
	}
	async cycle() {
		this.cyclemonitor.counterSecond += 1;
		const t0 = Date.now();
		try {
			await this._doStep();
			if (this._state !== State.STOPPED) {
				// next cycle
				this._scheduleNextCycle(t0, Date.now());
				this.cyclemonitor.last = t0;
			}
		} catch (err) {
			this.stop(true);
			logger.error(`Error while performing next cycle on machine ${this.id}!! Stopped machine...`, err);
			this._emitter.emit('error', err);
		}
	}
	_scheduleNextCycle(t0, t1) {
		const last = this.cyclemonitor.last;
		const cycletime = this.cycletime;
		// if we were called after desired cycletime we try to speed up...
		const delay = Math.max(0, t0 - last - cycletime);
		const speedUp = last > 0 && delay > 0 ? delay : 0;
		const perSecond = t1 - this.cyclemonitor.lastSecond;
		if (perSecond >= 1000) {
			this.stats.cyclesPerSecond = Math.ceil(this.cyclemonitor.counterSecond / (perSecond / 1000));
			this.cyclemonitor.lastSecond = t1;
			this.cyclemonitor.counterSecond = 0;
		}
		const nextcycle = Math.max(1, cycletime - (t1 - t0) - speedUp);
		this.cyclemonitor.id = setTimeout(this.cycle, nextcycle);
	}
	_clearCycle() {
		if (this.cyclemonitor.id) {
			clearTimeout(this.cyclemonitor.id);
			this.cyclemonitor.id = null;
		}
	}

	setLastModifiedAt(timestamp, byUser) {
		this.metadata.lastModified = timestamp;
		this.metadata.lastModifiedBy = byUser || this.metadata.lastModifiedBy;
		this._emitter.emit('update', 'lastModified');
	}

	_emitStep() {
		this._emitter.emit('update', 'step');
		this._lastEmitStep = Date.now();
	}
}

module.exports = Machine;
