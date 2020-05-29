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
const State = require('../State');

const random = (nr) => Math.floor(Math.random() * Math.floor(nr));

// NOTE: instances should be created with StreamSheetTrigger.create
class StreamSheetTrigger {
	constructor(config = {}) {
		this.config = Object.assign({}, config);
		this.isActive = false;
		this._streamsheet = undefined;
		this._repeat = this.config.repeat || 'once';
	}

	toJSON() {
		return Object.assign({}, this.config);
	}

	get type() {
		return this.config.type;
	}

	get isEndless() {
		return this._repeat === 'endless';
	}

	set streamsheet(streamsheet) {
		this._streamsheet = streamsheet;
	}

	// called by streamsheet. signals that it will be removed. trigger should perform clean up here...
	dispose() {}

	update(config = {}) {
		this.config = Object.assign(this.config, config);
		this._repeat = this.config.repeat || 'once';
	}

	preProcess() {}

	isTriggered() {
		return this.isEndless;
	}

	postProcess() {}

	// DL-654
	stop() {
		this.isActive = false;
		return true;
	}
}

class ArrivalTrigger extends StreamSheetTrigger {
	constructor(config) {
		super(config);
		this.isFulFilled = false;
		this.stepId = undefined;
		this.triggerStep = this.triggerStep.bind(this);
		this._onMessagePut = this._onMessagePut.bind(this);
	}

	set streamsheet(streamsheet) {
		this._unsubscribe(this._streamsheet);
		super.streamsheet = this._subscribe(streamsheet);
		// start trigger if inbox already has messages...
		if (streamsheet && !streamsheet.inbox.isEmpty()) this.triggerStep();
	}

	_onMessagePut() {
		// ignore if we are in our own step cycle or in endless mode (since it uses always current message)...
		if (!this.stepId && !this.isEndless) {
			this.stepId = setImmediate(this.triggerStep);
		}
	}

	triggerStep() {
		this.stepId = undefined;
		const machine = this._streamsheet.machine;
		if (machine.state === State.RUNNING) {
			this._streamsheet.triggerStep();
			// trigger a (fake ;-] ) machine step event because client can handle those...
			machine.notifyUpdate('step'); // <-- NOTE: this is important for EXECUTE-trigger too!!
			// (DL-508) endless mode reuse current message => prevent trigger ourselves twice (done by machine-cycle)
			if (!this.isEndless && this._streamsheet.hasNewMessage()) {
				this.stepId = setImmediate(this.triggerStep);
			}
		}
	}

	_subscribe(streamsheet) {
		if (streamsheet) {
			streamsheet.inbox.on('message_put', this._onMessagePut);
			// some tests use streamsheet without machine
			if (streamsheet.machine) streamsheet.machine.on('didStart', this.triggerStep);
		}
		return streamsheet;
	}

	_unsubscribe(streamsheet) {
		clearImmediate(this.stepId);
		this.stepId = undefined;
		if (streamsheet) {
			streamsheet.inbox.off('message_put', this._onMessagePut);
			// some tests use streamsheet without machine
			if (streamsheet.machine) streamsheet.machine.off('didStart', this.triggerStep);
		}
	}

	dispose() {
		this._unsubscribe(this._streamsheet);
	}

	preProcess() {
		this.isFulFilled = this._streamsheet && this._streamsheet.hasNewMessage();
		this.isActive = this.isActive || this.isFulFilled;
	}

	isTriggered() {
		return this.isActive && (this.isFulFilled || this.isEndless);
	}

	postProcess() {
		this.isFulFilled = false;
	}
}

const TIMER_DEF = {
	interval: 500,
	intervalUnit: 'ms'
};

const UNITS = {};
UNITS.ms = 1;
UNITS.s = 1000 * UNITS.ms;
UNITS.m = 60 * UNITS.s;
UNITS.h = 60 * UNITS.m;
UNITS.d = 24 * UNITS.h;

const parseTime = (time) => {
	const ms = Date.parse(time);
	return ms == null || isNaN(ms) ? null : ms;
};

class TimerTrigger extends StreamSheetTrigger {
	// call registered callback on given interval and with random distributed ticks
	constructor(config) {
		super(Object.assign({}, TIMER_DEF, config));
		this.nextTrigger = undefined;
		this.lastTrigger = undefined;
		this.startTrigger = config.start;
	}

	update(config = {}) {
		Object.assign(this.config, config);
		this.startTrigger = config.start;
	}

	set startTrigger(value) {
		this._startTrigger = parseTime(value) || Date.now();
	}

	get startTrigger() {
		return this._startTrigger;
	}

	getNextTrigger() {
		if (this.nextTrigger == null) {
			const interval = this.config.type === 'random' ? random(2 * this.config.interval) : this.config.interval;
			this.nextTrigger = interval * UNITS[this.config.intervalUnit];
		}
		return this.nextTrigger;
	}

	preProcess() {
		this.isActive = this.isActive || Date.now() >= this.startTrigger;
	}

	isTriggered() {
		// trigger it if active and if we are in next trigger range
		const triggered =
			this.isActive && (this.lastTrigger == null || Date.now() - this.lastTrigger >= this.getNextTrigger());
		if (triggered) {
			this.nextTrigger = undefined;
			this.lastTrigger = Date.now();
		}
		return triggered;
	}
}

class MachineTrigger extends StreamSheetTrigger {
	constructor(config) {
		super(config);
		this.isFulFilled = false;
		this.onWillStop = this.onWillStop.bind(this);
		this.onWillStart = this.onWillStart.bind(this);
	}

