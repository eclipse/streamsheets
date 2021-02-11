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
const { ManualRepeatUntilCycle, TimerRepeatUntilCycle } = require('./RepeatUntilCycle');
const { ManualCycle, TimerCycle } = require('./cycles');

const Activate = (BaseCycle) =>
	class extends BaseCycle {
		activate() {
			super.activate();
			this.schedule();
			this.postProcessSheet();
		}
	};

const PostProcessSheet = (BaseCycle) =>
	class extends BaseCycle {
		postProcessSheet() {
			if (this.sheet.isProcessed) this.streamsheet.messageHandler.next();
			if (this.streamsheet.messageHandler.isProcessed) {
				this.streamsheet.detachMessage();
				if (!this.sheet.isPaused) this.stop();
			}
		}
	};
const Step = (BaseCycle) => {
	return class extends BaseCycle {
		getRepeatUntilCycle() {
			throw new Error('Not implemented!');
		}
		step() {
			if (!this.sheet.isPaused && this.sheet.isProcessed) {
				this.streamsheet.stats.steps += 1;
			}
			if (this.trigger.isEndless) {
				this.streamsheet.stats.repeatsteps = 0;
				this.trigger.activeCycle = this.getRepeatUntilCycle();
				this.trigger.activeCycle.run();
			} else {
				this.trigger.processSheet();
				this.postProcessSheet();
			}
		}
	};
};
const Resume = (BaseClass) =>
	class extends BaseClass {
		resume(retval) {
			super.resume(retval);
			this.postProcessSheet();
		}
	};

const IsMessageLoop = (BaseClass) =>
	class extends BaseClass {
		get isMessageLoopCycle() {
			return true;
		}

		getMessageLoopCycle() {
			return this;
		}
	};
const MessageLoopCycle = compose(Activate, IsMessageLoop, PostProcessSheet, Resume, Step);

class TimerMessageLoopCycle extends MessageLoopCycle(TimerCycle) {
	getRepeatUntilCycle() {
		return new TimerRepeatUntilCycle(this.trigger, this);
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
