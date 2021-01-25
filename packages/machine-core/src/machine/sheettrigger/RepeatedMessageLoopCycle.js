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
			this.trigger.streamsheet.setMessageProcessed();
			this.schedule();
		}
	};

const Step = (BaseCycle) =>
	class extends BaseCycle {
		getMessageLoopCycle() {
			throw new Error('Not implemented!');
		}
		step() {
			this.trigger.activeCycle = this.getMessageLoopCycle();
			this.trigger.activeCycle.run();
		}
	};

const RepeatedMessageLoopCycle = compose(Activate, Step);

module.exports = {
	withBaseClass: (BaseCycle) => RepeatedMessageLoopCycle(BaseCycle)
};
