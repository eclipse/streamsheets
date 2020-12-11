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

// base trigger
class AbstractStreamSheetTrigger {
	// review TICKETS:
	// DL-654
	// DL-531: reset repeat-steps on first cycle...

	constructor(config = {}) {
		this.config = Object.assign({}, DEF_CONF, config);
		this.isActive = false;
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

	set streamsheet(streamsheet) {
		this._streamsheet = streamsheet;
	}

	// called by streamsheet. signals that it will be removed. trigger should perform clean up here...
	dispose() {
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
	resume() {
		// do not resume twice if already resumed before
		if (this.isActive && !this.isResumed) {
			if (!this.isManualStep && this.isEndless) {
				if (!this._streamsheet.sheet.isProcessed) this._repeatStep();
			} else if (!this._streamsheet.sheet.isProcessed) this._streamsheet.triggerStep();
			this.isResumed = !this.isRepeating;
			// this.isResumed = paused && !this.isRepeating;
		}
	}
	start() {
		// reset stats?
	}
	stop() {
		clearTrigger(this);
		this.isActive = false;
		return true;
	}
	stopProcessing() {
		this.stop();
	}

	preStep(manual) {
		this.isResumed = false;
		this.isManualStep = manual;
	}
	step(/* manual */) {}
	postStep(/* manual */) {
		// this.isResumed = false;
	}

	_startRepeat() {
		repeatTrigger(this);
		// on repeat start we do a normal cycle!
		this.doCycleStep();
	}
	_repeatStep() {
		repeatTrigger(this);
		// trigger step afterwards, because it might clears current scheduled one!!!
		this.doRepeatStep();
		// if (!resumed) this.doRepeatStep();
	}
	trigger() {
		this.isActive = true;
		if (!this.isResumed && this._stepId == null && !this._streamsheet.sheet.isPaused) {
			if (!this.isManualStep && this.isEndless) this._startRepeat();
			else this.doCycleStep();
		}
	}
	doCycleStep() {
		this._streamsheet.stats.steps += 1;
		this._streamsheet.triggerStep();
		this.isActive = this._streamsheet.sheet.isPaused;
	}
	doRepeatStep() {
		this._streamsheet.stats.repeatsteps += 1;
		this._streamsheet.triggerStep();
		this.isActive = this._streamsheet.sheet.isPaused;
	}

	// DEPRECATED:
	preProcess() {}

	isTriggered() {
		return this.isEndless;
	}

	postProcess() {}
}

module.exports = AbstractStreamSheetTrigger;