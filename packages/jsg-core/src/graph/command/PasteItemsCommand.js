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
const Graph = require('../model/Graph');
const CellsNode = require('../model/CellsNode');
const TextNode = require('../model/TextNode');
const JSONReader = require('../../commons/JSONReader');
const Arrays = require('../../commons/Arrays');
const Point = require('../../geometry/Point');
const GraphUtils = require('../GraphUtils');
const ItemAttributes = require('../attr/ItemAttributes');
const GraphItem = require('../model/GraphItem');

/**
 * The PasteItemsCommand provides a command to paste previously copied items from the internal clipboard. If you copy a
 * selection the result stream will be stored in the global JSG.clipXML variable. This can be used for pasting items.
 *
 * @example
 *     // interactionhandler and item given
 *     // Paste from previously copied json stream. The items are pasted using an offset of 200, 200 units.
 *     var cmd = new PasteItemsCommand(JSG.clipXML, interactionHandler.viewer, new
 *     Point(200, 200), undefined); interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class PasteItemsCommand
 * @extends Command
 * @constructor
 * @param {String} json String representing a JSON structure describing the items to be inserted.
 * @param {GraphViewer} [viewer] Current GraphViewer. If viewer is not given, target must be defined!
 * @param {GraphItem} [target] Controller or GraphItem to
 *     add the inserted items to. If not specified the items will be added to the graph. Otherwise the items will be
 *     added as sub-items to the given controller or GraphItem.
 * @param {Point} [offset] Offset to move items by after they have been inserted. If specified
 * this offset is taken no matter what. If not given an offset is calculated.
 */
class PasteItemsCommand extends Command {
	static createFromObject(data = {}, { graph, viewer }) {
		const item = graph.getItemById(data.parentId) || graph;
		return new PasteItemsCommand(
			data.json,
			viewer,
			item,
			data.offset ? new Point(data.offset.x, data.offset.y) : undefined
		).initWithObject(data);
	}
	constructor(json, viewer, target, offset) {
		super();

		this.json = json;
		this.items = [];
		// pasted items...
		this.viewer = viewer;
		// target item...
		if (target) {
			this.parent =
				target instanceof GraphItem
					? target
					: target.getModel();
		} else {
			this.parent = undefined;
		}
		// use this offset to trans lated pasted items...
		this.offset = offset;

		if (viewer) {
			this.oldSelection = viewer.getSelection();
		}
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();

		// save current pasted items, so ids are already correct
		const file = new JSG.JSONWriter();

		file.writeStartDocument();
		file.writeStartElement('clip');
		file.writeStartArray('graphitem');

		this.items.forEach((item) => {
			item.resolveParentReferences(true);
			item.save(file, true);
		});

		file.writeEndArray('graphitem');
		file.writeEndElement();
		file.writeEndDocument();

		data.json = file.flush();
		data.parentId =
			this.parent === undefined
				? this._getTargetParent().getId()
				: this.parent.getId();
		data.offset = this.offset;

		return data;
	}

	getItems() {
		return this.items;
	}

	/**
	 * Execute the paste command by pasting the items.
	 *
	 * @method execute
	 */
	execute() {
		const reader = this._getReader();
		const head = this._getStartNode(reader);

		if (head === undefined) {
			return;
		}

		this.parentOfClip = Number(head['a-graphitem'][0].parentid);

		// store it to global object, because its internal fields are accessed during paste...
		// if paste is initiated by another client, id do not need to be updated
		if (this.viewer) {
			JSG.idUpdater.start();
		}

		this._paste(reader, head);

		// if paste is initiated by another client, id do not need to be updated
		if (this.viewer) {
			JSG.idUpdater.end(this.viewer.getGraph());
			this._selectItems(this.items);
		} else {
			// but connections need to be restored
			const graph = this.parent.getGraph();
			if (graph) {
				graph._restoreConnections(graph);
			}
		}
	}

	_getReader() {
		if (this.json === undefined) {
			return undefined;
		}
		return new JSONReader(this.json);
	}

	_getStartNode(reader) {
		return reader.getObject(reader.getRoot(), 'clip');
	}

	_paste(reader, head) {
		if (this.parent === undefined) {
			this.parent = this._getTargetParent();
		}
		return this._pasteTo(this.parent, reader, head);
	}

	_getTargetParent() {
		if (this.viewer === undefined) {
			return undefined;
		}

		if (this.viewer.getDefaultController()) {
			return this.viewer.getDefaultController().getModel();
		}

		const selectionProvider = this.viewer.getSelectionProvider();
		if (selectionProvider.hasSingleSelection()) {
			const CONT = ItemAttributes.CONTAINER;
			let selection = selectionProvider.getFirstSelection();
			while (
				selection
					.getModel()
					.getItemAttribute(CONT)
					.getValue() === false
			) {
				selection = selection.getParent();
			}

			// ensure we are not copying inside ourself...
			const ids = this._getPasteIds(selectionProvider);
			return this._getVerifiedParent(selection.getModel(), ids);
		}

		if (this.parentOfClip !== undefined) {
			const parent = this.viewer
				.getGraph()
				.getItemById(this.parentOfClip);
			if (parent) {
				return parent;
			}
		}

		return this.viewer.getGraphController().getModel();
	}

