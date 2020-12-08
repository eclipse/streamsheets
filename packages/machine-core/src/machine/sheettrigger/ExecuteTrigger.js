// const State = require('../../State');
const StreamSheetTrigger = require('../StreamSheetTrigger');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const TYPE_CONF = { type: StreamSheetTrigger.TYPE.EXECUTE };

class ExecuteTrigger extends AbstractStreamSheetTrigger {
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
		this._repetitions = 1;
		this._isActive = false;
		this._isExecuted = false;
		this._callingSheet = undefined;
	}

	// use did step to support trigger on manual steps
	postStep(manual) {
		super.postStep(manual);
		this._isExecuted = false;
	}

	execute(repetitions, callingSheet) {
		this._repetitions = Math.max(1, repetitions);
		this._isActive = true;
		this._isExecuted = true;
		this._callingSheet = callingSheet;
		if (this.isEndless) callingSheet.pauseProcessing();
		this.trigger();
	}

	step(manual) {
		if (manual && this.isEndless && !this._isExecuted) { // && this._isActive) {
			this.doRepeatStep();
		}
	}

	doCycleStep() {
		this._streamsheet.stats.steps += 1;
		this._doExecute();
	}
	doRepeatStep() {
		this._streamsheet.stats.repeatsteps += 1;
		this._doExecute();
	}
	_doExecute() {
		if (!this.isResumed) {
			const streamsheet = this._streamsheet;
			for (let i = 0; this._isActive && i < this._repetitions; i += 1) {
				streamsheet.stats.executesteps = i + 1;
				streamsheet.triggerStep();
			}
			streamsheet.stats.executesteps = 0;
		}
	}

	stop() {
		this._isActive = false;
		this._isExecuted = false;
		return super.stop();
	}
	stopProcessing() {
		super.stopProcessing();
		// resume calling sheet only in endless mode, otherwise it wasn't paused
		if (this.isEndless && this._callingSheet) this._callingSheet.resumeProcessing();
	}
}
module.exports = ExecuteTrigger;
