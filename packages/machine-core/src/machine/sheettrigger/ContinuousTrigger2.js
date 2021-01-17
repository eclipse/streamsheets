const BaseTrigger2 = require('./BaseTrigger2');
const { ManualCycle, TimerCycle, TriggerCycle } = require('./cycles');


class RepeatUntilCycle extends TimerCycle {

	getCycleTime() {
		return 1;
	}

	onTrigger() {
		this.trigger.streamsheet.stats.repeatsteps += 1;
		this.trigger.streamsheet.triggerStep();	
	}
}
class ContinuousCycle extends TimerCycle {

	activate() {
		this.trigger.activeCycle = this;
		this.schedule();
	}

	getCycleTime() {
		// TODO: get cycletime from DEF if machine is not available
		const machine = this.trigger.streamsheet.machine;
		return machine ? machine.cycletime : 100;
	}

	onTrigger() {
		this.trigger.streamsheet.stats.steps += 1;
		if (this.trigger.isEndless) {
			this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
			this.trigger.activeCycle.run();
			// const endlessCycle = new RepeatUntilCycle(this.trigger, this);
			// endlessCycle.activate();
			// endlessCycle.trigger();
		} else {
			this.trigger.streamsheet.triggerStep();
		}
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
class ContinuousManualCycle extends ManualCycle {

	onTrigger() {
		if (!this.trigger.sheet.isPaused) {
			this.trigger.streamsheet.stats.steps += 1;
			if (this.trigger.isEndless) {
				this.trigger.activeCycle = new RepeatUntilManualCycle(this.trigger, this);
				this.trigger.activeCycle.run();
			} else {
				this.trigger.streamsheet.triggerStep();
			}
		}
	}
}
class MachineStepCycle extends TriggerCycle {

	activate() {
		this.trigger.activeCycle = this;
	}

	getCycleTime() {
		// TODO: get cycletime from DEF if machine is not available
		const machine = this.trigger.streamsheet.machine;
		return machine ? machine.cycletime : 100;
	}

	onTrigger() {
		if (!this.trigger.sheet.isPaused) {
			this.trigger.streamsheet.stats.steps += 1;
			if (this.trigger.isEndless) {
				this.trigger.activeCycle = new RepeatUntilCycle(this.trigger, this);
				this.trigger.activeCycle.run();
			} else {
				this.trigger.streamsheet.triggerStep();
			}
		}
	}
}

const TYPE_CONF = Object.freeze({ type: 'continuously' });

class ContinuousTrigger2 extends BaseTrigger2 {
	static get TYPE() {
		return TYPE_CONF.type;
	}

	constructor(config = {}) {
		super(config);
		this._activeCycle = new ContinuousManualCycle(this);
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
				// this.activeCycle = new ContinuousCycle(this);
				this.activeCycle = new MachineStepCycle(this);
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
		// if we are not still paused by a function...
		if (!this.sheet.isPaused) {
			if (this.activeCycle.isManual) {
				// this.activeCycle = new ContinuousCycle(this);
				this.activeCycle = new MachineStepCycle(this);
				this.activeCycle.pause();
			}
			this.activeCycle.resume();
			// maybe we have to finish step, if it was resumed during machine pause
			if (!this.sheet.isProcessed) this.streamsheet.triggerStep();
		}
	}

	start() {
		// this.activeCycle = new ContinuousCycle(this);
		// this.activeCycle.start();
	}

	stop() {
		this.stopProcessing();
		return true;
	}

	step(manual) {
		if (manual) {
			if (!this.activeCycle.isManual) this.activeCycle = new ContinuousManualCycle(this);
			this.activeCycle.run();
		} else {
			if (this.activeCycle.isManual) this.activeCycle = new MachineStepCycle(this);
			if (!this.sheet.isPaused) this.activeCycle.run();
		}
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
		if (!this.sheet.isProcessed && (this.activeCycle.isManual || !this.isMachineStopped))
			this.streamsheet.triggerStep();
		// resume cycle if machine runs
		if (!this.isMachineStopped) this.activeCycle.resume();
	}
	stopProcessing(retval) {
		this.activeCycle.stop();
		// TODO: review
		// if (!this.activeCycle.isActive) {
		// 	this.activeCycle.dispose();
		// 	this.activeCycle = new ManualCycle(this);
		// }
		this.sheet._stopProcessing(retval);
	}
	// ~
}

module.exports = ContinuousTrigger2;
