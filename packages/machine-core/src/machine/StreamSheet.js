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
const IdGenerator = require('@cedalo/id-generator');
const { Reference } = require('@cedalo/parser');
const Inbox = require('./Inbox');
const MessageHandler = require('./MessageHandler');
const Sheet = require('./Sheet');
const TriggerFactory = require('./sheettrigger/TriggerFactory');


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
		type: TriggerFactory.TYPE.CONTINUOUSLY,
		repeat: 'once'
		// type: TriggerFactory.TYPE.MACHINE_START,
		// repeat: 'endless' // 'once'
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
		this.trigger = TriggerFactory.create(config.trigger);
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
		this._name = Reference.isValidIdentifier(name) ? name : this._name || '';
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
		return this.inbox.size > 1 || !this._msgHandler.isProcessed;
	}


	getCurrentLoopPath() {
		const index = this._trigger.isEndless ? 0 : 1;
		return this._msgHandler.pathForIndex(this._msgHandler._index - index);
	}

	get trigger() {
		return this._trigger;
	}
	set trigger(trigger) {
		// DL-1482 no trigger might be wanted...
		// DL-1026 trigger settings might changed during running machine => keep previous active if old one was:
		if (!trigger) trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.NONE });
		if (this._trigger) {
			if (trigger.type === this._trigger.type) this._trigger.update(trigger.config);
			else {
				this._trigger.dispose();
				this._trigger = undefined;
			}
		}
		if (!this._trigger) {
			// register new trigger:
			this._trigger = trigger;
			this._trigger.streamsheet = this;
		}
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
		if (newsettings.trigger) this.trigger = TriggerFactory.create(newsettings.trigger);
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
	}

	// called by machine:
	pause() {
		this.inbox.subscribe();
		this.trigger.pause();
	}
	resume() {
		this.trigger.resume();
	}
	start() {
		this._detachMessage(this._msgHandler.message);
		this.inbox.clear();
		this.inbox.subscribe();
		this.sheet.getPendingRequests().clear();
		this.trigger.start();
	}
	stop() {
		const stopped = this.trigger.stop();
		if (stopped) {
			this.reset();
			this.inbox.unsubscribe();
			this.sheet.getPendingRequests().clear();
		}
		return stopped;
	}

	preStep(manual) {
		this.trigger.preStep(manual);
	}
	step(manual) {
		this.trigger.step(manual);
	}
	postStep(manual) {
		this.trigger.postStep(manual);
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

	// called by sheet functions:
	execute(message, selector, resumeFn) {
		if (this.trigger.type === TriggerFactory.TYPE.EXECUTE) {
			message = selector ? this.inbox.find(selector) : message;
			// attach message?
			if (message) this._attachExecuteMessage(message);
			this.trigger.execute(resumeFn);
			return true;
		}
		return false;
	}
	cancelExecute() {
		if (this.trigger.type === TriggerFactory.TYPE.EXECUTE) this.trigger.cancelExecute();
	}
	continueProcessingAt(cellindex) {
		this.sheet._continueProcessingAt(cellindex);
	}
	stopProcessing(retval) {
		this.trigger.stopProcessing(retval);
		if (this.trigger.isEndless) this._msgHandler.next();
	}
	pauseProcessing() {
		this.trigger.pauseProcessing();
	}
	// rename: used to repeat single cell...
	repeatProcessing() {
		this.sheet._pauseProcessing();
	}	
	resumeProcessing(finish, retval) {
		this.trigger.resumeProcessing(finish, retval);
	}
	// ~

	triggerStep() {
		// track re-entry caused e.g. by resume on sheet._startProcessing()
		this.triggerStep.processed = this.triggerStep.processed || {};
		this.triggerStep.processed[this.id] = false;
		if (this.sheet.isReady || this.sheet.isProcessed) this._attachNextMessage();
		this.sheet.getDrawings().removeAll();
		this.sheet._startProcessing();
		if (!this.triggerStep.processed[this.id]) {
			this.triggerStep.processed[this.id] = true;
			// on endless we reuse message
			if (this.sheet.isProcessed && !this.trigger.isEndless) {
				this._msgHandler.next();
			}
		}
		this._detachMessage();
		this._emitter.emit('step', this);
	}
	_attachNextMessage() {
		if (this._msgHandler.isProcessed) {
			const currmsg = this._msgHandler.message;
			if (currmsg && this.inbox.size > 1) {
				this.inbox.pop(currmsg.id);
				this._msgHandler.message = undefined;
			}
		}
		if (!this._msgHandler.message) {
			this._attachMessage(this.inbox.peek());
		}
	}
	_attachMessage(message) {
		this._msgHandler.message = message;
		if (message) {
			this.stats.messages += 1;
			this._emitMessageEvent('message_attached', message);
		}
	}
	_attachExecuteMessage(message) {
		// use passed message only if current one is processed otherwise they might pile up quickly (on endless-mode)
		if (this._msgHandler.isProcessed) {
			const currmsg = this._msgHandler.message;
			if (message === currmsg) this._msgHandler.reset();
			else {
				if (currmsg) this.inbox.pop(currmsg.id);
				this.inbox.put(message);
				this._attachMessage(message);
			} 
		}
	}
	_detachMessage() {
		// get mark message as detached if its processed
		if (this._msgHandler.isProcessed) {
			// only send event, message will be popped from inbox on attach, so it still can be queried !!
			this._emitMessageEvent('message_detached', this._msgHandler.message);
		}
	}

	_emitMessageEvent(type, message) {
		if (message) {
			this._emitter.emit(type, message.id, this);
		}
	}

	// notifies all registered observers which listen to messages of specified type
	notify(type, msg) {
		this._emitter.emit(type, msg, this);
	}

	// forces sheet_update event:
	notifySheetUpdate(cell, index) {
		this._emitter.emit('sheet_update', cell, index);
	}
}

module.exports = StreamSheet;
