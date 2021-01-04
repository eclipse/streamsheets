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
const State = require('../../State');
const AbstractTrigger = require('./AbstractTrigger');

const preventStop = (doIt, streamsheet) => {
	const machine = streamsheet && streamsheet.machine;
	if (machine) machine.preventStop = doIt;
};

class MachineTrigger extends AbstractTrigger {
	constructor(config) {
		super(config);
		this.doStopEndless = false;
		this.isStopFulFilled = false;
	}

	set streamsheet(streamsheet) {
		super.streamsheet = streamsheet;
		const { machine } = streamsheet;
		if (machine && machine.state === State.RUNNING) this.start();
	}

	start() {
		this.doStopEndless = false;
		this.isStopFulFilled = false;
		if (this.type === MachineTrigger.TYPE_START) this.trigger();
	}

	stop(onProcessing) {
		if (!onProcessing && this.type === MachineTrigger.TYPE_STOP && !this.isStopFulFilled) {
			this.isStopFulFilled = true;
			this.trigger();
			return !this.isEndless;
		}
		this.doStopEndless = this.isStopFulFilled;
		return super.stop(onProcessing);
	}

	stopProcessing(retval, onDispose) {
		this.doStopEndless = true;
		super.stopProcessing(retval, onDispose);
	}
	step(manual) {
		if (manual && this.type === MachineTrigger.TYPE_START) this.trigger();
		preventStop(this.isEndless && !this.doStopEndless, this._streamsheet);
	}

	doCycleStep() {
		preventStop(this.isEndless && !this.doStopEndless, this._streamsheet);
		super.doCycleStep();
	}
	doRepeatStep() {
		preventStop(!this.doStopEndless, this._streamsheet);
		super.doRepeatStep();
	}
}
MachineTrigger.TYPE_START = 'start';
MachineTrigger.TYPE_STOP = 'stop';
// MachineTrigger.TYPE_STARTSTOP = 'startstop';

module.exports = MachineTrigger;
