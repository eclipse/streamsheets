const AbstractTrigger = require('./AbstractTrigger');

const TYPE_CONF = { type: 'execute' };

class ExecuteTrigger extends AbstractTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
		this._repetitions = 1;
		// flag to prevent executing twice on manual stepping if this comes before triggering sheet
		this._isExecuted = false;
		// flag to indicate that calculation was stopped, e.g. by return()
		this._isStopped = false;
		this._callingSheet = undefined;
	}

	preStep(manual) {
		super.preStep(manual);
		// init flags:
		this._isStopped = false;
		this._isExecuted = false;
	}

	execute(repetitions, callingSheet) {
		this._repetitions = Math.max(1, repetitions);
		this._callingSheet = callingSheet;
		if (this.isEndless) callingSheet.pauseProcessing();
		this.trigger();
	}
	cancelExecute() {
		if (!this.sheet.isProcessed) this.stopProcessing();
		this.isActive = false;
		if (this._callingSheet) this._callingSheet.resumeProcessing(true);
	}

	step(manual) {
		if (manual && !this._isExecuted && this.isActive && this.isEndless) {
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
			this._isExecuted = true;
			streamsheet.stats.executesteps = 0;
			for (let i = 0; this.isActive && i < this._repetitions; i += 1) {
				streamsheet.stats.executesteps = i + 1;
				streamsheet.triggerStep();
			}
			this.isActive = !this._isStopped && (this.isEndless || this.sheet.isPaused);
		}
	}

	stopProcessing(retval) {
		super.stopProcessing(retval);
		this._isStopped = true;
		// resume calling sheet only in endless mode, otherwise it wasn't paused
		if (this.isEndless && this._callingSheet) this._callingSheet.resumeProcessing(true);
	}

	update(config = {}) {
		if (this.isEndless && config.repeat !== 'endless') this.stopProcessing();
		super.update(config);
	}

}
module.exports = ExecuteTrigger;
