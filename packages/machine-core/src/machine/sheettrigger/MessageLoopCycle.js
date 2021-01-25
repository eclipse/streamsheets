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

module.exports = {
	withBaseClass: (BaseCycle) => MessageLoopCycle(BaseCycle)
};
