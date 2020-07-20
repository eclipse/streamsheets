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
const Inbox = require('./Inbox');
const MessageHandler = require('./MessageHandler');
const Sheet = require('./Sheet');
const State = require('../State');
const StreamSheetTrigger = require('./StreamSheetTrigger');
const { Reference } = require('@cedalo/parser');
const EventEmitter = require('events');
const IdGenerator = require('@cedalo/id-generator');

const getMessage = (message, selector, inbox) => {
	if (selector) {
		return inbox.find(selector);
	}
	if (message && message !== inbox.peek()) {
		inbox.put(message);
	}
	return message;
};

const setTrigger = (newTrigger, oldTrigger, streamsheet) => {
	// DL-1482 no trigger might be wanted...
	newTrigger = newTrigger || StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.NONE });
	if (oldTrigger) {
		// DL-1026 trigger settings might changed during running machine => keep previous active if old one was:
		newTrigger.isActive = newTrigger.type === oldTrigger.type && oldTrigger.isActive;
		oldTrigger.streamsheet = undefined;
	}
	newTrigger.streamsheet = streamsheet;
	return newTrigger;
};

// called on doStep()
const doTrigger = (streamsheet) => {
	const streamsheetstate = streamsheet._state;
	// if we have no machine we were removed from it...
	const machinestate = streamsheet.machine ? streamsheet.machine.state : undefined;
	if (!machinestate || streamsheetstate === State.PAUSED) {
		return false;
	}
	return (
		streamsheet._trigger.isTriggered() ||
		// on RESUMED or REPEAT we allow step without fulfilling trigger...
		streamsheetstate === State.RESUMED ||
		streamsheetstate === State.REPEAT ||
		// DL-565 allow step without fulfilling trigger only for machine-start trigger...
		((machinestate === State.STOPPED || machinestate === State.PAUSED) &&
			streamsheet._trigger.type === StreamSheetTrigger.TYPE.MACHINE_START)
	);
};

// TODO remove!! just to support old commands which send preferences property....
const valueOr = (value, defval) => (value != null ? value : defval);
const getSettings = (definition, sheet) => {
	const { preferences, settings } = definition;
	const newsettings = settings ? { ...sheet.settings, ...settings } : { ...sheet.settings };
	if (preferences) {
		newsettings.maxrow = valueOr(preferences.sheetRows, newsettings.maxrow);
		newsettings.maxcol = valueOr(preferences.sheetColumns, newsettings.maxcol);
		newsettings.protected = valueOr(preferences.sheetProtect, newsettings.protected);
	}
	return newsettings;
};

const hasLoop = (msgHandler) => msgHandler.isEnabled && msgHandler.hasLoop();

const DEF_CONF = () => ({
	name: '',
	inbox: {
		/* to be defined in inbox */
	},
	trigger: {
		type: StreamSheetTrigger.TYPE.MACHINE_START,
		repeat: 'endless' // 'once'
		/* ... additional properties  to be defined per trigger instance */
	},
	loop: {
		path: '', // JSON path to list-element within message. NOTE: may contain CellReference (Expression)
		enabled: false
	},
	sheet: {
		/* to be defined in sheet */
	}
});

class StreamSheet {
	constructor(conf = {}) {
		const config = Object.assign({ id: IdGenerator.generate() }, DEF_CONF(), conf);
		// read only private properties...
		Object.defineProperties(this, {
			stats: {
				value: {
					messages: 0,
					steps: 0,
					executesteps: 0,
					repeatsteps: 0
				}
			},
			inbox: { value: new Inbox(config.inbox), enumerable: true },
			sheet: { value: new Sheet(this), enumerable: true },
			_emitter: { value: new EventEmitter() }
		});
		// init:
		this._state = State.ACTIVE;
		this._prevstate = State.ACTIVE;
		this._applyConfig(config);
		// init & register callbacks:
		this.onInboxPop = this.onInboxPop.bind(this);
		this.onInboxClear = this.onInboxClear.bind(this);
		this.onSheetUpdate = this.onSheetUpdate.bind(this);
		this.onSheetCellRangeChange = this.onSheetCellRangeChange.bind(this);
		this.inbox.on('clear', this.onInboxClear);
		this.inbox.on('message_pop', this.onInboxPop);
		this.sheet.onUpdate = this.onSheetUpdate;
		this.sheet.onCellRangeChange = this.onSheetCellRangeChange;
		this.executeCallback = undefined;
		this._useNextLoopElement = false;
	}

	toJSON() {
		const json = {};
		json.id = this.id;
		json.name = this.name;
		json.loop = this._msgHandler.toJSON();
		json.inbox = this.inbox.toJSON();
		json.sheet = this.sheet.toJSON();
		json.trigger = this.trigger.toJSON();
		return json;
	}

