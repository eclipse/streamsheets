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
const { ManualRepeatUntilCycle, TimerRepeatUntilCycle } = require('./RepeatUntilCycle');
const { ManualCycle, TimerCycle } = require('./cycles');

const MessageLoopCycle = (BaseCycle) =>
	class extends BaseCycle {
		get isMessageLoopCycle() {
			return true;
		}

		_doStop() {
			return (this.streamsheet.messageHandler.isProcessed && !this.sheet.isPaused);
		}

		getMessageLoopCycle() {
			return this;
		}

		activate() {
			super.activate();
			this.schedule();
			if (this._doStop()) super.stop();
		}

		didProcessSheet() {
			if (this.sheet.isProcessed) this.streamsheet.messageHandler.next();
			if (this.streamsheet.messageHandler.isProcessed) {
				this.streamsheet.detachMessage();
				if (!this.sheet.isPaused) super.stop();
			}
		}

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
			}
		}

		stop() {
			// DL-4592: new requirement: message-loop should not be stopped by return()
			if (this._doStop()) super.stop();
		}
	};

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
