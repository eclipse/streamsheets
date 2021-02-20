/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const State = require('../../State');
const { NoOpCycle } = require('./cycles');

const configManualCycle = (manualCycle, activeCycle) => {
	if (activeCycle.isMessageLoopCycle) return manualCycle.getMessageLoopCycle();
	return activeCycle.isRepeatUntilCycle ? manualCycle.getMessageLoopCycle().getRepeatUntilCycle() : manualCycle;
};

const DEF_CONF = {
	repeat: 'once'
};

class BaseTrigger {
	constructor(config = {}) {
		this.config = Object.assign({}, DEF_CONF, config);
		this._activeCycle = new NoOpCycle(this, true);
		this._streamsheet = undefined;
	}

	toJSON() {
		return Object.assign({}, this.config);
	}

	get type() {
		return this.config.type;
	}

	get activeCycle() {
		return this._activeCycle;
	}

	set activeCycle(cycle) {
		if (cycle !== this._activeCycle) {
			this._activeCycle.clear();
			this._activeCycle = cycle;
		}
	}

	get isEndless() {
		return this.config.repeat === 'endless';
	}

	get isMachineStopped() {
		const state = this.machine.state;
		// support streamsheets running on stop()
		return state !== State.WILL_STOP && state !== State.RUNNING;
	}

	get machine() {
		return this._streamsheet.machine;
	}

	get sheet() {
		return this._streamsheet.sheet;
	}

	get streamsheet() {
		return this._streamsheet;
	}

	set streamsheet(streamsheet) {
		this._streamsheet = streamsheet;
	}

	// called by streamsheet. signals that it will be removed. trigger should perform clean up here...
	dispose() {
		this.activeCycle = this.getManualCycle();
		if (this.sheet.isPaused) this.resumeProcessing();
		this._streamsheet = undefined;
	}

	// update only called if config might has changed! we have same trigger
	update(config = {}) {
		const hadEndless = this.isEndless;
		this.config = Object.assign(this.config, config);
		// stop running in endless mode
		if (hadEndless !== this.isEndless) this.activeCycle.stop();
	}

	getManualCycle() {
		return new NoOpCycle(this, true);
	}
	getTimerCycle() {
		return new NoOpCycle(this, false);
	}

	processSheet() {
		if (this._streamsheet.messageHandler.isProcessed) this._streamsheet.attachNextMessage();
		// no messageHandler.next() here because of "repeat until..." which uses same loop element
		this._streamsheet.process();
	}

	didProcessSheet() {
		this.activeCycle.didProcessSheet();
	}

	// MACHINE CONTROL METHODS
	pause() {
		// do not pause sheet process => should be done by functions only
		// this.sheet._pauseProcessing();
		this.activeCycle.clear();
	}
	resume() {
		// ignore if sheet is still paused by function
		if (!this.sheet.isPaused) {
			// switch to timer cycle:
			if (this.activeCycle.isManual) this.activeCycle = this.getTimerCycle();
			// schedule next cycle:
			this.activeCycle.schedule();
			// go on with current step:
			if (!this.sheet.isProcessed) {
				this.sheet._resumeProcessing();
				this.processSheet();
			}
		}
	}
	start() {
		if (this.activeCycle.isManual) this.activeCycle = this.getTimerCycle();
	}
	stop(/* forced */) {
		// clear instead of stop to not trigger possible resume
		this.activeCycle.clear();
		this.sheet._stopProcessing();
		// reset active-cycle to timer-cycle to support sheets running on machine stop!!
		this.activeCycle = this.getTimerCycle();
		return true;
	}
	step(manual) {
		if (manual && !this.activeCycle.isManual) {
			this.activeCycle = configManualCycle(this.getManualCycle(), this.activeCycle);
		}
		// if sheet is not paused by function it might be by machine...
		if (!this.isMachineStopped || this.activeCycle.isManual) {
			this.activeCycle.step();
		}
	}
	// –

	// SHEET CONTROL METHODS
	pauseProcessing() {
		this.activeCycle.clear();
		this.sheet._pauseProcessing();
	}
	resumeProcessing(retval) {
		// mark sheet as resumed
		this.activeCycle.resume(retval);
		// ...and maybe finish current step
		const doFinishStep = !this.sheet.isProcessed && (this.machine.isManualStep || !this.isMachineStopped);
		if (doFinishStep) this.processSheet();
		else this.activeCycle.didProcessSheet();
		return doFinishStep;
	}
	stopProcessing(retval) {
		this.sheet._stopProcessing(retval);
		this.activeCycle.stop();
	}
	// ~
}

module.exports = BaseTrigger;
