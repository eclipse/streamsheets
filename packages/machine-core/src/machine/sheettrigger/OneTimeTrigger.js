/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const BaseTrigger = require('./BaseTrigger');

const TYPE_CONF = Object.freeze({ type: 'once' });

// FOR DEBUGGING PURPOSE ONLY
class OneTimeTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
		this._isTriggered = false;
	}

	step() {
		if (!this._isTriggered) {
			this._isTriggered = true;
			this.processSheet();
		}
	}
}

module.exports = OneTimeTrigger;
