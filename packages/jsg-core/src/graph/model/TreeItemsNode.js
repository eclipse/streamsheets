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
const Node = require('./Node');
const TextFormatAttributes = require('../attr/TextFormatAttributes');
const ItemAttributes = require('../attr/ItemAttributes');
const NotificationCenter = require('../notifications/NotificationCenter');
const Notification = require('../notifications/Notification');
const Numbers = require('../../commons/Numbers');
const Strings = require('../../commons/Strings');
const JSG = require('../../JSG');
const TreeItemAttributes = require('../attr/TreeItemAttributes');
const TreeItem = require('./TreeItem');

const SELECTION_CHANGED_NOTIFICATION = 'tree_selection_changed_notification';
const PRE_COLLAPSE_NOTIFICATION = 'tree_pre_collapse_notification';
const POST_COLLAPSE_NOTIFICATION = 'tree_post_collapse_notification';
const SCROLL_NOTIFICATION = 'tree_scroll_notification';

const DataType = {
	OBJECT: 0,
	ARRAY: 1,
	ARRAYITEM: 2,
	STRING: 3,
	NUMBER: 4,
	BOOLEAN: 5,
	CUSTOM: 6
};

/**
 * @class TreeItemsNode
 * @extends Node
 * @constructor
 */
module.exports = class TreeItemsNode extends Node {
	constructor() {
		super();

		this.addAttribute(new TreeItemAttributes());

		this.getFormat().setLineColor(JSG.theme.frame);
		this.getFormat().setFillColor(JSG.theme.fill);

		this.getTextFormat().setFontSize(9);
		this.getTextFormat().setHorizontalAlignment(TextFormatAttributes.TextAlignment.LEFT);

		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
		this.getItemAttributes().setTopMargin(200);
		this.getItemAttributes().setLeftMargin(200);
		this.getItemAttributes().setSnapTo(false);

		this._currentId = 0;
		this._jsonTree = [];
		this._maxDepth = 0;
		this._maxKey = 0;
		this._maxValue = 0;
		this._disableElementChanges = false;
		this._hideEnabled = false;
		this._saveCollapsed = false;
		this._lastCollapsedState = [];
		this._defaultElementName = 'NewKey';
		this._onlyKeys = false;
		this._checkboxes = false;
	}

	newInstance() {
		return new TreeItemsNode();
	}

	setOnlyKeys(flag) {
		this._onlyKeys = flag;
	}

	getOnlyKeys() {
		return this._onlyKeys;
	}

	setDisableElementChanges(flag) {
		this._disableElementChanges = flag;
	}

	getDisableElementChanges() {
		return this._disableElementChanges;
	}

	setCheckboxes(flag) {
		this._checkboxes = flag;
	}

	getCheckboxes() {
		return this._checkboxes;
	}

	setHideEnabledItems(flag) {
		this._hideEnabled = flag;
	}

	getHideEnabledItems() {
		return this._hideEnabled;
	}

	setSelection(id, data) {
		this.sendCustomDeSelect(this.getSelectedItem());

		super.setSelection(id, data);

		const mySelectionId = String(this.getSelectionId());
		if (id === mySelectionId) {
			// inform view, so the selection can scroll into visible viewport
			NotificationCenter.getInstance().send(new Notification(TreeItemsNode.SELECTION_CHANGED_NOTIFICATION, this));
			this.sendCustomSelect(this.getSelectedItem());
		}
	}

	_assignName(id) {
		this.setName(`TreeItem${id}`);
	}

	isAddLabelAllowed() {
		return false;
	}

	getTreeItemAt(index) {
		return this._jsonTree[index];
	}

	getJsonTree() {
		return this._jsonTree;
	}

	setJsonTree(tree) {
		this._jsonTree = tree;
	}

	getSelectedItemPath() {
		const mySelection = this.getSelection(String(this.getSelectionId()));
		if (mySelection === undefined) {
			return undefined;
		}
		const treeItem = this.getTreeItemById(mySelection.getValue());
		if (treeItem === undefined) {
			return undefined;
		}

		return this.getItemPath(treeItem);
	}

	getSelectedItem() {
		const mySelection = this.getSelection(String(this.getSelectionId()));
		if (mySelection === undefined) {
			return undefined;
		}
		return this.getTreeItemById(mySelection.getValue());
	}

	getItemPath(treeitem) {
		const parts = [];
		let { depth, level } = treeitem;
		let result = '';
		const tree = this.getJsonTree();

		while (depth >= 0) {
			const modelItem = tree[level];
			parts.push(modelItem.key);
			level = tree[level].parent;
			depth -= 1;
		}

		for (let i = parts.length - 1; i >= 0; i -= 1) {
			result += `[${parts[i]}]`;
		}

		return result;
	}

	getTreeItemById(id) {
		if (id === undefined) {
			return undefined;
		}

		const model = this.getJsonTree();
		let index;

		model.some((litem, i) => {
			if (litem.id === id) {
				index = i;
				return true;
			}
			return false;
		});

		if (index !== undefined) {
			return model[index];
		}

		return undefined;
	}


	static splitPath(path) {
		const keys = [];
		let key;
		let level = 0;

		for (let i = 0; i < path.length; i += 1) {
			switch (path[i]) {
			case '[':
				level += 1;
				if (level === 1) {
					key = '';
				} else {
					key += path[i];
				}
				break;
			case ']':
				if (level === 1) {
					keys.push(key);
					key = '';
				} else {
					key += path[i];
				}
				level -= 1;
				break;
			default:
				key += path[i];
				break;
			}
		}

		return keys;
	}
	/**
	 * Get the item, that is identified, by the given path.
	 * @param {String} path Path to search for.
	 * @returns {TreeItem} Tree item, if it could be found.
	 */
	getItemByPath(keys) {
		const model = this.getJsonTree();
		let depth = 0;
		let index;

		if (keys.length === 0) {
			return undefined;
		}

		model.some((litem, i) => {
			if (litem.key === keys[depth] && litem.depth <= depth) {
				if (litem.depth === keys.length - 1) {
					index = i;
					return true;
				}
				depth += 1;
			}
			return false;
		});

		if (index !== undefined) {
			return model[index];
		}

		return undefined;
	}

	setTree(tree) {
		if (this._saveCollapsed && this._jsonTree.length) {
			this._lastCollapsedState = this.getCollapsedItemPaths();
		}

		const treeItemLevel = { level: 0 };
		const treeItemAttr = this.getTreeItemAttributes();

		this._treeItemWidth = treeItemAttr.getTreeItemWidth().getValue();
		this._treeItemHeight = treeItemAttr.getTreeItemHeight().getValue();
		this._treeItemLeftMargin = this.getItemAttributes()
			.getLeftMargin()
			.getValue();
		this._indentOffset = treeItemAttr.getIndentOffset().getValue();
		this._depthOffset = treeItemAttr.getDepthOffset().getValue();

		this.setColors();

		this._currentId = 0;
		this._jsonTree = this.decomposeJson(tree, 0, treeItemLevel, undefined, []);

		this.updateLevels();
	}

	setColors() {
		const treeItemAttr = this.getTreeItemAttributes();

		this._colorScheme = {
			JSON_VALUE: treeItemAttr.getColorJsonValue().getValue(),
			JSON_BOOLEAN: treeItemAttr.getColorJsonBoolean().getValue(),
			JSON_STRING: treeItemAttr.getColorJsonString().getValue(),
			JSON_NUMBER: treeItemAttr.getColorJsonNumber().getValue(),
			JSON_OBJECT: treeItemAttr.getColorJsonObject().getValue(),
			JSON_ARRAY: treeItemAttr.getColorJsonArray().getValue(),
			JSON_KEY_TEXT: treeItemAttr.getColorJsonKeyText().getValue(),
			JSON_SELECTION_OVERLAY_COLOR: treeItemAttr.getSelectionOverlayColor().getValue()
		};
	}

	/**
	 * Set Json Object as String to fill tree.
	 * @param {String} json JSON String to use.
	 * @returns {boolean} Returns true if successful, otherwise false.
	 */
	setJson(json) {
		let tree;

		try {
			tree = JSON.parse(json);
		} catch (ex) {
			return false;
		}

		this.setTree(tree);

		return true;
	}

	pasteJson(json) {
		let tree;

		try {
			tree = JSON.parse(json);
		} catch (ex) {
			return false;
		}

		const treeItemLevel = { level: 0 };

		const jsonTree = this.decomposeJson(tree, 0, treeItemLevel, undefined, []);

		this._jsonTree.push(...jsonTree);

		this.updateLevels();

		return true;
	}

	/**
	 * Get the content of the tree as a JSON string
	 * @returns {String} Json Objec as String
	 */
	getJson() {
		const model = this.getJsonTree();
		return this.getJsonForItems(model);
	}

	getJsonForItem(item) {
		const model = this.getJsonTree();
		const itemModel = [];
		const baseItem = item.copy();

		itemModel.push(baseItem);

		let i;
		let litem;
		const { level, depth } = baseItem;

		for (i = level + 1; i < model.length; i += 1) {
			litem = model[i].copy();
			if (litem.depth > depth) {
				litem.depth -= baseItem.depth;
				itemModel.push(litem);
			} else {
				break;
			}
		}

		baseItem.depth = 0;

		return this.getJsonForItems(itemModel);
	}

	getJsonForItems(model) {
		let root;
		let current;

		// TODO validate method

		if (model.length === 0) {
			return '{}';
		}

		const keys = [];

		if (model[0].type === DataType.ARRAYITEM) {
			root = [];
			keys.push({ key: '', type: DataType.ARRAY });
		} else {
			root = {};
			keys.push({ key: '', type: DataType.OBJECT });
		}

		model.forEach((item, index) => {
			current = root;
			for (let i = 1; i <= item.depth; i += 1) {
				current = current[keys[i].key];
			}
			switch (item.type) {
				case DataType.ARRAY:
					keys[item.depth + 1] = { key: item.key, type: DataType.ARRAY };
					current[item.key] = [];
					break;
				case DataType.OBJECT:
					keys[item.depth + 1] = { key: item.key, type: DataType.OBJECT };
					if (keys[item.depth] === DataType.ARRAY) {
						current[Number(item.key)] = {};
					} else {
						current[item.key] = {};
					}
					break;
				case DataType.ARRAYITEM:
					break;
				case DataType.STRING:
					current[item.key] = item.value ? item.value : '';
					break;
				case DataType.NUMBER:
					current[item.key] = Number(item.value);
					break;
				case DataType.BOOLEAN:
					current[item.key] = Boolean(item.value);
					break;
				default:
					current[item.key] = item.value;
					break;
			}
			this.sendCustomGet(item, current, item.key);
		});

		let result;

		try {
			result = JSON.stringify(root);
		} catch (ex) {
			result = 'error';
		}

		return result;
	}

	/**
	 * Create internal model.
	 *
	 * @param jsonModel
	 * @param startDepth
	 * @param treeItemLevel
	 * @param jsonTree
	 * @returns {Array}
	 */
	decomposeJson(jsonModel, startDepth, treeItemLevel, parent, jsonTree) {
		const initDepth = startDepth;

		const getItem = (key, value, depth, type, expanded) => {
			const item = new TreeItem(this._currentId.toString(), key, value, depth, expanded);

			item.type = type;

			this._currentId += 1;

			if (this._customKey) {
				this.sendCustomInit(item);
			}

			return item;
		};

		Object.keys(jsonModel).forEach((key) => {
			if (key === this._customKey && parent) {
				parent[this._customKey] = jsonModel[key];
				this.sendCustomSet(parent);
				return;
			}
			if (jsonModel[key] instanceof Array) {
				jsonTree[treeItemLevel.level] = getItem(key, undefined, startDepth, DataType.ARRAY, true);
				treeItemLevel.level += 1;
				startDepth += 1;
				const arrayItemDepth = startDepth;
				Object.keys(jsonModel[key]).forEach((itemKey) => {
					const value = jsonModel[key][itemKey];
					if (value instanceof Array || value instanceof Object) {
						jsonTree[treeItemLevel.level] = getItem(
							itemKey,
							undefined,
							startDepth,
							value instanceof Array ? DataType.ARRAY : DataType.OBJECT,
							true
						);
						treeItemLevel.level += 1;
						startDepth += 1;
						this.decomposeJson(
							value,
							startDepth,
							treeItemLevel,
							jsonTree[treeItemLevel.level - 1],
							jsonTree
						);
					} else {
						jsonTree[treeItemLevel.level] = getItem(itemKey, value, startDepth, undefined, null);
						treeItemLevel.level += 1;
					}
					startDepth = arrayItemDepth;
				});
				startDepth -= 1;
			} else if (jsonModel[key] instanceof Object) {
				jsonTree[treeItemLevel.level] = getItem(key, undefined, startDepth, DataType.OBJECT, true);
				startDepth += 1;
				treeItemLevel.level += 1;
				this.decomposeJson(
					jsonModel[key],
					startDepth,
					treeItemLevel,
					jsonTree[treeItemLevel.level - 1],
					jsonTree
				);
				startDepth = initDepth;
			} else {
				jsonTree[treeItemLevel.level] = getItem(key, jsonModel[key], startDepth, undefined, null);
				treeItemLevel.level += 1;
			}
		});

		return jsonTree;
	}

	/**
	 * Check if any top level parent is expanded
	 * @param item Item to check
	 * @returns {boolean}
	 */
	isParentExpanded(item) {
		while (item.parent >= 0) {
			item = this._jsonTree[item.parent];
			if (item.expanded === false) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Fix item information by assigning visibility, level, drawlevel and type
	 */
	updateLevels() {
		let level = 0;
		let drawlevel = 0;
		const parents = [];
		const indices = [];

		const checkId = (id) =>
			this._jsonTree.every((item) => {
				if (item.id !== undefined && item.id === id) {
					return false;
				}
				return true;
			});

		const getFreeId = () => {
			let id = this._jsonTree.length;
			let unique;
			do {
				unique = checkId(id.toString());
				if (unique === false) {
					id += 1;
				}
			} while (!unique);

			return id.toString();
		};

		this.setColors();
		this._maxDepth = 0;
		this._maxKey = 0;
		this._maxValue = 0;

		this._jsonTree.forEach((item, index) => {
			item.level = level;
			if (item.id === undefined) {
				item.id = getFreeId();
			}

			if (item.key === undefined) {
				item.key = `${this._defaultElementName}${item.id}`;
			}

			parents[item.depth] = item.level;
			if (item.depth) {
				item.parent = parents[item.depth - 1];
			} else {
				item.parent = -1;
			}
			item.visible = this.isParentExpanded(item);
			if (item.visible) {
				item.drawlevel = drawlevel;
				drawlevel += 1;
			}
			// set index of level to zero, if new array
			if (item.type === DataType.ARRAY) {
				indices[item.depth] = 0;
			}
			// if object and first subitem has key 0, convert to array
			if (item.type === DataType.OBJECT) {
				if (index === this._jsonTree.length - 1 || this._jsonTree[index + 1].depth === item.depth) {
					item.type = DataType.STRING;
				} else {
					let subIndex = index + 1;
					let array = true;
					let cnt = 0;
					while (subIndex < this._jsonTree.length) {
						if (this._jsonTree[subIndex].depth === item.depth + 1 && this._jsonTree[subIndex].key !== String(cnt)) {
							array = false;
						}
						if (this._jsonTree[subIndex].depth <= item.depth) {
							break;
						}
						if (this._jsonTree[subIndex].depth === item.depth + 1) {
							cnt += 1;
						}
						subIndex += 1;
					}
					if (array) {
						item.type = DataType.ARRAY;
						indices[item.depth] = 0;
					}
				}
			}
			if (this.isParentArray(item)) {
				item.key = indices[item.depth - 1].toString();
				indices[item.depth - 1] += 1;
			} else if (item.parent >= 0) {
				const parent = this._jsonTree[item.parent];
				parent.color = parent.fillcolor || this._colorScheme.JSON_OBJECT;
				parent.type = DataType.OBJECT;
			}
			// if on same level, previous item is not a parent
			if (index && item.depth <= this._jsonTree[index - 1].depth) {
				this._jsonTree[index - 1].expanded = null;
			}
			if (index === this._jsonTree.length - 1) {
				// last item can never be expanded
				item.expanded = null;
			}
			// update expanded flag of parent
			if (item.parent >= 0) {
				const parent = this._jsonTree[item.parent];
				parent.expanded = item.visible;
			}

			switch (item.type) {
				case DataType.OBJECT:
					item.color = this._colorScheme.JSON_OBJECT;
					break;
				case DataType.ARRAY:
					item.color = this._colorScheme.JSON_ARRAY;
					break;
				case DataType.STRING:
					item.color = this._colorScheme.JSON_STRING;
					break;
				case DataType.NUMBER:
					item.color = this._colorScheme.JSON_NUMBER;
					break;
				case DataType.BOOLEAN:
					item.color = this._colorScheme.JSON_BOOLEAN;
					break;
				default:
					if (Numbers.isNumber(item.value)) {
						item.type = DataType.NUMBER;
						item.color = this._colorScheme.JSON_NUMBER;
					} else if (typeof item.value === 'boolean') {
						item.type = DataType.BOOLEAN;
						item.color = this._colorScheme.JSON_BOOLEAN;
					} else {
						item.type = DataType.STRING;
						item.color = this._colorScheme.JSON_STRING;
					}
					break;
			}
			item.color = item.fillcolor || item.color;
			item.fontcolor = item.fontcolor || '#000000';

			this._maxDepth = Math.max(this._maxDepth, item.depth);
			this._maxKey = Math.max(this._maxKey, item.key.toString().length);
			if (item.value) {
				this._maxValue = Math.max(this._maxValue, item.value.toString().length);
			}

			level += 1;
		});
	}

	/**
	 * Check, if parent is of type ARRAY
	 * @param item
	 * @returns {boolean} True, if ARRAY otherwise false
	 */
	isParentArray(item) {
		if (item.parent >= 0) {
			if (this._jsonTree[item.parent].type === DataType.ARRAY) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get Tree Item Attributes
	 * @returns {TreeItemAttributes}
	 */
	getTreeItemAttributes() {
		return this.getModelAttributes().getAttribute(TreeItemAttributes.NAME);
	}

	/**
	 * Get number of items in tree
	 * @returns {Number} Number of items in tree.
	 */
	getTreeItemCount() {
		return this._jsonTree.length;
	}

	/**
	 * Get number of visible tree items.
	 *
	 * @returns {number} Number of currently visible tree items.
	 */
	getVisibleTreeItemCount() {
		let cnt = 0;
		this.getJsonTree().forEach((item) => {
			if (item.visible) {
				cnt += 1;
			}
		});

		return cnt;
	}

	getPastePosition(item) {
		const model = this.getJsonTree();
		let i;
		let itemTemp;

		if (item.level < model.length - 1) {
			itemTemp = model[item.level + 1];
			if (item.depth > itemTemp.depth) {
				return { level: item.level + 1, depth: item.depth };
			}
		}

		for (i = item.level + 1; i < model.length; i += 1) {
			itemTemp = model[i];
			if (item.depth === itemTemp.depth) {
				return itemTemp;
			}
		}

		return undefined;
	}

	getSubTreeForLevel(level, depth) {
		const model = this.getJsonTree();
		const subTreeData = [];
		let i;
		let item;

		for (i = level + 1; i < model.length; i += 1) {
			item = model[i];
			if (item.depth > depth) {
				subTreeData.push(item);
			} else {
				break;
			}
		}
		return subTreeData;
	}

	getSubTreeItemCount(parent, onlyLeafs) {
		let cnt = 0;
		const model = this.getJsonTree();

		this.enumerateChildren(parent, (item, i) => {
			if (onlyLeafs) {
				if (item.depth === parent.depth + 1) {
					if (i === model.length - 1 || item.depth >= model[i + 1].depth) {
						cnt += 1;
					}
				}
			} else {
				cnt += 1;
			}
		});

		return cnt;
	}

	changeSubTreeDepth(parent, value) {
		this.enumerateChildren(parent, (item) => {
			item.depth += value;
		});
	}

	getSubTreeForItem(parent, onlyLeafs) {
		const subTreeData = [];
		const model = this.getJsonTree();

		this.enumerateChildren(parent, (item, i) => {
			if (onlyLeafs) {
				if (item.depth === parent.depth + 1) {
					if (i === model.length - 1 || item.depth >= model[i + 1].depth) {
						subTreeData.push(item);
					}
				}
			} else {
				subTreeData.push(item);
			}
		});

		return subTreeData;
	}

	saveCopyDataForLevel(selectedItem) {
		const copyData = [];
		const firstItem = new TreeItem(
			selectedItem.id,
			selectedItem.key,
			selectedItem.value,
			selectedItem.depth,
			selectedItem.expanded
		);

		firstItem.type = selectedItem.type;
		firstItem.expanded = selectedItem.expanded;
		firstItem.parent = -1;

		this.sendCustomCopy(selectedItem, firstItem);
		copyData.push(firstItem);

		const model = this.getJsonTree();
		let i;
		let item;

		for (i = selectedItem.level + 1; i < model.length; i += 1) {
			item = model[i];
			if (item.depth > selectedItem.depth) {
				const copyItem = new TreeItem(item.id, item.key, item.value, item.depth, item.expanded);

				copyItem.type = item.type;
				copyItem.expanded = item.expanded;
				copyItem.parent = model[item.parent].id;

				this.sendCustomCopy(item, copyItem);
				copyData.push(copyItem);
			} else {
				break;
			}
		}

		JSG.clipTree = copyData;
	}

	enumerateChildren(parent, func) {
		const model = this.getJsonTree();
		let i;
		let item;

		for (i = parent.level + 1; i < model.length; i += 1) {
			item = model[i];
			if (item.depth > parent.depth) {
				func.call(this, item, i);
			} else {
				break;
			}
		}
	}

	saveContent(writer, absolute) {
		super.saveContent(writer, absolute);

		writer.writeAttributeString('type', 'treeitemsnode');

		writer.writeStartElement('data');
		writer.writeStartArray('item');

		this._jsonTree.forEach((item) => {
			writer.writeStartElement('item');

			writer.writeAttributeString('id', item.id);
			writer.writeAttributeString('key', Strings.encode(item.key));
			if (item.value !== undefined) {
				writer.writeAttributeString('value', Strings.encode(item.value.toString()));
			}
			writer.writeAttributeNumber('depth', item.depth, 0);
			writer.writeAttributeNumber('type', item.type, 0);
			writer.writeAttributeString('color', item.color);
			writer.writeAttributeString('visible', item.visible);
			writer.writeAttributeString('expanded', item.expanded === null ? '-1' : item.expanded);
			writer.writeAttributeNumber('parent', item.parent, 0);

			writer.writeEndElement();
		});

		writer.writeEndArray('item');
		writer.writeEndElement();
	}

	read(reader, object) {
		super.read(reader, object);

		this._jsonTree = [];

		const data = reader.getObject(object, 'data');
		if (data === undefined) {
			return;
		}

		reader.iterateObjects(data, (name, child) => {
			switch (name) {
				case 'item': {
					let expanded = reader.getAttribute(child, 'expanded');
					const parent = reader.getAttribute(child, 'parent');
					expanded = expanded === '-1' ? null : expanded === 'true';
					const item = new TreeItem(
						reader.getAttribute(child, 'id'),
						reader.getAttribute(child, 'key'),
						reader.getAttribute(child, 'value'),
						Number(reader.getAttribute(child, 'depth')),
						expanded
					);
					item.type = Number(reader.getAttribute(child, 'type'));
					item.color = reader.getAttribute(child, 'color');
					item.visible = reader.getAttribute(child, 'visible') === 'true';
					item.parent = parent === null ? -1 : Number(parent);
					item.key = Strings.decode(item.key);
					if (item.value) {
						item.value = Strings.decode(item.value);
					}
					this._jsonTree.push(item);
					break;
				}
				default:
					break;
			}
		});

		this.updateLevels();
	}

	getCollapsedItemPaths() {
		const model = this.getJsonTree();
		const paths = [];

		model.forEach((item) => {
			// for all subtrees in level
			if (item.expanded === false) {
				paths.push(this.getItemPath(item));
			}
		});

		return paths;
	}

	collapseItemsByPaths(paths) {
		if (paths === undefined) {
			return;
		}

		paths.forEach((path) => {
			const item = this.getItemByPath(TreeItemsNode.splitPath(path));
			if (item !== undefined) {
				item.expanded = false;
			}
		});
		this.updateLevels();
		this.getGraph().markDirty();
	}

	expandTreeToDepth(depth) {
		const model = this.getJsonTree();

		NotificationCenter.getInstance().send(new Notification(TreeItemsNode.PRE_COLLAPSE_NOTIFICATION, this));

		model.forEach((item) => {
			// for all subtrees in level
			if (item.parent >= 0) {
				model[item.parent].expanded = item.depth <= depth;
			}
			item.visible = this.isParentExpanded(item);
		});

		this.updateLevels();

		NotificationCenter.getInstance().send(new Notification(TreeItemsNode.POST_COLLAPSE_NOTIFICATION, this));

		this.getGraph().markDirty();
	}

	setCustomDataHandler(key, handler) {
		this._customKey = key;
		this._customKeyHandler = handler;
	}

	sendCustomInit(treeitem) {
		if (this._customKeyHandler && this._customKeyHandler.onInit) {
			this._customKeyHandler.onInit(treeitem);
		}
	}

	sendCustomSet(treeitem) {
		if (this._customKeyHandler && this._customKeyHandler.onSet) {
			this._customKeyHandler.onSet(treeitem);
		}
	}

	sendCustomGet(treeitem, element, key) {
		if (this._customKeyHandler && this._customKeyHandler.onGet) {
			this._customKeyHandler.onGet(treeitem, element, key);
		}
	}

	sendCustomAdd(treeitem) {
		if (this._customKeyHandler && this._customKeyHandler.onAdd) {
			this._customKeyHandler.onAdd(treeitem);
		}
	}

	sendCustomSelect(treeitem) {
		if (this._customKeyHandler && this._customKeyHandler.onSelect) {
			this._customKeyHandler.onSelect(treeitem);
		}
	}

	sendCustomDeSelect(treeitem) {
		if (this._customKeyHandler && this._customKeyHandler.onDeSelect) {
			this._customKeyHandler.onDeSelect(treeitem);
		}
	}

	sendCustomUpdate(treeitem) {
		if (this._customKeyHandler && this._customKeyHandler.onUpdate) {
			this._customKeyHandler.onUpdate(treeitem);
		}
	}

	sendCustomDelete(treeitems) {
		if (this._customKeyHandler && this._customKeyHandler.onDelete) {
			treeitems.forEach((treeitem) => {
				this._customKeyHandler.onDelete(treeitem);
			});
		}
	}

	sendCustomCopy(source, target) {
		if (this._customKeyHandler && this._customKeyHandler.onCopy) {
			this._customKeyHandler.onCopy(source, target);
		}
	}

	sendCustomPaste(items) {
		if (this._customKeyHandler && this._customKeyHandler.onPaste) {
			items.forEach((item) => {
				this._customKeyHandler.onPaste(item.source, item.target);
			});
		}
	}

	static get DataType() {
		return DataType;
	}

	static get SELECTION_CHANGED_NOTIFICATION() {
		return SELECTION_CHANGED_NOTIFICATION;
	}

	static get PRE_COLLAPSE_NOTIFICATION() {
		return PRE_COLLAPSE_NOTIFICATION;
	}

	static get POST_COLLAPSE_NOTIFICATION() {
		return POST_COLLAPSE_NOTIFICATION;
	}

	static get SCROLL_NOTIFICATION() {
		return SCROLL_NOTIFICATION;
	}
};
