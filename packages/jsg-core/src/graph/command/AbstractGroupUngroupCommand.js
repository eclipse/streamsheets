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
const Command = require('./Command');
const GroupCreator = require('./GroupCreator');
const GraphItem = require('../model/GraphItem');
const Point = require('../../geometry/Point');

/**
 * Base class for {{#crossLink "GroupItemsCommand"}}{{/crossLink}} and
 * {{#crossLink "UnGroupItemsCommand"}}{{/crossLink}} commands. It provides methods to group and
 * ungroup items, which are used in the derived classes. This class does not provide undo, redo or execute
 * implementations and therefore should not be used on its own.</br> The creation of a new group object is done by
 *
 * @class AbstractGroupUngroupCommand
 * @extends Command
 * @constructor
 * @param {Object} [creator] An optional object to create and initialize a new group item. If not provided the
 * {{#crossLink "GroupCreator"}}{{/crossLink}} object will be used.
 */
class AbstractGroupUngroupCommand extends Command {
	constructor(creator) {
		super();
		this._oldBBoxes = [];
		this._creator = creator || new GroupCreator();
	}

	saveBBoxes(items) {
		// we store pin, angle and size of each item for later restore...
		items.forEach((item) => {
			this._oldBBoxes.push({
				pin: item.getPin().copy(),
				size: item.getSize(true).copy(),
				angle: item.getAngle().copy()
			});
		});
	}

	restoreBBoxes(items) {
		let oldbbox;

		items.forEach((item, i) => {
			oldbbox = this._oldBBoxes[i];
			item.getPin().setTo(oldbbox.pin);
			item.setSizeTo(oldbbox.size);
			item.setAngle(oldbbox.angle);
			item.evaluate();
		});
	}

	/**
	 * Returns those {{#crossLink "GraphItem"}}{{/crossLink}}s from given selection which can be
	 * grouped.<br/> Please refer to {{#crossLink
	 * "AbstractGroupUngroupCommand/filterItems:method"}}{{/crossLink}} too.
	 *
	 * @method getItemsFromSelection
	 * @param {GraphItemController[] (deprecated) or GraphItem[]} items Array of
	 *     GraphItemControllers (deprecated) or GraphItems to group.
	 * @return {Array} A list of GraphItems to group.
	 */
	getItemsFromSelection(selection) {
		let items = [];
		let item;

		selection.forEach((sel) => {
			if (sel instanceof GraphItem) {
				item = sel;
			} else {
				item = sel.getModel();
			}

			items.push(item);
		});
		// only group items in same container:
		items = this.filterItems(items);
		return items;
	}

	/**
	 * Called by {{#crossLink
	 * "AbstractGroupUngroupCommand/getItemsFromSelection:method"}}{{/crossLink}} to filter possible
	 * group items and returns a list of those which should be added to new group.<br/> The default implementation
	 * returns those items which have same parent.
	 *
	 * @method filterItems
	 * @param {Array} items A list of possible group items.
	 * @return {Array} A list of items to add to group.
	 */
	filterItems(items) {
		const _items = [];

		if (items && items.length !== 0) {
			const parent = items[0].getParent();

			items.forEach((item) => {
				if (item.getParent() === parent) {
					_items.push(item);
				}
			});
		}
		return _items;
	}

	/**
	 * Create a new Group or Container Node. It is visualized as an invisible Rectangle.
	 *
	 * @method newGroup
	 * @return {Node} A node with invisible line and fill formats.
	 */
	newGroup() {
		return this._creator.create();
	}

	/**
	 * Calculates the BoundingBox for the new group which is defined by the BoundingBoxes of given
	 * {{#crossLink "GraphItem"}}{{/crossLink}}s.
	 *
	 * @method getGroupBBox
	 * @param {Array} items The group items.
	 * @param {BoundingBox} [reusebbox] An optional bounding box to reuse, if not supplied a new one will
	 *     be created.
	 * @return {BoundingBox} The BoundingBox for the group to create.
	 */
	getGroupBBox(items, reusebox) {
		const bbox = items[0].getBoundingBox(reusebox);
		const tmpbbox = items[0].getTranslatedBoundingBox(
			items[0].getGraph(),
			JSG.boxCache.get()
		);
		let i;
		let n;

		bbox.rotate(-tmpbbox.getAngle());
		for (i = 1, n = items.length; i < n; i += 1) {
			bbox.union(items[i].getBoundingBox(tmpbbox));
		}
		JSG.boxCache.release(tmpbbox);
		return bbox;
	}

