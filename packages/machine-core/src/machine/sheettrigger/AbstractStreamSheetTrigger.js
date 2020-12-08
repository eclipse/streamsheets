const clearTrigger = (trigger) => {
	if (trigger._stepId) {
		clearImmediate(trigger._stepId);
		trigger._stepId = undefined;
	}
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
		// this.isActive = false;
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
		if (!this.isEndless) clearTrigger(this);
	}

	// CONTROL METHODS
	pause() {
		clearTrigger(this);
	}
	resume() {
		// const paused = this._streamsheet.sheet.isPaused;
		if (!this.isManualStep && this.isEndless) this._repeatStep();
		else this._streamsheet.triggerStep();
		this.isResumed = !this.isRepeating;
		// this.isResumed = paused && !this.isRepeating;
	}
	start() {
		// reset stats?
	}
	stop() {
		clearTrigger(this);
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
	}
	trigger() {
		if (!this.isResumed && this._stepId == null && !this._streamsheet.sheet.isPaused) {
			if (!this.isManualStep && this.isEndless) this._startRepeat();
			else this.doCycleStep();
		}
	}
	doCycleStep() {
		this._streamsheet.stats.steps += 1;
		this._streamsheet.triggerStep();
	}
	doRepeatStep() {
		this._streamsheet.stats.repeatsteps += 1;
		this._streamsheet.triggerStep();
	}

	// DEPRECATED:
	preProcess() {}

	isTriggered() {
		return this.isEndless;
	}

	postProcess() {}
}

module.exports = AbstractStreamSheetTrigger;