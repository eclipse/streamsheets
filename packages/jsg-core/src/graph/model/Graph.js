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
const GraphItem = require('./GraphItem');
const BBoxShape = require('./shapes/BBoxShape');
const GraphSettings = require('./settings/GraphSettings');
const ItemAttributes = require('../attr/ItemAttributes');
const TextFormatAttributes = require('../attr/TextFormatAttributes');
const Event = require('./events/Event');
const Edge = require('./Edge');
const Path = require('./Path');
const Layer = require('./Layer');
const Port = require('./Port');
const BoundingBox = require('../../geometry/BoundingBox');
const Rectangle = require('../../geometry/Rectangle');
const Arrays = require('../../commons/Arrays');
const Dictionary = require('../../commons/Dictionary');

/**
 * A graph is the main container for {{#crossLink "GraphItem"}}{{/crossLink}}s.</br>
 * It provides attributes to influence the global behavior.<br/>
 * As of API version 1.6.44 a <code>Graph</code> supports additional {{#crossLink
 * "GraphItem"}}{{/crossLink}}s. Additional items represents <code>GraphItem</code>s which should be
 * added to the <code>Graph</code> but not to its model. Therefore these items are managed separately and, most
 * important, are not saved or load automatically by the
 * <code>Graph</code>. Instead the object which adds these <code>GraphItem</code>s is responsible for that. To add an
 * additional <code>GraphItem</code> use {{#crossLink "Graph/addAddition:method"}}{{/crossLink}}.
 *
 * @class Graph
 * @extends GraphItem
 * @constructor
 */
class Graph extends GraphItem {
	constructor() {
		super(new BBoxShape());
		this._uniqueId = 1;
		this._graphId = 0;
		this._additions = [];
		this._layers = new Dictionary();
		this._settings = new GraphSettings(this);

		this.setItemAttribute(ItemAttributes.SELECTIONMODE, ItemAttributes.SelectionMode.NONE);

		// needed for some calculations. Set from coordinate system before draw operation
		this._zoom = 1;
		this._autoExtent = true;
		// flag whether graph has been changed and needs to be saved
		this._changed = false;
		this._isDirty = false;

		/**
		 * Maximum amount of refresh cycles. Default is <code>3</code>.
		 * @property maxRefreshCycles
		 * @type {Number}
		 * @since 2.2.20
		 */
		this.maxRefreshCycles = 3;
	}

	dispose() {
		super.dispose(this);

		this._additions.forEach((addition) => {
			addition.dispose();
			addition._parent = undefined;
		});
		Arrays.removeAll(this._additions);
		this._settings = undefined;
		// release templates which might be used within "normal" attribute lists...
		JSG.tmplStore.release();
	}

	_setShapeTo(newshape) {
		if (newshape && newshape instanceof BBoxShape) {
			super._setShapeTo(newshape);
		}
	}

	copy(deep, ids) {
		const copy = super.copy(deep, ids);
		copy._settings.setTo(this._settings);
		return copy;
	}

	newInstance() {
		return new Graph();
	}

	_assignName(id) {
		this.setName('graph');
	}

	/**
	 * Returns, if graph has changed.
	 *
	 * @method isChanged
	 * @return {boolean} True, if Graph has changed, otherwise false.
	 */
	isChanged() {
		return this._changed;
	}

	/**
	 * Marks graph as changed.
	 *
	 * @method setChanged
	 * @param {boolean} changed Specify <code>true</code>, if Graph has changed, otherwise false.
	 */
	setChanged(changed) {
		this._changed = changed;
	}

	setZoom(factor) {
		this._zoom = factor;
	}

	getZoom() {
		return this._zoom;
	}

	getPortFindRadius() {
		return this.getScaledZoomed(JSG.portFindRadius);
	}

	getFindRadius() {
		return this.getScaledZoomed(JSG.findRadius);
	}

	getSnapRadius() {
		return this.getScaledZoomed(JSG.snapRadius);
	}

	getCreateThreshhold() {
		return this.getScaledZoomed(JSG.createThreshhold);
	}

	/**
	 * Applies current scale and zoom settings to given value.
	 * @method getScaledZoomed
	 * @param {Number} value A value to apply current zoom and scale to
	 * @return {Number} The scaled and zoomed value.
	 * @since 2.0.20.4
	 */
	getScaledZoomed(value) {
		return this.getScaled(value) / this._zoom;
	}

	/**
	 * Applies current scale to given value.
	 * @method getScaled
	 * @param {Number} value A value to apply current scale to
	 * @return {Number} The scaled value.
	 * @since 2.0.20.5
	 */
	getScaled(value) {
		return value;
	}

	/**
	 * Marks this graph as dirty, i.e its contained models should refresh.
	 *
	 * @method markDirty
	 */
	markDirty() {
		this._isDirty = true;
	}