	_getPasteIds(selectionProvider) {
		const ids = [];
		const reader = this._getReader();
		const head = this._getStartNode(reader);

		reader.iterateObjects(head, (name, child) => {
			switch (name) {
				case 'gi':
				case 'graphitem': {
					const id = reader.getAttribute(child, 'id');
					if (id !== undefined) {
						ids.push(Number(id));
					}
					break;
				}
				default:
					break;
			}
		});

		const selcontext = selectionProvider.getSelectionContext();
		if (selcontext !== undefined && selcontext.type === 'type.jsgpaste') {
			selcontext.forEach((context) => {
				ids.push(context);
			});
		}
		return ids;
	}

	_getVerifiedParent(parent, forbiddenIDs) {
		const CONT = ItemAttributes.CONTAINER;
		while (
			parent !== undefined &&
			(Arrays.contains(forbiddenIDs, parent.getId()) ||
				parent.getItemAttribute(CONT).getValue() === false)
		) {
			parent = parent.getParent();
		}

		return parent;
	}

	_pasteTo(parent, reader, head) {
		let items = this._readItems(reader, head);
		items = this.filterItems(items, parent);
		this._pasteItems(items, parent);
	}

	_readItems(reader, head) {
		const items = [];

		reader.iterateObjects(head, (name, child) => {
			switch (name) {
				case 'graphitem':
				case 'gi': {
					const type = reader.getAttribute(child, 'type');
					const graphItem = JSG.graphItemFactory.createItemFromString(
						type,
						true
					);
					if (graphItem) {
						graphItem.read(reader, child);
						items.push(graphItem);
					}
					break;
				}
				default:
					break;
			}
		});

		return items;
	}

	_pasteItems(items, parent) {
		const tmpbbox = JSG.boxCache.get();
		const itemsbbox = JSG.boxCache.get();
		let cellOffset;

		if (parent instanceof CellsNode) {
			const sheet = parent.getParent().getParent();
			const selection = sheet.getOwnSelection();
			if (selection.hasSelection()) {
				const rect = sheet.getCellRect(selection.getAt(0));
				cellOffset = { x: rect.x, y: rect.y };
			}
		}

		items.forEach((item, i) => {
			parent.addItem(item);
			// for text nodes set new text format parent...
			if (item instanceof TextNode) {
				if (parent instanceof Graph) {
					// if an associated label is added to a graph, it needs to be disassociated
					item.associate(false);
				}
				if (item.isAssociated()) {
					item.getTextFormat().setParent(parent.getTextFormat());
				}
			}
			item.getBoundingBox(tmpbbox);
			if (i === 0) {
				itemsbbox.setTo(tmpbbox);
			} else {
				itemsbbox.union(tmpbbox);
			}
			if (!cellOffset) {
				this._translateToParent(item, parent);
			}
			this.items.push(item);
		});
		if (cellOffset) {
			items.forEach((item) => {
				item.disableRefresh();
				item.translate(-itemsbbox.getLeft() + cellOffset.x, -itemsbbox.getTop()+  + cellOffset.y);
				item.enableRefresh();
			});
		} else {
			this._translateItems(this.items, itemsbbox);
		}
		JSG.boxCache.release(tmpbbox, itemsbbox);
	}

	/**
	 * Called by command to filter {{#crossLink "GraphItem"}}{{/crossLink}}s before paste.</br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns passed items list.
	 * @method filterItems
	 * @param {Array} items A list of items to filter.
	 * @param {GraphItem} parent The item to paste to.
	 * @return {Array} A list of items which should be pasted.
	 * @since 2.0.20.1
	 */
	filterItems(items /* , parent */) {
		return items;
	}

	_removeAttribute(item, name) {
		const remove = (itm) => {
			const attr = itm.getItemAttributes().getAttribute(name);
			if (attr) {
				itm.getItemAttributes().removeAttribute(attr);
			}
			itm.setName('');
			return true;
		};

		GraphUtils.traverseItem(item, remove);
	}

	_translateToParent(item, parent) {
		let angle = item.getAngle().getValue();
		const pin = item.getPinPoint(JSG.ptCache.get());

		function translate(itm) {
			angle -= itm.getAngle().getValue();
			itm.translateFromParent(pin);
			return true;
		}

		GraphUtils.traverseItemDown(item, parent, translate);
		item.disableRefresh();
		item.setAngle(angle);
		item.setPinPointTo(pin);
		item.enableRefresh();
		JSG.ptCache.release(pin);
	}