	_applyConfig(config, machine) {
		this._id = config.id;
		this.name = config.name;
		this._machine = machine;
		this._msgHandler = new MessageHandler(config.loop);
		this.trigger = StreamSheetTrigger.create(config.trigger);
	}

	load(conf, machine) {
		const config = Object.assign({ id: this._id }, DEF_CONF(), conf);
		this._applyConfig(config, machine);
		this.inbox.load(config.inbox);
		this.sheet.load(config.sheet);
	}

	get id() {
		return this._id;
	}

	get name() {
		return this._name;
	}

	set name(name) {
		this._name = Reference.isValidIdentifier(name) ? name : (this._name || '');
	}

	get machine() {
		return this._machine;
	}

	set machine(machine) {
		this._machine = machine;
		this._trigger.streamsheet = this;
	}

	// checks if given message is processed. if no message is passed, check is done against current message
	isMessageProcessed(message) {
		const handler = this._msgHandler;
		if (message == null && this._trigger.isEndless && hasLoop(handler)) {
			return !handler._message || (handler._used && !(handler._index < handler._stack.length - 1));
		}
		return message == null ? handler.isProcessed : message === handler.message && handler.isProcessed;
	}

	getLoopPath() {
		return this._msgHandler.path;
	}

	setLoopPath(path) {
		this._msgHandler.path = path;
	}

	getLoopIndex() {
		return this._msgHandler.index;
	}

	getLoopIndexKey() {
		return this._msgHandler.indexKey;
	}

	getLoopCount() {
		return this._msgHandler.getLoopCount();
	}

	isLoopAvailable() {
		return this._msgHandler.isEnabled && !!this._msgHandler.hasLoop();
	}

	getMessage(id) {
		return id ? this.inbox.peek(id) : this._msgHandler.message || this.inbox.peek();
	}

	hasNewMessage() {
		// NOTE: no message, means we will use next message if inbox is not empty!
		return (
			!this.inbox.isEmpty() && (this.inbox.size > 1 || !this._msgHandler.message || !this._msgHandler.isProcessed)
		);
	}

	getCurrentLoopPath() {
		const index = this._trigger.isEndless ? 0 : 1;
		return this._msgHandler.pathForIndex(this._msgHandler._index - index);
	}

	get trigger() {
		return this._trigger;
	}

	set trigger(trigger) {
		this._trigger = setTrigger(trigger, this._trigger, this);
	}

	// on 'step', 'stepback', 'message'...
	on(event, callback) {
		this._emitter.on(event, callback);
	}

	off(event, callback) {
		this._emitter.removeListener(event, callback);
	}

	onSheetUpdate(cell, index) {
		if (this._emitter) {
			this._emitter.emit('sheet_update', cell, index);
		}
	}

	onSheetCellRangeChange() {
		if (this._emitter) {
			this._emitter.emit('sheet_cellrange_change');
		}
	}

	onSheetCellsUpdated(cells) {
		if (this._emitter && Array.isArray(cells) && cells.length > 0) {
			this._emitter.emit('sheet_cells_update', cells);
		}
	}

	onInboxClear() {
		// remove message without detach to skip event...
		this._msgHandler.message = undefined;
		this._msgHandler.reset();
	}
	onInboxPop(message) {
		// remove message without detach to skip event...
		if (this._msgHandler.message === message) {
			this._msgHandler.message = undefined;
			this._msgHandler.reset();
		}
	}

	updateSettings(newsettings) {
		this.name = newsettings.name || this._name;
		this.sheet.updateSettings(getSettings(newsettings, this.sheet));
		if (newsettings.inbox) this.inbox.update(newsettings.inbox);
		if (newsettings.loop) this._msgHandler.update(newsettings.loop);
		if (newsettings.trigger) this.trigger = StreamSheetTrigger.create(newsettings.trigger);
		this._emitter.emit('settings_update', newsettings);
	}

	dispose() {
		this._emitter.emit('dispose', this);
		this.sheet.dispose();
		this.sheet.onUpdate = undefined;
		this.sheet.onCellRangeChange = undefined;
		this.executeCallback = undefined;
		this.trigger.dispose();
		this.inbox.dispose();
		this.inbox.off('clear', this.onInboxClear);
		this._emitter.removeAllListeners('step');
		this._emitter.removeAllListeners('dispose');
		this._emitter.removeAllListeners('stepback');
		this._emitter.removeAllListeners('sheet_update');
		this._emitter.removeAllListeners('settings_update');
		this._emitter.removeAllListeners('message_attached');
		this._emitter.removeAllListeners('message_detached');
	}

