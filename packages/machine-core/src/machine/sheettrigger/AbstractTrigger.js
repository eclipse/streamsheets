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
const clearTrigger = (trigger) => {
	const cleared = !!trigger._stepId;
	if (cleared) {
		clearImmediate(trigger._stepId);
		trigger._stepId = undefined;
	}
	return cleared;
};

const repeatTrigger = (trigger) => {
	trigger._stepId = setImmediate(trigger._repeatStep);
};
const DEF_CONF = {
	repeat: 'once'
};

class AbstractTrigger {
	constructor(config = {}) {
		this.config = Object.assign({}, DEF_CONF, config);
		this.isActive = false;
		// to prevent 2x resume in same step! => happens with execute in switched order
		this.isResumed = false;
		this.isManualStep = false;
		this._stepId = undefined;
		this._streamsheet = undefined;
		this._repeatStep = this._repeatStep.bind(this);
	}

	toJSON() {
		return Object.assign({}, this.config);
	}

	get type() {
		return this.config.type;
	}

	get isEndless() {
		return this.config.repeat === 'endless';
	}

	get isRepeating() {
		return !!this._stepId;
	}

	get sheet() {
		return this._streamsheet.sheet;
	}

	set streamsheet(streamsheet) {
		this._streamsheet = streamsheet;
	}

	// called by streamsheet. signals that it will be removed. trigger should perform clean up here...
	dispose() {
		if (this.sheet.isPaused) this.resumeProcessing();
		this.stopProcessing(undefined, true);
		this._streamsheet = undefined;
	}

	update(config = {}) {
		this.config = Object.assign(this.config, config);
		if (!this.isEndless && clearTrigger(this)) this.resume();
	}

	// CONTROL METHODS
	pause() {
		clearTrigger(this);
	}

	resume() { // called by machine: from pause to start
		// if sheet is not paused by function 
		if (!this.isResumed && !this.sheet.isPaused) {
			this.isResumed = true;
			if (this.isEndless) this._finishRepeatStep();
			else this._finishStep();
		}
	}

	start() {
		// reset stats?
	}
	// TODO: remove all passed flags!!!
	stop(onUpdate, onProcessing) {
		clearTrigger(this);
		this.isActive = false;
		this._streamsheet.stats.repeatsteps = 0;
		if (!onUpdate) this.sheet._stopProcessing();
		return true;
	}
	stopProcessing(retval, onDispose) {
		this.stop(onDispose, true);
		this.sheet._stopProcessing(retval);
	}
	pauseProcessing() {
		this.sheet._pauseProcessing();
		clearTrigger(this);
	}
	resumeProcessing(doFinish, retval) {
		if (!this.isResumed && this.sheet.isPaused) {
			this.isResumed = true;
			this.sheet._resumeProcessing(retval);
			if (this.isManualStep) this._finishStep();
			else if (this.isEndless) this._finishRepeatStep();
			else if (doFinish) this._finishStep();
		}
	}
	_finishStep() {
		if (!this.sheet.isProcessed) this._streamsheet.triggerStep();
	}
	_finishRepeatStep() {
		if (!this.sheet.isProcessed) {
			this._streamsheet.triggerStep();
			repeatTrigger(this);
		}
	}

	preStep(manual) {
		this.isResumed = false;
		this.isManualStep = manual;
	}
	step(/* manual */) {}
	postStep(/* manual */) {
		this.isManualStep = false;
	}

	_startRepeat() {
		repeatTrigger(this);
		this._streamsheet.stats.steps += 1;
		// on repeat start we do a normal cycle!
		this.doCycleStep();
	}
	_repeatStep() {
		repeatTrigger(this);
		// trigger step afterwards, because it might clears current scheduled one!!!
		this.doRepeatStep();
	}
	trigger() {
		this.isActive = true;
		if (!this.isResumed && this._stepId == null) {
			// do not start repetition again if isPaused by function!
			if (!this.isManualStep && this.isEndless && !this.sheet.isPaused) this._startRepeat();
			else this.doCycleStep();
		}
	}
	doCycleStep() {
		// we come here on manual step for repeating too, so:
		if (!this.sheet.isPaused) {
			if (this.isEndless) {
				this._streamsheet.stats.repeatsteps += 1;
				if (this.isManualStep) this._streamsheet.stats.steps += 1;
			} else {
				this._streamsheet.stats.steps += 1;
			}
		}
		this._streamsheet.triggerStep();
		this.isActive = this.sheet.isPaused;
	}
	doRepeatStep() {
		this._streamsheet.stats.repeatsteps += 1;
		this._streamsheet.triggerStep();
		this.isActive = this.sheet.isPaused;
	}
}

module.exports = AbstractTrigger;