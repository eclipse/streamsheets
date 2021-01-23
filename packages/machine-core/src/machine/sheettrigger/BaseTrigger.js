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
const { NoOpCycle } = require('./cycles');


const DEF_CONF = {
	repeat: 'once'
};


class BaseTrigger {
	constructor(config = {}) {
		this.config = Object.assign({}, DEF_CONF, config);
		this._activeCycle = new NoOpCycle(this, true);
		this._streamsheet = undefined;
		// tmp. only:
		this._isStarted = false;
		// flag to prevent processing twice on manual stepping if this comes before triggering sheet
		// this._hasTriggered = false;
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
		const machine = this._streamsheet.machine;
		return machine == null || !machine.isRunning;
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
		this.activeCycle.dispose();
		this.activeCycle = new NoOpCycle(this, true);
		if (this.sheet.isPaused) this.resumeProcessing();
		// this.stopProcessing();
		this._streamsheet = undefined;
	}

	// update only called if config might has changed! we have same trigger
	update(config = {}) {
		const hadEndless = this.isEndless;
		this.config = Object.assign(this.config, config);
		if (hadEndless !== this.isEndless) {
			// stop running in endless mode
			this.activeCycle.stop();
		}
	}

	getManualCycle() {
		return new NoOpCycle(this, true);
	}
	getTimerCycle() {
		return new NoOpCycle(this, false);
	}

	// MACHINE CONTROL METHODS
	pause() {
		// do not pause sheet process => should be done by functions only
		// this.sheet._pauseProcessing(); // _interruptProcessing();
		this.activeCycle.clear();
	}

	resume() {
		// ignore if sheet is still paused by function
		if (!this.sheet.isPaused) {
			// console.log(`RESUME TRIGGER ${this.streamsheet.name}`);
			// switch to timer cycle:
			if (this.activeCycle.isManual) this.activeCycle = this.getTimerCycle();
			// schedule next cycle:
			this.activeCycle.schedule();
			// go on with current step:
			if (this._isStarted  && this.sheet.isNotFullyProcessed) {
				// console.log(`RESUME ${this.streamsheet.name}`);
				this.sheet._resumeProcessing();
				this.processSheet(false);
			}
			this._isStarted = false;
		}
	}

	start() {
		this._isStarted = true;
		// console.log(`=== START ${this.streamsheet.name} ===`)
		if (this.activeCycle.isManual) this.activeCycle = this.getTimerCycle();
	}

	stop() {
		// console.log(`=== STOP ${this.streamsheet.name} ===`)
		// clear instead of stop to not trigger possible resume
		this.activeCycle.clear();
		this.sheet._stopProcessing();
		// important! this forces stop/clear if a timer-cycle (e.g. activated parent) is still active...
		if (!this.activeCycle.isManual) this.activeCycle = this.getManualCycle();
		return true;
	}

	step(manual) {
		if (manual) {
			if (!this.activeCycle.isManual) {
				this.activeCycle = this.getManualCycle();
			}
			// sheet might not fully processed due to pause[Processing]/resume[Processing]
			if (this.sheet.isNotFullyProcessed) {
				this.processSheet(false);
			}
		} 
		// if sheet is not paused by function it might be by machine...
		if (!this.sheet.isPaused && (!this.isMachineStopped || (this.activeCycle.isManual))) { // && !this._hasTriggered))) {
			// console.log(`STEP ${this.streamsheet.name}`);
			this.activeCycle.step();
			// console.log(`DONE STEP ${this.streamsheet.name}`);
		}
	}
	// –

	// SHEET CONTROL METHODS
	pauseProcessing() {
		this.activeCycle.clear();
		this.sheet._pauseProcessing();
	}
	resumeProcessing(retval) {
		// mark sheet as resumed and finish current step
		this.sheet._resumeProcessing(retval);
		// resume cycle if machine runs
		if (!this.isMachineStopped || this.activeCycle.isManual) {
			this.activeCycle.resume();
		}
	}
	stopProcessing(retval) {
		this.sheet._stopProcessing(retval);
		this.activeCycle.stop();
	}
	// ~

	// TODO: REVIEW -> which of following methods still needed?
	processSheet(useNextMessage = true) {
		useNextMessage =
			useNextMessage &&
			!this.isEndless &&
			this._streamsheet.isMessageProcessed() &&
			(this.sheet.isReady || this.sheet.isProcessed);
		// this._hasTriggered = true;
		this._streamsheet.process(useNextMessage);
		// reset if finished
		// if (this.sheet.isProcessed) {
		// 	this.sheet.processor.reset();
		// }
	}
	preStep(manual) {
		// this._hasTriggered = false;
	}
	postStep(/* manual */) {}
	// ~
}

module.exports = BaseTrigger;
