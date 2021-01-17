const BaseTrigger2 = require('./BaseTrigger2');
const { ManualCycle, TimerCycle } = require('./cycles');

// TODO: get cycletime from DEF if machine is not available
const getCycleTime = (machine) =>  machine ? machine.cycletime : 100;

class RepeatUntilCycle extends TimerCycle {

	getCycleTime() {
		const pace = this.trigger.pace;
		return pace == null || pace === true ? 1 : getCycleTime(this.trigger.streamsheet.machine);
	}

	onTrigger() {
		this.trigger.streamsheet.stats.repeatsteps += 1;
		this.trigger.streamsheet.triggerStep();	
	}
}
class MessageLoopCycle extends TimerCycle {

	constructor(trigger, parent) {
		super(trigger, parent);
		this._isActivated = false;
	}
	activate() {
		// this._isActivated = true;
		if (this.trigger.streamsheet.isMessageProcessed()) {
			if (this.parentcycle) this.parentcycle.activate();
		} else {
			this.trigger.activeCycle = this;
			super.activate();
		}
	}

	getCycleTime() {
		const pace = this.trigger.pace;
		return pace == null || pace === false ? getCycleTime(this.trigger.streamsheet.machine) : 1;
	}

	// resume() {
	// 	super.resume();
	// 	if (!this.trigger.sheet.isProcessed) this.trigger.streamsheet.triggerStep();
	// }

	onTrigger() {
		const streamsheet = this.trigger.streamsheet;
		streamsheet.stats.steps += 1;

		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			streamsheet.triggerStep();
			if (streamsheet.isMessageProcessed()) {
				this.parentcycle.activate();
			}
		}
		// if (this.trigger.isEndless) {
		// 	this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
		// 	this.trigger.activeCycle.run();
		// } else if(!streamsheet.getCurrentMessage()) {
		// 	streamsheet.triggerStep();
		// 	if (this.parentcycle) this.parentcycle.activate();
		// } else if (streamsheet.isMessageProcessed()) {
		// 	// if (initial) streamsheet.triggerStep();
		// 	streamsheet.triggerStep();
		// 	if (this.parentcycle) this.parentcycle.activate();
		// } else {
		// 	streamsheet.triggerStep();
		// }
	}
};
class RepeatExecuteCycle extends TimerCycle {

	get isRepeatExecute() {
		return true;
	}

	activate() {
		this.trigger.activeCycle = this;
		// super.activate();
		// if (this.trigger.sheet.isProcessed && !this.trigger.sheet.isHalted && this.trigger.resumeFn) {
		// if (this.trigger.sheet.isProcessed && !this.trigger.sheet.isHalted) {
		if (this.trigger.sheet.isProcessed) {
			// have to use immediate to not trigger in same cycle!!
			setImmediate(this.trigger.resumeFn);
			// setTimeout(this.trigger.resumeFn, 0);
			// this.trigger.resumeFn();
		}
	}

	getCycleTime() {
		const pace = this.trigger.pace;
		return pace == null || pace === false ? getCycleTime(this.trigger.streamsheet.machine) : 1;
	}

	resume() {
		// have to use immediate to not trigger in same cycle!!
		setImmediate(this.trigger.resumeFn); // ();
		// setTimeout(this.trigger.resumeFn, 0);
		// this.trigger.resumeFn();
	}

	onTrigger() {
		this.trigger.streamsheet.stats.repeatsteps = 0;
		this.trigger.streamsheet.stats.executesteps += 1;
		this.trigger.activeCycle = new MessageLoopCycle(this.trigger, this);
		this.trigger.activeCycle.run();
	}
};

class RepeatUntilManualCycle extends ManualCycle {
	onTrigger() {
		if (!this.trigger.sheet.isPaused) {
			this.trigger.streamsheet.stats.repeatsteps += 1;
			this.trigger.streamsheet.triggerStep();
		}
	}
}
class MessageLoopManualCycle extends ManualCycle {

	activate() {
		this.trigger.activeCycle = this;
		super.activate();
		if (this.trigger.streamsheet.isMessageProcessed()) {
			if (this.parentcycle) this.parentcycle.activate();
		}
	}
	onTrigger() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilManualCycle(this.trigger, this);
			this.trigger.activeCycle.run();
		} else {
			this.trigger.streamsheet.triggerStep();
			if (this.trigger.streamsheet.isMessageProcessed()) {
				if (this.parentcycle) this.parentcycle.activate();
			}
		}
	}
};
class RepeatExecuteManualCycle extends ManualCycle {

	activate() {
		this.trigger.activeCycle = this;
		if (this.trigger.sheet.isProcessed) {
			this.trigger.resumeFn();
		}
	}