	set streamsheet(streamsheet) {
		this.unregister(this._streamsheet && this._streamsheet.machine);
		this.register(streamsheet && streamsheet.machine);
		super.streamsheet = streamsheet;
	}

	dispose() {
		this.unregister(this._streamsheet.machine);
	}

	unregister(machine) {
		if (machine) {
			machine.off('willStop', this.onWillStop);
			machine.off('willStart', this.onWillStart);
		}
	}

	register(machine) {
		if (machine) {
			machine.on('willStop', this.onWillStop);
			machine.on('willStart', this.onWillStart);
			// DL-2241: are we fulfilled already?
			this.isFulFilled = this.type === 'start' && machine.state === State.RUNNING;
		}
	}

	stop() {
		// to break endless mode on second stop request its sufficient to check isFulFilled state
		const stopMe = this.type === 'start' || !this.isFulFilled;
		return stopMe && super.stop();
	}

	onWillStop() {
		this.isFulFilled = this.type === 'stop' || this.type === 'startstop';
	}

	onWillStart() {
		this.isFulFilled = this.type === 'start' || this.type === 'startstop';
	}

	preProcess() {
		this.isActive = this.isActive || this.isFulFilled;
	}

	isTriggered() {
		return this.isActive && (this.isFulFilled || this.isEndless);
	}

	postProcess() {
		// we triggered only once if we are fulfilled once
		const triggered = this.isActive && this.isFulFilled;
		const machine = this._streamsheet && this._streamsheet.machine;
		this.isFulFilled = false;
		this.isActive = triggered ? this.isEndless : this.isActive;
		if (machine) machine.preventStop = this.isActive;
	}
}

class ExecuteTrigger extends StreamSheetTrigger {
	constructor(config) {
		super(config);
		// flag & callback used to prevent second execution if it was executed already (DL-1663)
		this.isProcessed = false;
		this.onMachineUpdate = this.onMachineUpdate.bind(this);
	}

	set streamsheet(streamsheet) {
		this.unregister(this._streamsheet && this._streamsheet.machine);
		this.register(streamsheet && streamsheet.machine);
		super.streamsheet = streamsheet;
	}

	dispose() {
		this.unregister(this._streamsheet.machine);
	}

	unregister(machine) {
		if (machine) machine.off('update', this.onMachineUpdate);
	}

	register(machine) {
		if (machine) machine.on('update', this.onMachineUpdate);
	}

	onMachineUpdate(type) {
		if (type === 'step') this.isProcessed = false;
	}

	stop() {
		this.isProcessed = false;
		return super.stop();
	}

	preProcess(data) {
		this.isActive = this.isActive || (!!data && data.cmd === 'execute');
	}

	isTriggered() {
		return this.isActive && !this.isProcessed;
	}

	postProcess() {
		this.isProcessed = this.isActive;
		// we stay active if we are in endless mode and not stopped otherwise we are done
		this.isActive = this.isActive && this.isEndless;
	}
}

class OneTimeTrigger extends StreamSheetTrigger {
	constructor(config) {
		super(config);
		this.triggered = false;
	}

	stop() {
		this.triggered = false;
		return super.stop();
	}

	preProcess() {
		this.isActive = !this.triggered || this.isEndless;
		this.triggered = true;
	}

	isTriggered() {
		return this.isActive;
	}
}
// because  endless behaviour changed...
class AlwaysTrigger extends StreamSheetTrigger {
	isTriggered() {
		return true;
	}
}
class NoneTrigger extends StreamSheetTrigger {
	isTriggered() {
		return false;
	}
}

StreamSheetTrigger.TYPE = {
	ARRIVAL: 'arrival',
	EXECUTE: 'execute',
	MACHINE_START: 'start',
	MACHINE_STARTSTOP: 'startstop',
	MACHINE_STOP: 'stop',
	NONE: 'none',
	RANDOM: 'random',
	TIMER: 'time',
	// currently for debugging purpose only
	ONCE: 'once',
	ALWAYS: 'always'
};
// factory function for StreamSheetTriggers...
StreamSheetTrigger.create = (config = {}) => {
	let trigger;
	config.type = config.type || StreamSheetTrigger.TYPE.ARRIVAL;
	switch (config.type) {
		case StreamSheetTrigger.TYPE.TIMER:
		case StreamSheetTrigger.TYPE.RANDOM:
			trigger = new TimerTrigger(config);
			break;
		case StreamSheetTrigger.TYPE.MACHINE_STOP:
			trigger = new MachineTrigger(config);
			break;
		case StreamSheetTrigger.TYPE.MACHINE_START:
			trigger = new MachineTrigger(config);
			break;
		case StreamSheetTrigger.TYPE.MACHINE_STARTSTOP:
			trigger = new MachineTrigger(config);
			break;
		case StreamSheetTrigger.TYPE.NONE:
			trigger = new NoneTrigger(config);
			break;
		case StreamSheetTrigger.TYPE.EXECUTE:
			trigger = new ExecuteTrigger(config);
			break;
		case StreamSheetTrigger.TYPE.ONCE:
			trigger = new OneTimeTrigger(config);
			break;
		case StreamSheetTrigger.TYPE.ALWAYS:
			trigger = new AlwaysTrigger(config);
			break;
		default:
			trigger = new ArrivalTrigger(config);
	}
	return trigger;
};

module.exports = StreamSheetTrigger;
