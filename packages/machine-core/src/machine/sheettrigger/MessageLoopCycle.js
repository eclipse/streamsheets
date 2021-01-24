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

 const MessageLoopActivate = (BaseCycle) => {
	const isLastLoopIndex = (trigger) => {
		return trigger.streamsheet._msgHandler._index >= trigger.streamsheet._msgHandler._stack.length - 1;
	};

	return class extends BaseCycle {
		activate() {
			super.activate();
			this.schedule();
			if (this.parentcycle && isLastLoopIndex(this.trigger)) this.parentcycle.activate();
		}
	};
};
const MessageLoopStep = (BaseCycle) => {
	const isFinished = (trigger) =>
		!trigger.sheet.isPaused && trigger.sheet.isProcessed && trigger.streamsheet.isMessageProcessed();

	return class extends BaseCycle {
		createRepeatUntilCycle() {
			throw new Error('Not implemented!');
		}

		step() {
			this.trigger.useNextMessage = this.trigger.streamsheet.isMessageProcessed();
			if (this.trigger.isEndless) {
				this.trigger.streamsheet.stats.steps += 1;
				this.trigger.activeCycle = this.createRepeatUntilCycle();
				this.trigger.activeCycle.run();
				this.trigger.useNextMessage = false;
			} else {
				this.trigger.streamsheet.stats.steps += 1;
				this.trigger.processSheet();
				if (isFinished(this.trigger)) {
					this.stop();
				}
			}
		}
	};
};
const MessageLoopResume = (BaseClass) => {
	const finishOnResume = (trigger) =>
		trigger.sheet.isProcessed &&
		(trigger.streamsheet.isMessageProcessed() ||
			trigger.streamsheet.getLoopIndex() === trigger.streamsheet.getLoopCount() - 1);
	
	return class extends BaseClass {
		resume() {
			const loopIndexBefore = this.trigger.streamsheet.getLoopIndex();
			super.resume();
			const loopIndex = this.trigger.streamsheet.getLoopIndex();
			if (loopIndex <= loopIndexBefore && finishOnResume(this.trigger)) {
				this.stop();
			}
		}
	};
};	
const MessageLoopCycle = compose(MessageLoopActivate, MessageLoopResume, MessageLoopStep);

module.exports = {
	createWithBaseClass: (BaseCycle) => MessageLoopCycle(BaseCycle)
}