	clear() {
		this.sheet.clear();
	}

	reset() {
		this.stats.steps = 0;
		this.stats.messages = 0;
		this.stats.repeatsteps = 0;
		this._msgHandler.reset();
		this._state = State.ACTIVE;
		this._prevstate = State.ACTIVE;
	}

	// called by machine...
	pause() {
		this.inbox.subscribe();
	}

	start() {
		this._detachMessage(this._msgHandler.message);
		this.inbox.clear();
		this.inbox.subscribe();
		this.sheet.getPendingRequests().clear();
	}

	stop() {
		const stopped = this.trigger.stop();
		if (stopped) {
			this.reset();
			this.inbox.unsubscribe();
			this.sheet.stopProcessing();
			this.sheet.getPendingRequests().clear();
		}
		return stopped;
	}

	// DL-1156: disabled
	// select(message, path) {
	// 	// DL-1065 (1): ignore selection for running machines...
	// 	if (message && !this.sheet.isProcessing) {
	// 		// DL-1065 (2): following happens even for a running machine if sheet is processed by execute()
	// 		// do not replace message if it was already selected -> prevent reset in msgHandler...
	// 		if (this._msgHandler.message !== message) this._msgHandler.message = message;
	// 		this._msgHandler.setLoopIndexFromPath(path);
	// 		// evaluate sheet once, but do not process sheet to prevent unwanted publish (et al.) on selection change
	// 		this.sheet.iterate(cell => cell && cell.evaluate());
	// 		this.onSheetUpdate();
	// 	}
	// }

	// TODO rename => called by return function
	stopProcessing(retval) {
		this.trigger.stop(); // return should deactivate trigger!
		this.sheet.stopProcessing(retval);
		const handler = this._msgHandler;
		if (this._state === State.ACTIVE && this.trigger.isEndless && hasLoop(handler)) {
			this._useNextLoopElement = true;
		}
	}

	execute({ message, selector }, callback) {
		const doIt = this.trigger.type === StreamSheetTrigger.TYPE.EXECUTE;
		this.executeCallback = callback;
		if (doIt) {
			const stepdata = { cmd: 'execute' };
			message = !this._reuseMessage() ? getMessage(message, selector, this.inbox) : undefined;
			this._doStep(stepdata, message);
		} else {
			this._notifyResumeCallback(false);
		}
		return doIt;
	}

	// called by registered trigger to perform a step outside machine-cycle
	triggerStep() {
		this._doStep();
	}

	step(manual) {
		const triggerType = this.trigger.type;
		// DL-1334: exclude arrival trigger on machine cycle step, because it is handled differently
		const doIt = manual || this.trigger.isEndless || triggerType !== StreamSheetTrigger.TYPE.ARRIVAL;
		if (doIt) {
			// DL-3709: force manual step on ARRIVAL sheet
			const data = manual === 'force' || (manual === true && triggerType === StreamSheetTrigger.TYPE.ARRIVAL)
				? { cmd: 'force' }
				: undefined;
			this._doStep(data);
		}
	}

	continueProcessingAt(cellindex) {
		// in case of backward jump it continues in next step otherwise directly...
		const stopped = this.sheet.continueProcessingAt(cellindex);
		if (stopped) {
			this._prevstate = this._state;
			this._state = State.CONTINUE;
		}
	}

	pauseProcessing() {
		this._prevstate = this._state;
		this._state = State.PAUSED;
		this.sheet.pauseProcessing();
	}

	// rename: used to repeat single cell...
	repeatProcessing() {
		this._prevstate = this._state;
		this._state = State.REPEAT;
		this.sheet.pauseProcessing();
	}

	resumeProcessing() {
		if (this._state === State.PAUSED || this._state === State.REPEAT) {
			this._prevstate = this._state;
			this._state = State.RESUMED;
			this.sheet.resumeProcessing();
			this._doStep();
		}
	}

	// DL-1114: WORKAROUND until next DEMO finished...
	_skipExecuteTrigger(data = {}) {
		// we are executed but wait for an execute to finish!!
		return (
			this._state === State.REPEAT &&
			this.trigger.type === StreamSheetTrigger.TYPE.EXECUTE &&
			(!data || data.cmd !== 'execute')
		); // hint: signals that we are called by normal step!
	}