	_translateItems(items, bbox) {
		let angle = 0;
		let offset;
		// const offset =
		// 	this.offset !== undefined
		// 		? JSG.ptCache.get().setTo(this.offset)
		// 		: this._getOffset(this.parent, bbox, JSG.ptCache.get());

		if (this.offset === undefined) {
			JSG.clipOffset.add(new Point(200, 200));
			offset = JSG.clipOffset.copy()
		} else {
			offset = JSG.ptCache.get().setTo(this.offset);
		}

		function translate(itm) {
			angle += itm.getAngle().getValue();
			return true;
		}

		GraphUtils.traverseItemUp(
			this.parent,
			this.parent.getGraph(),
			translate
		);
		offset.rotate(-angle);

		items.forEach((item) => {
			item.disableRefresh();
			item.translate(offset.x, offset.y);
			item.enableRefresh();
		});
		JSG.ptCache.release(offset);
	}

	_getOffset(parent, bbox, reusepoint) {
		// bbox: the BoundingBox of pasted items.
		const offset = reusepoint || new Point(0, 0);
		const topleft = bbox.getTopLeft(JSG.ptCache.get());
		const itemcenter = bbox.getCenter(JSG.ptCache.get()).add(topleft);

		this._getPasteCenter(offset).subtract(itemcenter);
		JSG.ptCache.release(topleft, itemcenter);
		return offset;
	}

	_getPasteCenter(reusepoint) {
		if (this.viewer === undefined) {
			return undefined;
		}

		const { viewer } = this;
		const selectionProvider = viewer.getSelectionProvider();
		const center = reusepoint || new Point();

		if (selectionProvider.hasSelection()) {
			// get center from selection view:
			// var bbox = viewer.getSelectionView().getBoundingBox(JSG.boxCache.get());
			const bbox = this._getSelectionBox(viewer, JSG.boxCache.get());
			const topleft = bbox.getTopLeft(JSG.ptCache.get());
			bbox.getCenter(center).add(topleft);
			JSG.boxCache.release(bbox);
			JSG.ptCache.release(topleft);
			// need to add an offset?
			if (selectionProvider.hasSingleSelection()) {
				if (
					selectionProvider.getFirstSelection().getModel() !==
					this.parent
				) {
					center.add(JSG.clipOffset);
				}
			} else {
				center.add(JSG.clipOffset);
			}
		} else {
			const vpBounds = viewer
				.getScrollPanel()
				.getViewPort()
				.getBounds();
			vpBounds.getCenter(center);
			viewer.translateFromParent(center);
		}
		return center;
	}

	_getSelectionBox(viewer, reusebox) {
		const selectionProvider = viewer.getSelectionProvider();
		if (selectionProvider.hasSingleSelection()) {
			let selection = selectionProvider.getFirstSelection().getModel();
			if (
				selection instanceof TextNode &&
				selection.isAssociated()
			) {
				selection = selection.getParent();
				const bbox = selection.getBoundingBox(reusebox);
				GraphUtils.translateBoundingBoxUp(
					bbox,
					selection.getParent(),
					selection.getGraph()
				);
				return bbox;
			}
		}
		return viewer.getSelectionView().getBoundingBox(reusebox);
	}

	/**
	 * Undoing this paste command by removing the previously pasted items.
	 *
	 * @method undo
	 */
	undo() {
		// delete created items
		if (this.items.length === 0) {
			const reader = this._getReader();
			const head = this._getStartNode(reader);
			const graph = this.parent.getGraph();

			reader.iterateObjects(head, (name, child) => {
				switch (name) {
				case 'gi':
				case 'graphitem': {
					const id = Number(reader.getAttribute(child, 'id'));
					if (id !== undefined) {
						const item = graph.getItemById(id);
						if (item !== undefined) {
							this.parent.removeItem(item);
						}
					}
					break;
				}
				default:
					break;
				}
			});
		} else {
			this.items.forEach((item) => {
				this.parent.removeItem(item);
			});
		}
	}

	/**
	 * Redoing the previously undone paste operations.
	 *
	 * @method redo
	 */
	redo() {
		this.items.forEach((item) => {
			this.parent.addItem(item);
		});
	}

	restoreStateAfterUndo(viewer) {
		if (this.oldSelection !== undefined) {
			viewer.getSelectionProvider().setSelection(this.oldSelection);
		}
	}

	restoreStateAfterRedo() {
		this._selectItems(this.items);
	}

	doAfterUndo(selection) {
		if (this.oldSelection !== undefined) {
			this.oldSelection.forEach((sel) => {
				selection.push(sel.getModel());
			});
		}
	}

	doAfterRedo() {
		this._selectItems(this.items);
	}

	_selectItems(items) {
		const pasteIDs = [];
		const newSelection = [];
		const graphController = this.viewer.getGraphController();
		const selectionProvider = this.viewer.getSelectionProvider();

		selectionProvider.clearSelection();

		items.forEach((item) => {
			// if we store parent controller we can use getModelController which traverse only direct children...
			const controller = graphController.getControllerByModelId(
				item.getId()
			);
			if (controller !== undefined) {
				pasteIDs.push(item.getId());
				newSelection.push(controller);
			}
		});
		pasteIDs.type = 'type.jsgpaste';
		selectionProvider.setSelection(newSelection, pasteIDs);
	}
}

module.exports = PasteItemsCommand;
