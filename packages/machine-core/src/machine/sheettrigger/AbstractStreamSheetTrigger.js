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

	constructor(config = {}) {
		this.config = Object.assign({}, DEF_CONF, config);
		this.isActive = false;
		this._streamsheet = undefined;
		this._stepId = undefined;
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
	dispose() {}
	
	update(config = {}) {
		this.config = Object.assign(this.config, config);
	}


	pause() {
		this.isActive = false;
		clearTrigger(this);
	}
	resume() {
		this.isActive = true;
		// called by machine on start from pause...
		// no need to repeatStep() or trigger will be done on first step which should be executed immediately by machine cycle
		// if (this.isEndless) this._repeatStep();
		// else this._trigger();
	}
	start() {
		this.isActive = true;
		this._streamsheet.stats.repeatsteps = 0;
		// reset stats?
	}
	stop() {
		super.stop();
		clearTrigger(this);
		const streamsheet = this._streamsheet;
		streamsheet.stats.repeatsteps = 0;
		// streamsheet.sheet.stopProcessing(retval);
		// we have to stay active
		this.isActive = true;
		return true;
	}

	stopRepeat() {
		/* currently do nothing */
	}

	step(manual) {
		if (this._stepId == null) {
			// (DL-531): reset repeat-steps on first cycle...
			if (this.isEndless) {
				if (this._streamsheet.stats.repeatsteps === 0) this._streamsheet.stats.steps += 1;
				if (!manual) {
					this._repeatStep();
				} else {
					this._streamsheet.stats.repeatsteps += 1;
					this._trigger();
				}
			} else {
				this._streamsheet.stats.steps += 1;
				this._trigger();
			}
		}
		// we are in repeat mode
	}
	_repeatStep() {
		if (this.isActive) {
			this._streamsheet.stats.repeatsteps += 1;
			// register next repeat step:
			repeatTrigger(this);
			// run current afterwards, because it might clears next scheduled one!!!
			this._trigger();
		} else {
			clearTrigger(this);
		}
	}
	_trigger() {
		const streamsheet = this._streamsheet;
		return streamsheet.triggerStep();
	}


	preProcess() {}

	isTriggered() {
		return this.isEndless;
	}

	postProcess() {}

	// DL-654
	// stop() {
	// 	this.isActive = false;
	// 	return true;
	// }
}

module.exports = AbstractStreamSheetTrigger;