	/**
	 * Adds given {{#crossLink "GraphItem"}}{{/crossLink}}s to newly created group. This will translate
	 * each item to the groups coordinate system.<br/>
	 * Please refer to {{#crossLink "AbstractGroupUngroupCommand/initItem:method"}}{{/crossLink}}
	 * which is called for each item.
	 *
	 * @method addItems
	 * @param {Array} items The items to add to the group.
	 * @param {GraphItem} group The newly created group to add the items to.
	 */
	addItems(items, group) {
		const tmppoint = JSG.ptCache.get();
		const groupbox = group.getBoundingBox(JSG.boxCache.get());
		const groupAngle = group.getAngle().getValue();
		let evEnabled;

		items.forEach((item) => {
			evEnabled = item.disableEvents();
			// translate origin:
			item.getOrigin(tmppoint);
			group.translateFromParent(tmppoint);
			item.rotate(-groupAngle);
			item.setOriginTo(tmppoint);
			// initialize item:
			this._creator.initItem(item, groupbox);
			group.addItem(item);
			item.enableEvents(evEnabled);
		});

		JSG.ptCache.release(tmppoint);
		JSG.boxCache.release(groupbox);
	}

	/**
	 * Group an array of items within a container. The items will be inserted a subitems in the given group item and
	 * the items will receive formulas to proportionally resize with the group extensions. Items in the group are not
	 * moveable or sizeable.<br/>
	 * Please refer to {{#crossLink "AbstractGroupUngroupCommand/initItem:method"}}{{/crossLink}}
	 * and {{#crossLink "AbstractGroupUngroupCommand/filterItems:method"}}{{/crossLink}} to customize
	 * group content.
	 *
	 * @method group
	 * @param {Array} items Array with GraphItems to be grouped.
	 * @param {Node} newGroup Node to group items inside as subitems.
	 */
	group(items, newGroup) {
		// we need at least 2 items to group:
		if (items.length > 1) {
			// group items...
			const parent = items[0].getParent();
			const groupbox = this.getGroupBBox(items, JSG.boxCache.get());
			parent.addItem(newGroup);
			this._creator.initGroup(newGroup, groupbox);
			this.addItems(items, newGroup);
			JSG.boxCache.release(groupbox);
		}
	}

	/**
	 * Ungroup items in the given node.
	 *
	 * @method ungroup
	 * @param {Node} group Group that contains the items to be ungrouped.
	 */
	ungroup(group) {
		if (group === undefined) {
			return;
		}

		function removeItemsFrom(lgroup, creator) {
			const items = [];
			const groupAngle = group.getAngle().getValue();
			const tmppoint = new Point(0, 0);
			// var selectionMode = group.getItemAttributes().getSelectionMode().getValue();
			lgroup.getItems().forEach((item) => {
				const evEnabled = item.disableEvents();
				// translate origin:
				item.getOrigin(tmppoint);
				lgroup.translateToParent(tmppoint);
				item.rotate(groupAngle);
				item.setOriginTo(tmppoint);

				const size = item.getSize();
				item.setSize(
					size.getWidth().getValue(),
					size.getHeight().getValue()
				);
				// restore item attributes which might have changed:
				creator.restoreItem(item);
				items.push(item);
				item.enableEvents(evEnabled);
			});
			return items;
		}

		const evEnabled = group.disableEvents();
		const parent = group.getParent();
		const items = removeItemsFrom(group, this._creator);

		items.forEach((item) => {
			parent.addItem(item);
		});
		parent.removeItem(group);
		group.enableEvents(evEnabled);
	}
}

module.exports = AbstractGroupUngroupCommand;