	/**
	 * Checks, if document is dirty due to a change.
	 *
	 * @method isDirty
	 * @return {Boolean} True, if dirty, otherwise false.
	 * @since 1.6.0
	 */
	isDirty() {
		return this._isDirty;
	}

	isRefreshNeeded() {
		return true;
	}

	/**
	 * Refreshes complete graph model until it is no longer marked as dirty or maximum refresh cycle is reached.</br>
	 * Adjust {{#crossLink "Graph/maxRefreshCycles:property"}}{{/crossLink}} to change maximum refresh
	 * cycle.
	 *
	 * @method _refreshAll
	 * @param {Boolean} [force] If set to <code>true</code> the graph model is refreshed at least once.
	 * @param {Number} cycle Current refresh cycle.
	 * @return {Boolean} <code>true</code> if model was refreshed or <code>false</code> if not.
	 * @private
	 * @since 2.2.20
	 */
	_refreshAll(force, cycle) {
		const refresh = this._isDirty === true || force === true;
		if (refresh) {
			this._isDirty = false;
			super._doRefresh(force);
			// still dirty? => refresh again...
			if (this._isDirty && cycle < this.maxRefreshCycles) {
				this._refreshAll(force, cycle + 1);
			}
		}
		return refresh;
	}

	_doRefresh(force) {
		const now = Date.now();
		// console.log('refresh');

		if (this._refreshAll(force, 1)) {
			// console.log("in");
			this.__timeRefresh = undefined;
			this.getSettings().refresh();
			this.layoutAll();
			this.updateExtent();
			const event = new Event(Event.GRAPH, this);
			event.detailId = Graph.AttributeID.REFRESH;
			event.source = this;
			this.sendPostEvent(event);
			this.setRefreshNeeded(false);
		}

		if (this.__timeRefresh === undefined) {
			this.__timeRefresh = Date.now() - now;
		}
	}

	// overwritten to call our BridgeBuilder if it exists...
	layoutAll() {
		super.layoutAll();

		// layout additions:
		if (this._additions.length) {
			this._additions.forEach((addition) => {
				addition.layoutAll();
			});
		}
	}

	/**
	 * Returns the layer for given tag.</br>
	 * If no layer is known for given name, a new one will be created and registered.
	 *
	 * @method getLayer
	 * @param {String} name A unique layer name.
	 * @return {Layer} The layer registered for given name.
	 */
	getLayer(name) {
		let layer = this._layers.get(name);
		if (layer === undefined && name !== undefined) {
			layer = this._layers.put(name, new Layer(name));
		}

		return layer;
	}

	/**
	 * Remove a layer.</br>
	 *
	 * @method removeLayer
	 * @param {String} name A unique layer name.
	 * @since 3.0
	 */
	removeLayer(name) {
		this._layers.remove(name);
	}

	/**
	 * Checks, if a layer exists.</br>
	 *
	 * @method hasLayer
	 * @param {String} name A unique layer name.
	 * @return {boolean} True, if layer exists, otherwise false.
	 */
	hasLayer(name) {
		const layer = this._layers.get(name);

		return layer !== undefined;
	}

	getSettings() {
		return this._settings;
	}

	setSettings(settings) {
		if (settings !== undefined) {
			this._settings.deregister(this);
			this._settings = settings;
			this._settings.register(this);
		}
	}

	saveContent(file, absolute) {
		file.writeAttributeString('type', 'graph');
		file.writeAttributeString('uniqueid', this._uniqueId);

		this._settings.save(file);

		file.writeStartElement('layers');
		file.writeStartArray('layer');

		const layerArray = this._layers.elements();

		layerArray.forEach((layer) => {
			layer.save(file);
		});

		file.writeEndArray('layer');
		file.writeEndElement();

		super.saveContent(file, absolute);

		this._changed = false;
	}

	// overwritten to support async read:
	read(reader, object, opts) {
		super.read(reader, object, opts);
		if (!opts || !opts.async) {
			this._postRead(reader, object);
		}
	}

