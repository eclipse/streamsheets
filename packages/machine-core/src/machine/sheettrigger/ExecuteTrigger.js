const StreamSheetTrigger = require('../StreamSheetTrigger');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const TYPE_CONF = { type: StreamSheetTrigger.TYPE.EXECUTE };

class ExecuteTrigger extends AbstractStreamSheetTrigger {
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
		this._repetitions = 1;
		this._callingSheet = undefined;
	}

	get type() {
		return StreamSheetTrigger.TYPE.EXECUTE;
	}

	execute(repetitions, callingSheet) {
		this._repetitions = Math.max(1, repetitions);
		this._callingSheet = callingSheet;
		// pause calling sheet if we are in endless mode...
		if (this.isEndless) callingSheet.pauseProcessing();
		this.trigger();
	}
	doCycleStep() {
		this.doRepeatStep();
	}
	doRepeatStep() {
		for (let i = 0; i < this._repetitions; i += 1) {
			this._streamsheet.repeatStep(i + 1);
		}
	}

	step(/* manual */) {
		// ignore!! we are triggered by execute
	}
}
module.exports = ExecuteTrigger;
