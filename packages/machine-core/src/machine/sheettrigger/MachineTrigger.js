const State = require('../../State');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const preventStop = (doIt, streamsheet) => {
	const machine = streamsheet && streamsheet.machine;
	if (machine) machine.preventStop = doIt;
};

class MachineTrigger extends AbstractStreamSheetTrigger {
	constructor(config) {
		super(config);
		this.isStopFulFilled = false;
		this.stopEndless = false;
	}

	set streamsheet(streamsheet) {
		super.streamsheet = streamsheet;
		const { machine } = streamsheet;
		if (machine && machine.state === State.RUNNING) this.start();
	}


	start() {
		if (this.type === MachineTrigger.TYPE_START) this.trigger();
	}

	stop(onUpdate) {
		if (!onUpdate && this.type === MachineTrigger.TYPE_STOP && !this.isStopFulFilled) {
			this.isStopFulFilled = true;
			this.trigger();
			return false;
		} 
		if (this.isStopFulFilled) {
			this.stopEndless = true;
			this.isStopFulFilled = false;
		}
		return super.stop(onUpdate);
	}

	step(manual) {
		if (manual && (this.type === MachineTrigger.TYPE_START || this.isStopFulFilled)) this.trigger();
		preventStop(this.isEndless && !this.stopEndless, this._streamsheet);
	}

	doCycleStep() {
		super.doCycleStep();
		preventStop(this.isEndless && !this.stopEndless, this._streamsheet);
	}
	doRepeatStep() {
		super.doRepeatStep();
		preventStop(!this.stopEndless, this._streamsheet);
	}
}
MachineTrigger.TYPE_START = 'start';
MachineTrigger.TYPE_STOP = 'stop';
// MachineTrigger.TYPE_STARTSTOP = 'startstop';

module.exports = MachineTrigger;
