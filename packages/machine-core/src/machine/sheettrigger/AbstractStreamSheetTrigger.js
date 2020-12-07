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

	set streamsheet(streamsheet) {
		this._streamsheet = streamsheet;
	}

	// called by streamsheet. signals that it will be removed. trigger should perform clean up here...
	dispose() {
		this._streamsheet = undefined;
	}

	update(config = {}) {
		this.config = Object.assign(this.config, config);
	}

	// CONTROL METHODS
	pause() {
		// this.isActive = false;
		clearTrigger(this);
	}
	resume() {
		if (this.isEndless) this._repeatStep();
		// this.isActive = true;
		// called by machine on start from pause...
		// no need to repeatStep() or trigger will be done on first step which should be executed immediately by machine cycle
		// else this._trigger();
	}
	start() {
		// this.isActive = true;
		// this._streamsheet.stats.repeatsteps = 0;
		// reset stats?
	}
	stop() {
		clearTrigger(this);
		// const streamsheet = this._streamsheet;
		// streamsheet.stats.steps = 0;
		// streamsheet.stats.repeatsteps = 0;
		// // streamsheet.sheet.stopProcessing(retval);
		// // we have to stay active
		// this.isActive = true;
		return true;
	}
	stopRepeat() {
		/* currently do nothing */
	}

	step(manual) {
		// if not in repeat mode and not paused:
		if (this._stepId == null && !this._streamsheet.sheet.isPaused) {
			if (!manual && this.isEndless) this._startRepeat();
			else this._streamsheet.cycleStep();
		}
	}
	_startRepeat() {
		repeatTrigger(this);
		// on repeat start we do a normal cycle!
		this._streamsheet.cycleStep();
	}
	_repeatStep() {
		repeatTrigger(this);
		// trigger step afterwards, because it might clears current scheduled one!!!
		this._streamsheet.repeatStep();
	}


	// DEPRECATED:
	preProcess() {}

	isTriggered() {
		return this.isEndless;
	}

	postProcess() {}
}

module.exports = AbstractStreamSheetTrigger;