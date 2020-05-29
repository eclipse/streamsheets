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
const CommandProxy = require('./CommandProxy');

/**
 * An AbstractItemCommandProxy can be used to wrap an {{#crossLink
 * "AbstractGroupUngroupCommand"}}{{/crossLink}} instance. This can be useful if you need to hide the actual
 * internal command representation.</br>
 * <b>Note:</b> although this proxy wraps an AbstractItemCommand it is not an instance of it but of
 * CommandProxy.
 *
 * @class AbstractItemCommandProxy
 * @param {Command} cmd The AbstractItemCommand instance to wrap.
 * @constructor
 */
class AbstractItemCommandProxy extends CommandProxy {
	getItem() {
		return this._cmd.getItem();
	}
}

module.exports = AbstractItemCommandProxy;
