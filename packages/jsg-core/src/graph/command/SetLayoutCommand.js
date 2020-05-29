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
const JSG = require('../../JSG');
const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * Command to change the layout of an item.<br/>
 * The new layout is given by its unique type string which is used to reference the actual {{#crossLink
 * "Layout"}}{{/crossLink}} instance via the global {{#crossLink
 * "LayoutFactory"}}{{/crossLink}}.
 *
 * @class SetLayoutCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item Item to assign a new layout to.
 * @param {String} layouttype The type string of the layout to assign.
 * @since 2.0.22.8
 */
class SetLayoutCommand extends AbstractItemCommand {
	constructor(item, layouttype) {
		super(item);

		const oldlayout = item.getLayout();
		this.newlayout = layouttype;
		this.oldlayout = oldlayout && oldlayout.getType();
		this.oldlayoutsettings = oldlayout && oldlayout.getSettings(item);
	}

	undo() {
		this._graphItem.setLayout(this.oldlayout);
		if (this.oldlayoutsettings) {
			this._graphItem
				.getLayout()
				.registerSettings(this._graphItem, this.oldlayoutsettings);
		}
	}

	redo() {
		this._graphItem.setLayout(this.newlayout);
	}
}

module.exports = SetLayoutCommand;
