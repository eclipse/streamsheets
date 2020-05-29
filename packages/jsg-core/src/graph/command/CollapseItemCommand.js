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
const CompoundCommand = require('./CompoundCommand');
const ChangeAttributeCommand = require('./ChangeAttributeCommand');
const TranslateItemsCommand = require('./TranslateItemsCommand');
const Point = require('../../geometry/Point');
const MathUtils = require('../../geometry/MathUtils');
const AttributeUtils = require('../attr/AttributeUtils');
const ItemAttributes = require('../attr/ItemAttributes');

/**
 * Command to collapse or expand a GraphItem.<br/>
 * This command consists of two sub-commands, namely a {{#crossLink
 * "ChangeAttributeCommand"}}{{/crossLink}} to set the collapse state and a {{#crossLink
 * "TranslateItemCommand"}}{{/crossLink}} to move the GraphItem into correct position afterwards.
 *
 * @example
 *     // item and interactionhandler given
 *     var cmd = new CollapseItemCommand(item);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class CollapseItemCommand
 * @extends Command
 * @constructor
 * @param {GraphItem} graphItem GraphItem to be collapsed or expanded.
 */
class CollapseItemCommand extends CompoundCommand {
	constructor(graphItem) {
		super();

		this._item = graphItem;
		this._colBtnPos = this.getCollapseButtonPosition(
			graphItem,
			new Point()
		);

		const collapseState = graphItem.isCollapsed();
		const path = AttributeUtils.createItemAttributePath(
			ItemAttributes.COLLAPSED
		);
		this.add(
			new ChangeAttributeCommand(
				graphItem,
				path,
				!collapseState,
				collapseState
			)
		);
		// we want to keep position on collapse/expand even if we are not moveable...
		this.add(new TranslateItemsCommand(graphItem, new Point()));
	}

	initNextCommand(cmd /* , index */) {
		if (cmd instanceof TranslateItemsCommand) {
			// init translate command...
			const newColBtnPos = this.getCollapseButtonPosition(
				this._item,
				JSG.ptCache.get()
			);
			this._colBtnPos.subtract(newColBtnPos);
			cmd.translation.setTo(this._colBtnPos);
			JSG.ptCache.release(newColBtnPos);
		}
	}

	getCollapseButtonPosition(item, reusepoint) {
		const pos = item.getOrigin(reusepoint);
		const size = item.getSizeAsPoint(JSG.ptCache.get());
		const btnPos = JSG.ptCache.get();
		switch (
			item.getItemAttribute(ItemAttributes.COLLAPSEDBUTTON).getValue()
		) {
			case ItemAttributes.ButtonPosition.TOPLEFT:
				btnPos.set(0, 0);
				break;
			case ItemAttributes.ButtonPosition.TOPRIGHT:
				btnPos.set(size.x, 0);
				break;
			case ItemAttributes.ButtonPosition.TOPCENTER:
				btnPos.set(size.x / 2.0, 0);
				break;
			case ItemAttributes.ButtonPosition.BOTTOMCENTER:
				btnPos.set(size.x / 2.0, size.y);
				break;
			default:
				break;
		}
		MathUtils.rotatePoint(btnPos, item.getAngle().getValue());
		pos.add(btnPos);
		JSG.ptCache.release(size, btnPos);
		return pos;
	}
}

module.exports = CollapseItemCommand;