	_doStep(data, message) {
		let result;
		const sheet = this.sheet;
		const prevstate = this._prevstate;
		const firstTime = !this._trigger.isActive;
		const forceStep = data && data.cmd === 'force';
		// DL-3719 workaround to prevent moving loop-index twice in same step
		this._nxtResumed = false;
		// (DL-531): reset repeat-steps on first cycle...
		if (firstTime) this.stats.repeatsteps = 0;
		this._trigger.preProcess(data);
		const skipTrigger = this._skipExecuteTrigger(data);
		if (forceStep || (!skipTrigger && doTrigger(this))) {
			if (this._state === State.ACTIVE && this._useNextLoopElement) {
				this._useNextLoopElement = false;
				this._msgHandler.next();
			}
			// DL-1114 executestep is now updated by execute.js
			// if (data && data.cmd === 'execute' && this._state !== State.REPEAT) this.stats.executesteps += 1;
			if (this._state === State.REPEAT) {
				result = sheet.startProcessing();
			} else if (this._state === State.RESUMED) {
				result = this._resume();
			} else if (this._state === State.CONTINUE) {
				result = this._continueProcess();
			} else if (sheet.isPaused || sheet.isResumed) {
				result = this._waitProcess();
			} else {
				result = this._process(message);
			}
			this._emitter.emit('step', this);
			// check state transitions to decide if next loop element should be taken  => PLEASE REWRITE COMPLETELY!!
			const nextLoopElement =
				this._state === State.ACTIVE &&
				// do not take next loop if sheet is waiting...
				!(sheet.isPaused || sheet.isResumed) &&
				// note: transition from repeat might processed sheet completely!
				(this._prevstate !== State.RESUMED || (prevstate === State.REPEAT && !sheet.isProcessing));
			if (nextLoopElement && (!this._trigger.isEndless || !hasLoop(this._msgHandler))) {
				this._msgHandler.next();
			}
		}
		this._trigger.postProcess(data);
		this._didStep(result);
		return result;
	}
	_resume() {
		this._prevstate = this._state;
		this._state = State.ACTIVE;
		return this.sheet.startProcessing();
	}

	_continueProcess() {
		this._updateStatsOnTrigger();
		this._prevstate = this._state;
		this._state = State.ACTIVE;
		return this.sheet.startProcessing();
	}

	_waitProcess() {
		return this.sheet.startProcessing();
	}

	_process(message) {
		this._updateStatsOnTrigger();
		this._attachNewMessage(message);
		// JSG-105: delete all drawings before step now:
		this.sheet.getDrawings().removeAll();
		return this.sheet.startProcessing();
	}
	_didStep(result) {
		if (this._state !== State.PAUSED) {
			this._detachIfProcessed();
			this._notifyResumeCallback(result);
		}
		this._prevstate = this._state;
	}

	_updateStatsOnTrigger() {
		this.stats.steps += 1;
		this.stats.repeatsteps += this._trigger.isEndless ? 1 : 0;
	}
	_reuseMessage() {
		const { trigger } = this;
		return (
			trigger.isActive &&
			trigger.isEndless &&
			(trigger.type === StreamSheetTrigger.TYPE.ARRIVAL || hasLoop(this._msgHandler))
		);
	}
	_detachIfProcessed() {
		if (this._msgHandler.isProcessed) {
			// (DL-508) reuse message if endless mode and trigger type arrival:
			if (this._reuseMessage()) {
				this._msgHandler.reset();
			} else {
				// this._detachMessage(this._msgHandler.message);
				this._emitMessageEvent('message_detached', this._msgHandler.message);
			}
		}
	}
	_attachNewMessage(message) {
		if (this._msgHandler.isProcessed) {
			const currmsg = this._msgHandler.message;
			if (currmsg) {
				if (currmsg === message) {
					this._msgHandler.reset();
				} else if (this.inbox.size > 1) {
					this.inbox.pop(currmsg.id);
					this._msgHandler.message = undefined;
				}
			}
		}
		if (!this._msgHandler.message) {
			this._attachMessage(message || this.inbox.peek());
		}
	}
	_attachMessage(message) {
		this.stats.messages += message ? 1 : 0;
		this._msgHandler.message = message;
		this._emitMessageEvent('message_attached', message);
	}
	_detachMessage(message) {
		this._msgHandler.message = undefined;
		this._emitMessageEvent('message_detached', message);
	}

	_emitMessageEvent(type, message) {
		if (message) {
			this._emitter.emit(type, message.id, this);
		}
	}

	_notifyResumeCallback(retval) {
		if (this.executeCallback && !this._trigger.isActive && this._state !== State.REPEAT) {
			this.executeCallback(retval, this);
			this.executeCallback = undefined;
		}
	}

	// notifies all registered observers which listen to messages of specified type
	notify(type, msg) {
		this._emitter.emit(type, msg, this);
	}
}

module.exports = StreamSheet;
