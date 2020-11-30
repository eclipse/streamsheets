const State = require('../../State');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

class ContinuouslyTrigger extends AbstractStreamSheetTrigger {

	constructor(cfg) {
		super(cfg);
		// TODO: remove counter
		this._stepCounter = 0;
		this._clearCounter = 0;
		this._returnCounter = 0;
		this._totalRepeatCounter = 0;
		this._stepId = undefined;
		// this._state = State.ACTIVE;
		// this._trigger = this._trigger.bind(this);
		this._repeatStep = this._repeatStep.bind(this);
	}

	pause() {
		this._state = State.PAUSED;
		if (this._setId) {
			clearImmediate(this._setId);
			this._setId = undefined;
		} 
	}

	start() {
		this._state = State.ACTIVE;
		this._streamsheet.stats.repeatsteps = 0;
		// reset stats?
	}
	resume() {
		this._state = State.ACTIVE;
		if (this.isEndless) {
			this._repeatStep();
		}
	}

	step(manual) {
		if (this._stepId == null) {
			this._stepCounter += 1;
			// (DL-531): reset repeat-steps on first cycle...
			if (this.isEndless) {
				// if (!manual) this._streamsheet.stats.repeatsteps = 0;
				if (this._streamsheet.stats.repeatsteps === 0) this._streamsheet.stats.steps += 1;
				// this._state = State.ACTIVE;
				if (!manual) {
					// this._streamsheet.stats.steps += 1;
					// this._streamsheet.stats.repeatsteps = 0;
					this._repeatStep();
				} else {
					// if (this._streamsheet.stats.repeatsteps === 0) this._streamsheet.stats.steps += 1;
					this._streamsheet.stats.repeatsteps += 1;
					this._trigger();
					// this._doStep();
				}
			} else {
				this._doStep();
			}
		} 
		// we are in repeat mode
		

		// const streamsheet = this._streamsheet;
		// return streamsheet.sheet.startProcessing();
	}

	_doStep() {
		this._streamsheet.stats.steps += 1;
		this._trigger();
	}
	_repeatStep() {
		this._totalRepeatCounter += 1;
		if (this._state === State.ACTIVE) {
			this._streamsheet.stats.repeatsteps += 1;
			// register next repeat step:
			this._stepId = setImmediate(this._repeatStep);
			// run current afterwards, because it might clears next scheduled one!!!
			this._trigger();
		} else if (this._stepId) {
			clearImmediate(this._stepId);
			this._stepId = undefined;
		}
	}
	
	onReturn(retval) {
		super.stop();
		this._returnCounter += 1;
		if (this._stepId) {
			this._clearCounter += 1;
			clearImmediate(this._stepId);
			this._stepId = undefined;
		}
		const streamsheet = this._streamsheet;
		streamsheet.stats.repeatsteps = 0;
		streamsheet.sheet.stopProcessing(retval);
		return true;
	}

	// start() {
	// 	this._streamsheet.stats.steps = 0;	
	// 	this._streamsheet.stats.repeatsteps = 0;	
	// }

	stop(retval) {
		super.stop();
		if (this._stepId) {
			clearImmediate(this._stepId);
			this._stepId = undefined;
		}
		const streamsheet = this._streamsheet;
		streamsheet.stats.repeatsteps = 0;
		streamsheet.sheet.stopProcessing(retval);
		return true;
	}

	_trigger() {
		const streamsheet = this._streamsheet;
		return streamsheet.sheet.startProcessing();
	}

}
module.exports = ContinuouslyTrigger;
