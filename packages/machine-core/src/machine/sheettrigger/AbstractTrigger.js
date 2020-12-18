const State = require('../../State');

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
		const { machine, sheet } = streamsheet;
		this._streamsheet = streamsheet;
		// apply current state if differ from stop
		if (sheet.isPaused) this.pause();
		else if (machine && machine.state === State.RUNNING) this.resume(true);
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

	// TODO: remove onUpdate flag
	resume(onUpdate) {
		// do not resume twice if already resumed before & check if not paused by function
		if (this.isActive && !this.isResumed && !this.sheet.isPaused) {
			if (!this.isManualStep && this.isEndless) {
				if (!this.sheet.isProcessed || onUpdate) this._repeatStep();
			} else if (!this.sheet.isProcessed || onUpdate) this._streamsheet.triggerStep();
			this.isResumed = !this.isRepeating;
		}
	}

	start() {
		// reset stats?
	}
	// TODO: remove all passed flags!!!
	stop(onUpdate, onProcessing) {
		clearTrigger(this);
		this.isActive = false;
		if (!onUpdate) this.sheet._stopProcessing();
		return true;
	}
	stopProcessing(retval, onDispose) {
		this.stop(onDispose, true);
		this.sheet._stopProcessing(retval);
	}
	pauseProcessing() {
		this.sheet._pauseProcessing();
		this.pause();
	}
	resumeProcessing() {
		this.sheet._resumeProcessing();
		this.resume();
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
		if (!this.isResumed && this._stepId == null && !this.sheet.isPaused) {
			if (!this.isManualStep && this.isEndless) this._startRepeat();
			else this.doCycleStep();
		}
	}
	doCycleStep() {
		this._streamsheet.stats.steps += 1;
		this._streamsheet.triggerStep();
		this.isActive = this.sheet.isPaused;
	}
	doRepeatStep() {
		this._streamsheet.stats.repeatsteps += 1;
		this._streamsheet.triggerStep();
		this.isActive = this.sheet.isPaused;
	}

	// DEPRECATED:
	preProcess() {}

	isTriggered() {
		return this.isEndless;
	}

	postProcess() {}
}

module.exports = AbstractTrigger;