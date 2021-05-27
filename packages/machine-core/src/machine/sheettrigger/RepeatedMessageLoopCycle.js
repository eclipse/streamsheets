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
const RepeatedMessageLoopCycle = (BaseCycle) =>
	class extends BaseCycle {
		activate() {
			super.activate();
			this.streamsheet.messageHandler.setProcessed();
			this.schedule();
		}
		getMessageLoopCycle() {
			throw new Error('Not implemented!');
		}
		step() {
			this.trigger.activeCycle = this.getMessageLoopCycle();
			this.trigger.activeCycle.run();
		}
	};

module.exports = {
	withBaseClass: (BaseCycle) => RepeatedMessageLoopCycle(BaseCycle)
};
