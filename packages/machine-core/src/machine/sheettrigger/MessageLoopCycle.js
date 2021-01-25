/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { compose } = require('@cedalo/commons').functions;
const { ManualCycle, TimerCycle } = require('./cycles');

const Activate = (BaseCycle) =>
	class extends BaseCycle {
		activate() {
			super.activate();
			this.schedule();
			// move to next loop element:
			this.trigger.streamsheet.messageHandler.next();
			if (this.trigger.streamsheet.messageHandler.isProcessed) {
				this.trigger.streamsheet.detachMessage();
				if (this.parentcycle) this.parentcycle.activate();
			}
		}
	};

const PostProcess = (BaseCycle) =>
	class extends BaseCycle {
		postProcess() {
			if (this.trigger.sheet.isProcessed) this.trigger.streamsheet.messageHandler.next();
			if (this.trigger.streamsheet.messageHandler.isProcessed) {
				this.trigger.streamsheet.detachMessage();
				if (!this.trigger.sheet.isPaused) {
					this.stop();
				}
			}
		}
	};
const Step = (BaseCycle) => {
	return class extends BaseCycle {
		getRepeatUntilCycle() {
			throw new Error('Not implemented!');
		}
		step() {
			if (this.trigger.isEndless) {
				this.trigger.streamsheet.stats.steps += 1;
				this.trigger.streamsheet.stats.repeatsteps = 0;
				this.trigger.activeCycle = this.getRepeatUntilCycle();
				this.trigger.activeCycle.run();
			} else {
				this.trigger.streamsheet.stats.steps += 1;
				this.trigger.processSheet();
				this.postProcess();
			}
		}
	};
};
const Resume = (BaseClass) =>
	class extends BaseClass {
		resume() {
			super.resume();
			this.postProcess();
		}
	};

const MessageLoopCycle = compose(Activate, PostProcess, Resume,	Step);


class RepeatUntilCycle extends TimerCycle {
	getCycleTime() {
		return 1;
	}
	run() {
		this.schedule();
		this.process();
	}
	process() {
		this.trigger.streamsheet.stats.repeatsteps += 1;
		this.trigger.processSheet();
	}
	step() {
		return undefined;
	}
}
class ManualRepeatUntilCycle extends ManualCycle {
	step() {
		// in manual we count steps even in endless mode?
		// this.trigger.streamsheet.stats.steps += 1;
		this.trigger.streamsheet.stats.repeatsteps += 1;
		this.trigger.processSheet();
	}	
}

class TimerMessageLoopCycle extends MessageLoopCycle(TimerCycle) {
	getRepeatUntilCycle() {
		return new RepeatUntilCycle(this.trigger, this);
	}
}
class ManualMessageLoopCycle extends MessageLoopCycle(ManualCycle) {
	getRepeatUntilCycle() {
		return new ManualRepeatUntilCycle(this.trigger, this);
	}
}



module.exports = {
	ManualMessageLoopCycle,
	TimerMessageLoopCycle,
	withBaseClass: (BaseCycle) => MessageLoopCycle(BaseCycle)
};