	_postRead(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'layer': {
					const layer = new Layer(reader.getAttribute(child, 'name'));
					layer.read(reader, child);
					this._layers.put(layer.name, layer);
					break;
				}
				case 'settings':
					this._settings.read(reader, child);
					break;
				default:
					break;
			}
		});

		// restore unique id
		const id = reader.getAttribute(object, 'uniqueid');
		if (id !== undefined) {
			this._uniqueId = Number(id);
		}
		// read old settings attributes?
		// var grid = reader.getAttribute(object, "grid");
		// if (grid !== undefined) {
		//     this._settings.read(reader, object);
		// }

		this._restoreConnections(this);
		this.invalidateTerms();
		this.evaluate();
		this.refresh();

		this._changed = false;
	}

	createPath() {
		// currently a graph has no id, so we simply return a fresh Path without an id...
		return new Path();
	}

	/**
	 * Convenience method to find an arbitrary port by its id.</br>
	 * This will run through all {{#crossLink "Node"}}{{/crossLink}}s within this
	 * graph.
	 *
	 * @method getPortById
	 * @param {Number} id The id of the port to look for.
	 * @return {Port} The corresponding port or <code>undefined</code> if none could be found.
	 */
	getPortById(id) {
		const item = this.getItemById(id);
		return item && item instanceof Port ? item : undefined;
	}

	getItemById(id) {
		let i;
		let n;
		let item;

		for (i = 0, n = this._subItems.length; i < n; i += 1) {
			item = this._subItems[i].getItemById(id);
			if (item !== undefined) {
				return item;
			}
		}

		return undefined;
	}

	getItemByName(name) {
		let i;
		let n;
		let item;

		for (i = 0, n = this._subItems.length; i < n; i += 1) {
			item = this._subItems[i].getItemByName(name);
			if (item !== undefined) {
				return item;
			}
		}

		return undefined;
	}

	/**
	 * Calculates the BoundingBox of all subitems, i.e. the resulting BoundingBox encloses all subitems.
	 *
	 * @method getSubItemsBoundingBox
	 * @param {BoundingBox} [reusebbox] The BoundingBox to reuse for calculation. If none is provided a
	 *     new one will be created.
	 * @return {BoundingBox} A BoundingBox which covers all subitems.
	 */
	getSubItemsBoundingBox(reusebbox) {
		const allBox = reusebbox !== undefined ? reusebbox : new BoundingBox(0, 0);

		if (this._subItems.length > 0) {
			const tmpbbox = JSG.boxCache.get();
			let i;
			let n;
			allBox.setTo(this._subItems[0].getBoundingBox(tmpbbox));
			for (i = 1, n = this._subItems.length; i < n; i += 1) {
				allBox.union(this._subItems[i].getBoundingBox(tmpbbox));
			}
			JSG.boxCache.release(tmpbbox);
		} else {
			allBox.reset();
		}
		return allBox;
	}

	translateFromParent(point) {
		// do nothing intentionally
		return point;
	}

	translateToParent(point) {
		// do nothing intentionally
		return point;
	}

	/**
	 * Set to define, whether graph automatically updates the graph extent, i.e. updates the {{#crossLink
	 * "BoundingBox"}}{{/crossLink}} of this graph to cover all items.
	 *
	 * @method setAutoExtent
	 * @param {boolean} flag True, if graph should automatically derive its size from the contained items.
	 * @since 2.0.0
	 */
	setAutoExtent(flag) {
		this._autoExtent = flag;
	}

	/**
	 * Returns, whether graph automatically updates the graph extent, i.e. updates the {{#crossLink
	 * "BoundingBox"}}{{/crossLink}} of this graph to cover all items.
	 *
	 * @method getAutoExtent
	 * @return {boolean} True, if graph should automatically derive its size from the contained items.
	 * @since 2.0.0
	 */
	getAutoExtent() {
		return this._autoExtent;
	}

	/**
	 * Updates the graph extent, i.e. updates the {{#crossLink "BoundingBox"}}{{/crossLink}}
	 * of this graph to cover all items.
	 *
	 * @method updateExtent
	 */
	updateExtent() {
		if (this._reading || JSG.idUpdater.isActive) {
			// to avoid unnecessary recalculations
			return;
		}
		if (this._autoExtent) {
			const totalbox = JSG.boxCache.get();
			const totalrect = JSG.rectCache.get();
			this.getTotalBoundingRect(undefined, totalrect);
			this.setBoundingBoxTo(totalrect.toBoundingBox(totalbox));
			JSG.boxCache.release(totalbox);
			JSG.rectCache.release(totalrect);
		}
	}

	getTotalBoundingRect(target, reuserect) {
		const totalrect = reuserect || new Rectangle(0, 0, 0, 0);
		const tmprect = JSG.rectCache.get();

		this._subItems.forEach((subItem) => {
			const subrect = subItem.getTotalBoundingRect(this, tmprect);
			totalrect.union(subrect);
		});
		JSG.rectCache.release(tmprect);
		return totalrect;
	}

	/**
	 * Returns the surrounding rectangle, which is used by contained GraphItems
	 *
	 * @method getUsedRect
	 * @param {Rectangle} [reuserect] An optional rectangle to reuse.
	 * @return {Rectangle} Used rect.
	 */
	getUsedRect(reuserect) {
		const targetRect = reuserect || new Rectangle(0, 0, 0, 0);
		if (this.getItemCount()) {
			const box = JSG.boxCache.get();
			this.getItemAt(0)
				.getTranslatedBoundingBox(this, box)
				.getBoundingRectangle(targetRect);
			JSG.boxCache.release(box);
		}
		return this.getTotalBoundingRect(undefined, targetRect);
	}

	/**
	 * Returns the graph identifier.
	 *
	 * @method getGraphId
	 * @return {Number} The graph identifier
	 */
	getGraphId() {
		return this._graphId;
	}

	/**
	 * Sets the graph id.</br>
	 * <b>Note:</b> use with care. Usually it is not required to set or change the graph id manually.
	 *
	 * @method setGraphId
	 * @param {Number} id The new graph id.
	 */
	setGraphId(id) {
		this._graphId = id;
	}

	getGraph() {
		return this;
	}

	// overwritten to simply return corresponding template because a graph has no TextFormat...
	getTextFormat() {
		const template = JSG.tmplStore.getTemplate(TextFormatAttributes.Template_ID);
		return template || super.getTextFormat();
	}

	// overwritten since label placement is not useful for a graph...
	updateLabelPositions() {}

	/**
	 * Adds given <code>GraphItem</code> as an addition to this graph.<br/>
	 * Additions are not part of the graph model and therefore managed separately. However, they do get an id assigned
	 * and its parent is set to this <code>Graph</code> instance. <br/>
	 * <b>Note:</b> Additions are not automatically saved. Instead the adding object is responsible for saving and
	 * loading its required additions.
	 * @method addAddition
	 * @param {GraphItem} item The <code>GraphItem</code> to add.
	 * @return {GraphItem} The added <code>GraphItem</code> as convenience.
	 * @since 1.6.44
	 */
	addAddition(item) {
		// TODO support events?
		let addedItem;
		const oldparent = item.getParent();
		if (oldparent !== this) {
			const event = new Event(Event.ADDITIONADD, item);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				addedItem = item;
				if (oldparent) {
					oldparent.removeAddition(addedItem);
				}
				this._additions.push(addedItem);
				// TODO this is WRONG!!! Graph is not the parent of an addition!!!
				addedItem._parent = this;
				// force creation of new id
				addedItem._assignId(true);
				if (!this._reading && !JSG.idUpdater.isActive) {
					addedItem.evaluate();
					addedItem.refresh();
				}
				this.sendPostEvent(event);
			}
		}
		return addedItem;
	}

	/**
	 * Removes the given addition.
	 * @method removeAddition
	 * @param {GraphItem} item The <code>GraphItem</code> to remove from the list of all additions.
	 * @return {Boolean} Returns <code>true</code> if given <code>GraphItem</code> was removed, <code>false</code>
	 *     otherwise.
	 * @since 1.6.44
	 */
	removeAddition(item) {
		let doRemove = item && item.getParent() === this;
		if (doRemove) {
			const event = new Event(Event.ADDITIONREMOVE, item);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				doRemove = Arrays.remove(this._additions, item);
				if (doRemove) {
					item._parent = undefined;
				}
				this.sendPostEvent(event);
			}
		}
		return doRemove;
	}

	/**
	 * Removes all currently added additions.
	 * @method removeAllAdditions
	 * @return {Boolean} flag which indicates that at least one addition was removed.
	 * @since 1.6.44
	 */
	removeAllAdditions() {
		const doRemove = this._additions.length > 0;
		if (doRemove) {
			const event = new Event(Event.ADDITIONREMOVEALL);
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._additions.forEach((addition) => {
					addition._parent = undefined;
				});
				Arrays.removeAll(this._additions);
				this.sendPostEvent(event);
			}
		}
		return doRemove;
	}

	/**
	 * Returns direct access to internally usded addition array.<br/>
	 * <b>Note:</b> the returned array should not be modified directly! Use provided {{#crossLink
	 * "Graph/addAddition:method"}}{{/crossLink}} and {{#crossLink
	 * "Graph/removeAddition"}}{{/crossLink}} instead.
	 * @method getAdditions
	 * @return {Array} A list containing all currently registered additions.
	 * @since 1.6.44
	 */
	getAdditions() {
		return this._additions;
	}

	getUniqueName(base, id) {
		return `${base}${id}`;
	}

	resolveCustomReference(item) {}

	/**
	 * ID definitions used within event handling. Each id is of type <code>String</code> and used as
	 * the detailId field of {{#crossLink "Event"}}{{/crossLink}}.
	 *
	 * @property AttributeID
	 * @type Object
	 * @static
	 */
	static get AttributeID() {
		return {
			/**
			 * @property REFRESH
			 * @type String
			 * @static
			 */
			REFRESH: 'refresh'
		};
	}
}

module.exports = Graph;
