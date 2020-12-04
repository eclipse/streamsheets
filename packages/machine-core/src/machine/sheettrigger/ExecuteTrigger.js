const State = require('../../State');
const StreamSheetTrigger = require('../StreamSheetTrigger');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const clearTrigger = (trigger) => {
	if (trigger._stepId) {
		clearImmediate(trigger._stepId);
		trigger._stepId = undefined;
	}
};

const repeatTrigger = (trigger) => {
	trigger._stepId = setImmediate(trigger._repeatStep);
};

class ExecuteTrigger extends AbstractStreamSheetTrigger {

	constructor(cfg) {
		super(cfg);
		// only active on execute trigger:
		this.isActive = false;
		this._stepId = undefined;
		this._stopRepeat = false;
		this._callingSheet = undefined;
		this._repeatStep = this._repeatStep.bind(this);
	}

	get type() {
		return StreamSheetTrigger.TYPE.EXECUTE;
	}

	execute(repetitions, callingSheet) {
		this.isActive = true;
		this._callingSheet = callingSheet;
		this._callingSheet.pauseProcessing();
		// start calculating
		this._doExecute(repetitions);

		// if (this.isEndless) {
		// 	callingSheet.pauseProcessing();
		// 	this._callingSheet = callingSheet;
		// }
		// // start calculating
		// this._doExecute(repetitions);
	}

	stopRepeat() {
		clearTrigger(this);
		this.isActive = false;
		this._stopRepeat = true;
	}

	pause() {
		this.isActive = false;
		clearTrigger(this);
	}
	resume() {
		this.isActive = true;
		if (this.isEndless) this._repeatStep();
	}
	start() {
		this.isActive = false;
		this._streamsheet.stats.repeatsteps = 0;
		// reset stats?
	}
	stop(retval) {
		super.stop();
		clearTrigger(this);
		const streamsheet = this._streamsheet;
		streamsheet.stats.repeatsteps = 0;
		streamsheet.sheet.stopProcessing(retval);
		// we have to stay active
		this.isActive = true;
		return true;
	}

	step(manual) {
		// ignore!!
		// if (this._stepId == null) {
		// 	// (DL-531): reset repeat-steps on first cycle...
		// 	if (this.isEndless) {
		// 		if (this._streamsheet.stats.repeatsteps === 0) this._streamsheet.stats.steps += 1;
		// 		if (!manual) {
		// 			this._repeatStep();
		// 		} else {
		// 			this._streamsheet.stats.repeatsteps += 1;
		// 			this._trigger();
		// 		}
		// 	} else {
		// 		this._streamsheet.stats.steps += 1;
		// 		this._trigger();
		// 	}
		// }
		// we are in repeat mode
	}
	_doExecute(repetitions = 1) {
		for (let i = 0; this.isActive && i < repetitions; i += 1) {
			this._trigger();
		}
		// if (this._stepId == null) {
		// 	// (DL-531): reset repeat-steps on first cycle...
		// 	if (this.isEndless) {
		// 		if (this._streamsheet.stats.repeatsteps === 0) this._streamsheet.stats.steps += 1;
		// 		if (!manual) {
		// 			this._repeatStep();
		// 		} else {
		// 			this._streamsheet.stats.repeatsteps += 1;
		// 			this._trigger();
		// 		}
		// 	} else {
		// 		this._streamsheet.stats.steps += 1;
		// 		this._trigger();
		// 	}
		// }
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
		const result = streamsheet.triggerStep();
		// should we resume callingSheet
		if (this._stopRepeat && this._callingSheet) {
			this._stopRepeat = false;
			this._callingSheet.resumeProcessing();
		}
		return result;
	}
}
module.exports = ExecuteTrigger;