	resume() {
		this.trigger.resumeFn();
	}
	onTrigger() {
		this.trigger.activeCycle = new MessageLoopManualCycle(this.trigger, this);
		this.trigger.activeCycle.run();
	}
};


const TYPE_CONF = { type: 'execute' };

class ExecuteTrigger2 extends BaseTrigger2 {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(config);
		this._activeCycle = new RepeatExecuteManualCycle(this);
	}

	get activeCycle() {
		return this._activeCycle;
	}
	set activeCycle(cycle) {
		this._activeCycle.clear();
		// TODO: dispose activeCycle?
		// this._activeCycle.dispose();
		this._activeCycle = cycle;
	}

	get isMachineStopped() {
		const machine = this.streamsheet.machine;
		return machine == null || !machine.isRunning;
	}

	dispose() {
		this.activeCycle.dispose();
		super.dispose();
	}

	update(config = {}) {
		this.config = Object.assign(this.config, config);
		this.activeCycle.clear();
		if (!this.sheet.isPaused) {
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
			if (!this.isMachineStopped) {
				this.activeCycle = new RepeatExecuteCycle(this);
				this.activeCycle.start();
			}
		}
	}

	// MACHINE CONTROL METHODS
	updateCycle() {
		// TODO: not required anymore!! or is it?
	}

	pause() {
		// do not pause sheet! its done by functions only...
		this.activeCycle.pause();
	}

	resume() {
		// if execute() called before && still not paused by a function...
		if (this.resumeFn && !this.sheet.isPaused) {
			if (this.activeCycle.isManual) {
				this.activeCycle = new RepeatExecuteCycle(this);
				this.activeCycle.pause();
			}
			// maybe we have to finish step, if it was resumed during machine pause
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
			if (!this.sheet.isPaused) this.activeCycle.resume();
		}
	}

	start() {
		// this.activeCycle = new ContinuousCycle(this);
		// this.activeCycle.start();
	}

	stop() {
		this.streamsheet.stats.repeatsteps = 0;
		this.streamsheet.stats.executesteps = 0;
		// this.stopProcessing();
		this.sheet._stopProcessing();
		this.streamsheet.setMessageProcessed();
		this.activeCycle.clear();
		this.activeCycle = new RepeatUntilManualCycle(this);
		return true;
	}

	step(manual) {
		// TODO:
		// only used for manual stepping, so it corresponding cycle must be set. if not, ignore!
		// => handle first trigger if set via execute() already:

		// if (manual) {
		// 	if (!this.activeCycle.isManual) this.activeCycle = new RepeatExecuteManualCycle(this);
		// 	this.activeCycle.run();
		// } else {
		// 	if (this.activeCycle.isManual) this.activeCycle = new RepeatExecuteCycle(this);
		// 	if (!this.sheet.isPaused) this.activeCycle.run();
		// }
	}
	// ~

	// SHEET CONTROL METHODS
	pauseProcessing() {
		this.activeCycle.pause();
		this.sheet._pauseProcessing();
	}
	resumeProcessing(retval) {
		// mark sheet as resumed
		this.sheet._resumeProcessing(retval);

		// finish current step
		// if (!this.sheet.isProcessed && (this.activeCycle.isManual || !this.isMachineStopped))
		// 	this.streamsheet.triggerStep();
		
		// resume cycle if machine runs
		if (!this.isMachineStopped) {
			// finish current step
			if (!this.sheet.isProcessed) {
				this.streamsheet.triggerStep();
			}
			if(!this.sheet.isPaused) {
				this.activeCycle.resume();
			}
		} 
	}
	stopProcessing(retval) {
		this.sheet._stopProcessing(retval);
		this.streamsheet.setMessageProcessed();
		this.activeCycle.stop();

		// TODO: review
		// if (!this.activeCycle.isActive) {
		// 	this.activeCycle.dispose();
		// 	this.activeCycle = new ManualCycle(this);
		// }
	}
	// ~

	execute(resumeFn, pace, isRepeating) {
		this.pace = pace;
		this.resumeFn = resumeFn;
		// this._streamsheet.stats.steps += 1;
		// this._isStopped = false;
		// this._repeat();
		// TODO: here we have to check if executed by a manual step => use cycle accordingly
		if (this.activeCycle.isRepeatExecute && isRepeating) {
			this.activeCycle.schedule();
		} else {
			this.streamsheet.stats.executesteps = 0;
			this.activeCycle = new RepeatExecuteCycle(this);
			this.activeCycle.start();
		}
	}
	cancelExecute() {
		if (!this.sheet.isProcessed) this.stopProcessing();
		this.resumeFn = undefined;
	}
}

module.exports = ExecuteTrigger2;
