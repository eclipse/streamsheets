class TriggerCycle {
	constructor(trigger, parent) {
		this.trigger = trigger;
		this.parentcycle = parent;
		this.run = this.run.bind(this);
	}

	get isActive() {
		return false;
	}
	get isManual() {
		return false;
	}

	activate() {
		// this.trigger.activeCycle = this;
		// this.schedule();
	}

	// TODO: review
	dispose() {
		this.clear();
		if (this.parentcycle) this.parentcycle.dispose();
	}

	clear() {
		return false;
	}

	schedule() {}

	stop() {
		this.clear();
		if (this.parentcycle) this.parentcycle.activate();
	}

	step() {
	}
	// TODO: rename
	run() {
		this.onTrigger();
	}
	onTrigger() {}


	// TODO: review following functions => might not needed
	pause() {
		this.isPaused = true;
		this.clear();
	}
	resume() {
		if (this.isPaused) {
			this.isPaused = false;
			this.schedule();
		}
	}
	start() {
		this.isPaused = false;
		this.run();
	}
	// ~~
}

class TimerCycle extends TriggerCycle {
	constructor(trigger, parent) {
		super(trigger, parent);
		this.id = undefined;
	}

	getCycleTime() {
		return 100;
	}

	get isActive() {
		return this.id != null;
	}

	activate() {
		this.schedule();
	}

	clear() {
		const clearIt = this.id != null;
		if (clearIt) {
			clearTimeout(this.id);
			this.id = undefined;
		}
		return clearIt;
	}
	schedule() {
		this.clear();
		this.id = setTimeout(this.run, this.getCycleTime());
	}

	run() {
		this.schedule();
		this.onTrigger();
	}
}

class ManualCycle extends TriggerCycle {
	get isManual() {
		return true;
	}
}

module.exports = {
	ManualCycle,
	TimerCycle,
	TriggerCycle
};
