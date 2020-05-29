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
const Strings = require('../../commons/Strings');
const Arrays = require('../../commons/Arrays');
const Numbers = require('../../commons/Numbers');
const Model = require('./Model');
const Pin = require('../Pin');
const Size = require('../Size');
const GraphUtils = require('../GraphUtils');
const ReshapeCoordinate = require('../ReshapeCoordinate');
const Path = require('./Path');
const NumberExpression = require('../expr/NumberExpression');
const StringExpression = require('../expr/StringExpression');
const Shape = require('./shapes/Shape');
const ShapeFactory = require('./shapes/ShapeFactory');
const BezierShape = require('./shapes/BezierShape');
const FormatAttributes = require('../attr/FormatAttributes');
const ItemAttributes = require('../attr/ItemAttributes');
const LayoutAttributes = require('../attr/LayoutAttributes');
const MathUtils = require('../../geometry/MathUtils');
const Point = require('../../geometry/Point');
const BoundingBox = require('../../geometry/BoundingBox');
const TextFormatAttributes = require('../attr/TextFormatAttributes');
const Attribute = require('../attr/Attribute');
const StringAttribute = require('../attr/StringAttribute');
const AttributeList = require('../attr/AttributeList');
const AttributeExpression = require('../expr/AttributeExpression');
const AttributeChangeEvent = require('./events/AttributeChangeEvent');
const Event = require('./events/Event');
const GraphItemProperties = require('../properties/GraphItemProperties');
const Properties = require('../properties/Properties');

const _tmpEvent = new Event(Event.ALL);

/**
 * A GraphItem defines the aspects common to all graph objects such as
 * {{#crossLink "Node"}}{{/crossLink}}s, {{#crossLink "Edge"}}{{/crossLink}}s
 * and the {{#crossLink "Graph"}}{{/crossLink}} itself.</br>
 * Each GraphItem has an id which is unique within its Graph. GraphItems which are not added to a
 * Graph object have an id of -1.
 *
 *
 * @class GraphItem
 * @extends Model
 * @constructor
 * @param {Shape} [shape] Shape to use for the appearance of the object. This can be a e.g. a
 *     rectangle, ellipse or polyline.
 */
class GraphItem extends Model {
	constructor(shape) {
		super();

		this._parent = undefined;
		this._subItems = [];

		this._pin = new Pin(this);
		this._size = new Size();
		this._angle = new NumberExpression(0);
		this._angle.getConstraint().decimals = 10;

		this._bboxcache = new BoundingBox(0, 0);
		this._origincache = new Point(0, 0);
		this._attrCache = {};
		this._collapsedSize = new Size(1000, 1000);
		this._reshapeCoordinates = [];
		this._layout = undefined;

		this.addAttribute(new FormatAttributes());
		this.addAttribute(new ItemAttributes());
		this.addAttribute(new LayoutAttributes());

		this._reshapeProperties = new Properties();

		this._layer = new StringExpression('');
		this._type = new StringExpression('');
		this._name = new StringExpression('');
		this._link = new StringExpression('');
		this._tooltip = new StringExpression('');

		this._shape = undefined;
		this._setShapeTo(shape !== undefined ? shape : new Shape());

		this._friends = [];

		// TODO REMOVE! only used to skip layout() for Feedbacks...
		this._isFeedback = false;

		this._reading = false;
		// TODO we might want to enable/disable refresh (e.g. during loading)!! => think about a good mechanism for
		// this...
		this._refreshEnabled = true;
		// set this to false to omit unnecessary drawing for container items that are completely covered by subitems
		this._drawEnabled = true;

		// this._isStale = false;
	}

	newInstance() {
		return new GraphItem();
	}

	isA() {
		return 'GraphItem';
	}

	/**
	 * Overwritten from {{#crossLink "Model"}}{{/crossLink}} and extended with a <code>deep</code>
	 * parameter.</br>
	 * <b>Note:</b> {{#crossLink "GraphItem/layout:method"}}{{/crossLink}} on returned copy and after
	 * adding it to graph.
	 *
	 * @method copy
	 * @param {Boolean} [deep=true] Set to <code>true</code> to copy inner structure too, which is the default.
	 * @param {Boolean} [ids=false] Set to <code>true</code> if the model id should be copied too. If false item will
	 *     have an undefined id.
	 * @return {GraphItem} A copy of this graph item.
	 */
	copy(deep, ids) {
		deep = deep !== undefined ? deep : true;
		ids = ids !== undefined ? ids : false;

		return this._copy([], deep, ids);
	}

	/**
	 * Actually performs the copy.
	 *
	 * @method _copy
	 * @param {Array} copiednodes List of inner nodes used to restore connections.
	 * @param {Boolean} deep Flag to indicate if inner structure should be copied too.
	 * @param {Boolean} ids Flag to indicate whether the model id should be copied too. If false item will have an
	 *     undefined id.
	 * @return {GraphItem} A copy of this graph item.
	 * @private
	 */
	_copy(copiednodes, deep, ids) {
		const findCopiedNodeById = (id, cpnodes) => {
			let node;
			let i;

			for (i = 0; i < cpnodes.length; i += 1) {
				if (cpnodes[i].id === id) {
					node = cpnodes[i].copy;
					break;
				}
			}
			return node;
		};

		const restoreConnections = (copiededges, cpnodes) => {
			let node;

			copiededges.forEach((cpEdge) => {
				if (cpEdge.sourceNodeId !== undefined) {
					// connect source:
					node = findCopiedNodeById(cpEdge.sourceNodeId, cpnodes);
					if (node !== undefined) {
						cpEdge.copy.setSourcePort(node.getPortAt(cpEdge.sourcePortIndex));
					}
				}
				if (cpEdge.targetNodeId !== undefined) {
					// connect target
					node = findCopiedNodeById(cpEdge.targetNodeId, cpnodes);
					if (node !== undefined) {
						cpEdge.copy.setTargetPort(node.getPortAt(cpEdge.targetPortIndex));
					}
				}
			});
		};

		const copy = super.copy(deep, ids);

		// pin, bounds, formats, attributes, properties and shape:
		this._copyPropertiesAndShape(copy);

		if (deep === true) {
			// inner structure:
			const _copiededges = [];
			const _copiednodes = [];
			this._copyStructure(copy, _copiednodes, _copiededges, deep, ids);
			restoreConnections(_copiededges, _copiednodes);

			if (_copiednodes.length > 0) {
				Arrays.insertAt(copiednodes, copiednodes.length, _copiednodes);
			}
		}

		copy.refresh();

		return copy;
	}

	/**
	 * Sets formats, attributes and shape of this item to provided copy object.
	 *
	 * @method _copyPropertiesAndShape
	 * @param {GraphItem} copy The copied item.
	 * @private
	 */
	_copyPropertiesAndShape(copy) {
		copy._pin.setTo(this._pin);
		copy._angle.setTo(this._angle);
		copy._size = this._size.copy();
		copy._collapsedSize = this._collapsedSize.copy();

		copy.setReshapeProperties(this._reshapeProperties);
		copy._layer = this._layer.copy();
		copy._type = this._type.copy();
		copy._name = this._name.copy();
		copy._link = this._link.copy();
		copy._tooltip = this._tooltip.copy();

		this._friends.forEach((friend) => {
			copy._friends.push(friend.copy());
		});

		copy.setReshapeCoordinates(this._reshapeCoordinates);

		if (this._shape) {
			copy.setShapeTo(this._shape.copy());
		}

		if (this._layout) {
			copy._layout = undefined;
			copy.setLayout(this._layout.getType());
			// apply settings:
			const settings = copy.getLayoutSettings();
			if (settings && settings.addAll) {
				settings.addAll(this.getLayoutSettings());
			}
		}
	}

	/**
	 * Copies inner structure.
	 *
	 * @method _copyStructure
	 * @param {GraphItem} copy The copied item.
	 * @param {Array} copiednodes List of inner nodes used to restore connections.
	 * @param {Array} copiededges List of inner copied edges to restore.
	 * @param {Boolean} deep Flag to indicate if inner structure should be copied.
	 * @private
	 */
	_copyStructure(copy, copiednodes, copiededges, deep, ids) {
		const edgeCopyMetaData = (edge, cp) => {
			const srcNodeId = edge.sourceNode !== undefined ? edge.sourceNode.getId() : undefined;
			const srcPortIndex =
				srcNodeId !== undefined ? edge.sourceNode.getPortIndex(edge.getSourcePort()) : undefined;
			const trgtNodeId = edge.targetNode !== undefined ? edge.targetNode.getId() : undefined;
			const trgtNodeIndex =
				trgtNodeId !== undefined ? edge.targetNode.getPortIndex(edge.getTargetPort()) : undefined;
			return {
				copy: cp,
				sourceNodeId: srcNodeId,
				sourcePortIndex: srcPortIndex,
				targetNodeId: trgtNodeId,
				targetPortIndex: trgtNodeIndex
			};
		};

		/* eslint-disable arrow-body-style */
		const nodeCopyMetaData = (node, cp) => {
			return {
				id: node.getId(),
				copy: cp
			};
		};
		/* eslint-enable arrow-body-style */

		const subitems = this._subItems;

		copy._subItems = [];

		subitems.forEach((subitem) => {
			const cp = subitem._copy(copiednodes, deep, ids);
			cp._parent = copy;
			copy._subItems.push(cp);
			if (subitem.isEdge && subitem.isEdge()) {
				copiededges.push(edgeCopyMetaData(subitem, cp));
			} else {
				copiednodes.push(nodeCopyMetaData(subitem, cp));
			}
		});
	}

	/**
	 * Creates a path for this graph item. </br>
	 * An optional parent parameter can be given to specify the start point of created path.
	 * By default the {{#crossLink "Graph"}}{{/crossLink}} is taken.</br>
	 * This method returns <code>undefined</code> if it is called on GraphItems which are not yet added
	 * to a Graph.
	 *
	 * @method createPath
	 * @param {GraphItem} [fromParent] The parent from which the path should be created.
	 * @return {Path} The Path of this GraphItem or <code>undefined</code> if it is not
	 * added yet.
	 */
	createPath(fromParent) {
		const id = this.getId();
		let path;

		if (id !== undefined) {
			path = this !== fromParent && this._parent !== undefined ? this._parent.createPath(fromParent) : new Path();
			// note, path can be undefined if parent was not added yet!!
			if (path) {
				path.addId(id);
			}
		}
		return path;
	}

	isDrawEnabled() {
		return this._drawEnabled;
	}

	/**
	 * Returns the reshape {{#crossLink "Properties"}}{{/crossLink}} currently used by this item.
	 *
	 * @method getReshapeProperties
	 * @return { Properties} The reshape properties.
	 */
	getReshapeProperties() {
		return this._reshapeProperties;
	}

	/**
	 * Sets new reshape properties to use. Note that given properties are copied before they are added!
	 *
	 * @method setReshapeProperties
	 * @param {Properties} newProperties The new reshape properties to use.
	 */
	setReshapeProperties(newProperties) {
		this._reshapeProperties.clear();
		// we clear properties even if undefined was passed...
		if (newProperties !== undefined) {
			this._reshapeProperties = newProperties.copy();
		}
	}

	/**
	 * Checks if this GraphItem has any reshape coordinates defined.
	 *
	 * @method hasReshapeCoordinates
	 * @return {Boolean} <code>true</code> if this GraphItem has reshape coordinates, <code>false</code> otherwise.
	 */
	hasReshapeCoordinates() {
		return this._reshapeCoordinates !== undefined && this._reshapeCoordinates.length > 0;
	}

	/**
	 * Returns direct access to inner used {{#crossLink "ReshapeCoordinate"}}{{/crossLink}}s.
	 *
	 * @method getReshapeCoordinates
	 * @return {Array} The list of inner reshape coordinates
	 */
	getReshapeCoordinates() {
		return this._reshapeCoordinates;
	}

	/**
	 * Returns the {{#crossLink "ReshapeCoordinate"}}{{/crossLink}} at specified index or
	 * <code>undefined</code> if index is out of range.
	 *
	 * @method getReshapeCoordinateAt
	 * @param {Number} index The index of the reshape coordinate to get.
	 * @return {ReshapeCoordinate} The reshape coordinate at given index or <code>undefined</code>.
	 */
	getReshapeCoordinateAt(index) {
		return index >= 0 && index < this._reshapeCoordinates.length ? this._reshapeCoordinates[index] : undefined;
	}

	/**
	 * Sets the new reshape coordinates to use. Note that the coordinates are copied before they are added.</br>
	 * See {{#crossLink "ReshapeCoordinate"}}{{/crossLink}}.
	 *
	 * @method setReshapeCoordinates
	 * @param {Array} newCoordinates A list of new reshape coordinates.
	 */
	setReshapeCoordinates(newCoordinates) {
		this._reshapeCoordinates = [];
		if (newCoordinates !== undefined) {
			newCoordinates.forEach((coordinate) => {
				this._reshapeCoordinates.push(coordinate.copy());
			});
		}
	}

	/**
	 * Sets the {{#crossLink "ReshapeCoordinate"}}{{/crossLink}} at specified index to given
	 * {{#crossLink "Point"}}{{/crossLink}} or x, y values. If index it of range calling
	 * this method has no effect.</br>
	 * <b>Note:</b> this method should either be called with a point as second parameter or with x
	 * and y values are second and third parameters!
	 *
	 * @method setReshapeCoordinateAt
	 * @param {Number} index The index of the reshape coordinate to set.
	 * @param {Point} [point] A point to set coordinates x and y values.
	 * @param {Number|Expression} [x] The coordinates x value.
	 * @param {Number|Expression} [y] The coordinates y value.
	 */
	setReshapeCoordinateAt(index, ...args) {
		if (index >= 0 && index < this._reshapeCoordinates.length) {
			let xVal;
			let yVal;
			const coordinate = this._reshapeCoordinates[index];

			if (args.length === 1) {
				xVal = args[0].x;
				yVal = args[0].y;
			} else if (args.length > 1) {
				xVal = args[0] !== undefined ? args[0] : coordinate.getX();
				yVal = args[1] !== undefined ? args[1] : coordinate.getY();
			}
			if (!coordinate.isEqualTo(xVal, yVal)) {
				const event = new Event(Event.RESHAPE);
				event.xValue = xVal;
				event.yValue = yVal;
				event.index = index;
				event.source = this;
				this.sendPreEvent(event);
				if (event.doIt === true) {
					coordinate.set(xVal, yVal);
					this.sendPostEvent(event);
				}
			}
		}
	}

	/**
	 * Returns the pin of this graph item.
	 *
	 * @method getPin
	 * @return {Pin} The items pin.
	 */
	getPin() {
		return this._pin;
	}

	/**
	 * Returns the link expression of this graph item.</br>
	 * A link can be any arbitrary text or expression. If a model with a link is selected its get
	 * executed via {{#crossLink "InteractionHandler/executeLink:method"}}{{/crossLink}}.
	 *
	 * @method getLink
	 * @return {StringExpression} The expression link.
	 */
	getLink() {
		const link = JSG.graphItemFactory.getLink(this.getType().getValue());
		if (link !== undefined) {
			return link;
		}

		return this._link;
	}

	/**
	 * Sets the link of this item.</br>
	 * A link can be any arbitrary text or expression. If a model with a link is selected its get
	 * executed via {{#crossLink "InteractionHandler/executeLink:method"}}{{/crossLink}}.
	 *
	 * @method setLink
	 * @param {StringExpression|Object} link The new link value.
	 */
	setLink(link) {
		this._link.setExpressionOrValue(link);
	}

	/**
	 * Returns the tooltip expression of this graph item.</br>
	 * A tooltip can be any arbitrary text or expression. .
	 *
	 * @method getTooltip
	 * @return {StringExpression} The tooltip expression.
	 * @since 1.6.0
	 */
	getTooltip() {
		return this._tooltip;
	}

	/**
	 * Sets the tooltip of this item.</br>
	 * A tooltip can be any arbitrary text or expression.
	 *
	 * @method setTooltip
	 * @param {StringExpression|String} tooltip The new tooltip value.
	 * @since 1.6.0
	 */
	setTooltip(tooltip) {
		this._tooltip.setExpressionOrValue(tooltip);
	}

	/**
	 * Convenience method to get value of the clip children attribute.
	 *
	 * @method isClipChildren
	 * @return {Boolean} <code>true</code> if children should be clipped, <code>false</code> otherwise.
	 */
	isClipChildren() {
		return this.getItemAttribute(ItemAttributes.CLIPCHILDREN).getValue();
	}

	/**
	 * Convenience method to get value of the closed attribute.
	 *
	 * @method isClosed
	 * @return {Boolean} <code>true</code> if shape should be closed, <code>false</code> otherwise.
	 */
	isClosed() {
		return this.getItemAttribute(ItemAttributes.CLOSED).getValue();
	}

	/**
	 * Convenience method to get value of the collapsable attribute.
	 *
	 * @method isCollapsable
	 * @return {Boolean} <code>true</code> if item is collapsable, <code>false</code> otherwise.
	 */
	isCollapsable() {
		if (this._attrCache.collapsable !== undefined) {
			return this._attrCache.collapsable;
		}

		return this.getItemAttribute(ItemAttributes.COLLAPSABLE).getValue();
	}

	/**
	 * Convenience method to get value of the isCollapsed attribute.
	 *
	 * @method isCollapsed
	 * @return {Boolean} <code>true</code> if item is collapsed, <code>false</code> otherwise.
	 */
	isCollapsed() {
		if (this._attrCache.collapsed !== undefined) {
			return this._attrCache.collapsed;
		}

		return this.getItemAttribute(ItemAttributes.COLLAPSED).getValue();
	}

	/**
	 * Checks if any item parent is currently collapsed.
	 *
	 * @method isAnyParentCollapsed
	 * @return {Boolean} <code>true</code> if item has a collapsed parent, <code>false</code> otherwise.
	 */
	isAnyParentCollapsed() {
		let parent = this.getParent();
		while (parent !== undefined) {
			if (parent && parent.isCollapsed()) {
				return true;
			}
			parent = parent.getParent();
		}
		return false;
	}

	/**
	 * Convenience method to get value of the container attribute.
	 *
	 * @method isContainer
	 * @return {Boolean} <code>true</code> if item is a container, <code>false</code> otherwise.
	 */
	isContainer() {
		return this.getItemAttribute(ItemAttributes.CONTAINER).getValue();
	}

	/**
	 * Convenience method to get value of the deleteable attribute.
	 *
	 * @method isDeleteable
	 * @return {Boolean} <code>true</code> if item is deleteable, <code>false</code> otherwise.
	 */
	isDeleteable() {
		return this.getItemAttributes()
			.getDeleteable()
			.getValue();
	}

	/**
	 * Convenience method to get value of the moveable attribute.
	 *
	 * @method isMoveable
	 * @return {Boolean} <code>true</code> if item is moveable, <code>false</code> otherwise.
	 */
	isMoveable() {
		if (this.isProtected()) {
			return false;
		}
		return !!this.getItemAttributes()
			.getMoveable()
			.getValue();
	}

	/**
	 * Convenience method to get value of the selectable attribute.</br>
	 * Note: this method takes the current layer settings into account.</br>
	 * See {{#crossLink "Layer"}}{{/crossLink}} too.
	 *
	 *
	 * @method isSelectable
	 * @return {Boolean} <code>true</code> if item is selectable, <code>false</code> otherwise.
	 */
	isSelectable() {
		if (this._attrCache.selectable !== undefined) {
			return this._attrCache.selectable;
		}

		if (!this.isVisible()) {
			// invisible items can not be selected
			return false;
		}

		const selmode = this.getItemAttributes()
			.getSelectionMode()
			.getValue();
		const selectable = selmode > 0;

		if (this._layer.getValue() !== '') {
			let layerSelectable = false;
			this.iterateLayers((name, layer) => {
				if (layer === undefined || layer.selectable) {
					layerSelectable = true;
				}
			});
			if (layerSelectable === false) {
				return false;
			}
		}

		return selectable;
	}

	getTransparencyFromLayer() {
		if (this._layer.getValue() === '') {
			return 100;
		}
		let transparency = 100;

		this.iterateLayers((name, layer) => {
			if (layer) {
				transparency = Math.min(layer.transparency, transparency);
			}
		});

		return transparency;
	}

	/**
	 * Convenience method to get value of the selectParentFirst attribute.
	 *
	 * @method isSelectParentFirst
	 * @return {Boolean} <code>true</code> if item's selection mode is {{#crossLink
	 *     "ItemAttributes.SelectionMode/SELECTPARENT:property"}}{{/crossLink}}, <code>false</code>
	 *     otherwise.
	 */
	isSelectParentFirst() {
		return (
			this.getItemAttribute(ItemAttributes.SELECTIONMODE).getValue() & ItemAttributes.SelectionMode.SELECTPARENT
		);
	}

	/**
	 * Convenience method to get value of the sizeable attribute.
	 *
	 * @method isSizeable
	 * @return {Boolean} <code>true</code> if item can be resized, <code>false</code> otherwise.
	 */
	isSizeable() {
		return this.getItemAttributes()
			.getSizeable()
			.getValue();
	}

	isProtected() {
		if (this.getProtected && this.getProtected()) {
			return true;
		}
		if (this._parent) {
			if (this._parent.isProtected()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Convenience method to get value of the visible attribute.</br>
	 * Note: this method takes the current layer settings into account and checks also parent items.</br>
	 * See {{#crossLink "Layer"}}{{/crossLink}} too.
	 *
	 * @method isVisible
	 * @return {Boolean} <code>true</code> if item is visible, <code>false</code> otherwise.
	 */
	isVisible() {
		if (this._attrCache.visible !== undefined) {
			return this._attrCache.visible;
		}

		let visible = this.getItemAttribute(ItemAttributes.VISIBLE).getValue();
		if (Numbers.isNumber(visible)) {
			const graph = this.getGraph()
			const node = graph && graph.getItemById(Number(visible));
			if (node && node.getValue) {
				visible = !!node.getValue();
			} else {
				visible = !!visible;
			}
		}

		if (visible) {
			if (this._parent !== undefined && !this._parent.isVisible()) {
				return false;
			}

			if (this._layer.getValue() !== '') {
				let layerVisible = false;
				this.iterateLayers((name, layer) => {
					if (layer === undefined || layer.visible) {
						layerVisible = true;
					}
				});
				if (layerVisible === false) {
					return false;
				}
			}
		}
		return visible;
	}

	/**
	 * Convenience method to get value of the visible attribute.</br>
	 * Note: this method takes the current layer settings into account and checks</br>
	 * See {{#crossLink "Layer"}}{{/crossLink}} too.
	 *
	 * @method isItemVisible
	 * @return {Boolean} <code>true</code> if item is visible, <code>false</code> otherwise.
	 */
	isItemVisible() {
		if (this._attrCache.itemvisible !== undefined) {
			return this._attrCache.itemvisible;
		}

		const visible = this.getItemAttribute(ItemAttributes.VISIBLE).getValue();
		if (visible) {
			if (this._layer.getValue() !== '') {
				const graph = this.getGraph();
				if (graph !== undefined) {
					const layer = graph._layers.get(this._layer.getValue());
					if (layer !== undefined) {
						return layer.visible && visible;
					}
				}
			}
		}
		return visible;
	}

	/**
	 * Convenience method to get value of the rotatable attribute.
	 *
	 * @method isRotatable
	 * @return {Boolean} <code>true</code> if item is rotatable, <code>false</code> otherwise.
	 */
	isRotatable() {
		return this.getItemAttributes()
			.getRotatable()
			.getValue();
	}

	getAttributes() {
		return this._attributes;
	}

	/**
	 * Returns the model Attribute for the specified name or <code>undefined</code> if none could be found.</br>
	 * Note: this method just looks for direct children of inner model AttributeList. To reference a deeper
	 * nested Attribute use <code>getAttributeAtPath</code>.
	 *
	 * @method getAttribute
	 * @param {String} name The name of the Attribute to get.
	 * @return {Attribute} The referenced Attribute or <code>undefined</code>
	 */
	getAttribute(name) {
		return this.getModelAttributes().getAttribute(name);
	}

	/**
	 * Returns the ItemAttributes of this graph item.</br>
	 * <b>Note:</b> to trigger an event when setting new attribute values it is required to pass this
	 * GraphItem as additional parameter. Please refer to {{#crossLink "ItemAttributes"}}{{/crossLink}}.
	 *
	 * @method getItemAttributes
	 * @return {ItemAttributes} The graph item's attributes.
	 */
	getItemAttributes() {
		if (this._attrCache.itemAttributes !== undefined) {
			return this._attrCache.itemAttributes;
		}

		return this.getModelAttributes().getAttribute(ItemAttributes.NAME);
	}

	/**
	 * Convenience method to directly receive an ItemAttributes by its name.
	 *
	 * @method getItemAttribute
	 * @param {String} name The name of the attribute to get.
	 * @return {Attribute} The corresponding Attribute object or <code>undefined</code>
	 * if none exists.
	 */
	getItemAttribute(name) {
		return this.getItemAttributes().getAttribute(name);
	}

	/**
	 * Convenience method to directly set an ItemAttributes value.</br>
	 * <b>Note:</b> this method will trigger an event.
	 *
	 * @method setItemAttribute
	 * @param {String} name The name of the attribute to set the value of.
	 * @param {Expression | Object} value The new value or Expression for this Attribute.
	 * return {Boolean} <code>true</code> if Attribute value was set, <code>false</code> otherwise.
	 */
	setItemAttribute(name, value) {
		return this.setAttribute(this.getItemAttribute(name), value);
	}

	/**
	 * Returns the layout attributes of this graph item.
	 *
	 * @method getLayoutAttributes
	 * @return {LayoutAttributes} The graph item's layout attributes.
	 */
	getLayoutAttributes() {
		return this.getModelAttributes().getAttribute(LayoutAttributes.NAME);
	}

	/**
	 * Replaces the currently used layout attributes with given one.
	 *
	 * @method setLayoutAttributes
	 * @param {LayoutAttributes} layoutattr The new layout attributes to use.
	 */
	setLayoutAttributes(layoutattr) {
		this.addAttribute(layoutattr);
	}

	/**
	 * Returns a custom reference. A custom reference can be provided to identify custom expressions in formulas.
	 *
	 * @method getCustomReference
	 * @param {String} property Property to provide Reference for.
	 * @return {Reference} A valid reference.
	 */
	getCustomReference(property) {
		return this.getGraph() ? this.getGraph().resolveCustomReference(this, property) : undefined;
	}

	/**
	 * Returns a list of graph items which are defined as friends to this item.</br>
	 * Calling this method has the same effect as calling <code>JSG.graphItemFactory.getFriends(this);</code>
	 * So the actual friends definition is defined within JSG.graphItemFactory.</br>
	 * See {{#crossLink "GraphItemFactory"}}{{/crossLink}} too.
	 *
	 * @method getFriends
	 * @return {Array} A list of graph items representing current friends.
	 * @deprecated
	 */
	getFriends() {
		const friends = JSG.graphItemFactory.getFriends(this);
		if (friends !== undefined) {
			return friends;
		}

		return this._friends;
	}

	/**
	 * Sets the item's pin to given coordinate.</br>
	 * Calling this method will actually move this item. The new pin location defined by given coordinate
	 * will be interpreted as relative to items parent.
	 *
	 * @method setPinCoordinateTo
	 * @param {Coordinate} coordinate The new pin location.
	 */
	setPinCoordinateTo(coordinate) {
		this._pin.setCoordinateTo(coordinate);
	}

	/**
	 * Sets the item's pin to given point.</br>
	 * Calling this method will actually move this item. The new pin location defined by given point
	 * will be interpreted as relative to items parent.
	 *
	 * @method setPinCoordinateTo
	 * @param {Point} point The new pin location.
	 */
	setPinPointTo(point) {
		this.setPinPoint(point.x, point.y);
	}

	/**
	 * Sets the item's pin to given x, y values.</br>
	 * Calling this method will actually move this item. The new pin location defined by given x and y
	 * values will be interpreted as relative to items parent.
	 *
	 * @method setPinCoordinateTo
	 * @param {Number} x The x coordinate of new pin location.
	 * @param {Number} y The y coordinate of new pin location.
	 */
	setPinPoint(x, y) {
		this._pin.setPoint(x, y);
	}

	/**
	 * Returns the current pin location as point.</br>
	 * See {{#crossLink "GraphItem/getOrigin:method"}}{{/crossLink}} too.
	 *
	 * @method getPinPoint
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The pin location.
	 */
	getPinPoint(reusepoint) {
		return this._pin.getPoint(reusepoint);
	}

	/**
	 * Returns the origin of this graph item relative to its parent.</br>
	 * The origin is determined by the item's total pin, i.e. the pin and its local pin.</br>
	 * See {{#crossLink "Pin"}}{{/crossLink}} too.
	 *
	 * @method getOrigin
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The items origin.
	 */
	getOrigin(reusepoint) {
		const origin = reusepoint || new Point(0, 0);
		origin.setTo(this._origincache);
		return origin;
	}

	/**
	 * Sets the origin of this graph item relative to its parent.
	 *
	 * @method setOriginTo
	 * @param {Point} point The new origin location.
	 */
	setOriginTo(point) {
		this.setOrigin(point.x, point.y);
	}

	/**
	 * Sets the origin of this graph item relative to its parent.
	 *
	 * @method setOrigin
	 * @param {Number} x The x coordinate of new origin location.
	 * @param {Number} y The y coordinate of new origin location.
	 */
	setOrigin(x, y) {
		// we have to adjust pin:
		let localpin = this._pin.getLocalPoint(JSG.ptCache.get());
		localpin = MathUtils.rotatePoint(localpin, this._angle.getValue());
		localpin.translate(x, y);
		this.setPinPoint(localpin.x, localpin.y);
		JSG.ptCache.release(localpin);
	}

	/**
	 * Translates this items pin about specified delta.</br>
	 * <b>Note:</b> this will remove any previously pin formula.
	 *
	 * @method translate
	 * @param {Number} dX The delta x.
	 * @param {Number} dY The delta y.
	 */
	translate(dX, dY) {
		if (dX || dY) {
			this._pin.translate(dX, dY);
		}
	}

	/**
	 * Returns the current angle expression.
	 *
	 * @method getAngle
	 * @return {NumberExpression} The angle expression.
	 */
	getAngle() {
		return this._angle;
	}

	/**
	 * Sets this items angle to given value or expression.
	 *
	 * @method setAngle
	 * @param {NumberExpression | Number} angle The new angle.
	 */
	setAngle(angle) {
		if (!this.getAngle().isEqualToExpressionOrValue(angle)) {
			const event = new Event(Event.ANGLE, angle);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._angle.setExpressionOrValue(angle);
				this._update();
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Returns the current bounding box relative to items pin.</br>
	 * The bounding box covers all points defined by items shape.
	 *
	 * @method getBoundingBox
	 * @param {BoundingBox} [reusebbox] An optional bounding box to reuse, if not supplied a new one will
	 *     be created.
	 * @return {BoundingBox} The items bounding box.
	 */
	getBoundingBox(reusebbox) {
		const bbox = reusebbox || new BoundingBox(0, 0);
		bbox.setTo(this._bboxcache);
		return bbox;
	}

	/**
	 * Returns the total bounding Rectangle of this item. </br>
	 * The total bounding Rectangle encloses all points of this item translated BoundingBox joined with
	 * the total bounding Rectangle of all of its sub items. An optional target item to use for
	 * translating the BoundingBox can be specified. If not given, this item is set as target.
	 *
	 * @method getTotalBoundingRect
	 * @param {GraphItem} [target] An optional target item to translate the BoundingBox to.
	 * @param {Rectangle} [reuserect] An optional Rectangle to reuse, if not supplied a new one will be
	 *     created.
	 * @return {Rectangle} The total bounding rectangle of this item.
	 */
	getTotalBoundingRect(target, reuserect) {
		target = target !== undefined ? target : this._parent;

		const box = JSG.boxCache.get();
		const tmprect = JSG.rectCache.get();
		let frame = this.getFormat()
			.getLineWidth()
			.getValue();
		const shadow = Math.max(
			this.getFormat()
				.getShadowOffsetX()
				.getValue(),
			this.getFormat()
				.getShadowOffsetY()
				.getValue()
		);
		this.getBoundingBox(box);

		function traverse(item) {
			item.translateBoundingBoxToParent(box);
			return true;
		}

		GraphUtils.traverseItemUp(this._parent, target, traverse);

		frame = Math.max(frame, Math.abs(shadow));

		const totalrect = box.getBoundingRectangle(reuserect);

		totalrect.expandBy(frame);

		const isCollapsed = this.isCollapsed();
		const isVisible = this.isItemVisible();

		this._subItems.forEach((subItem) => {
			if (isVisible && (!isCollapsed || subItem.isTextNode())) {
				totalrect.union(subItem.getTotalBoundingRect(target, tmprect));
			}
		});
		JSG.boxCache.release(box);
		JSG.rectCache.release(tmprect);

		return totalrect;
	}

	/**
	 * Returns the current center point of this GraphItem. </br>
	 * The returned point is the center of the items corresponding
	 * {{#crossLink "BoundingBox"}}{{/crossLink}} and is given relative to items pin.
	 *
	 * @method getCenter
	 * @param {Point} [reusepoint] An optional Point to reuse, if not supplied a new one will be created.
	 * @return {Point} The center point of this item.
	 */
	getCenter(reusepoint) {
		return this._bboxcache.getCenter(reusepoint).add(this._bboxcache._topleft);
	}

	/**
	 * Sets the center of this GraphItem to the specified location.</br>
	 * <b>Note:</b> this actually moves item pin, so that the items center is at given location.
	 *
	 * @method setCenterTo
	 * @param {Point} point The new center point.
	 */
	setCenterTo(point) {
		this.setCenter(point.x, point.y);
	}

	/**
	 * Sets the center of this GraphItem to the specified location.</br>
	 * <b>Note:</b> this actually moves item pin, so that the items center is at given location.
	 *
	 * @method setCenter
	 * @param {Number} x The x coordinate of new center location.
	 * @param {Number} y The y coordinate of new center location.
	 */
	setCenter(x, y) {
		let localpin = this._pin.getLocalPoint();
		localpin.x -= this.getWidth().getValue() / 2;
		localpin.y -= this.getHeight().getValue() / 2;
		localpin = MathUtils.rotatePoint(localpin, this._angle.getValue());
		this.setPinPoint(x + localpin.x, y + localpin.y);
	}

	/**
	 * Sets the bounding box to given box.</br>
	 * <b>Note:</b> this could change item's pin, so after calling this method the item's origin may has changed.
	 *
	 * @method setBoundingBoxTo
	 * @param {BoundingBox} newbbox The new bounding box.
	 */
	setBoundingBoxTo(newbbox, force) {
		const oldbbox = this.getBoundingBox(JSG.boxCache.get());
		if (force || !oldbbox.isEqualTo(newbbox, 50)) {
			const event = new Event(Event.BBOX, newbbox);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this.disableEvents();
				this._angle.setExpressionOrValue(newbbox.getAngle());
				// set new size:
				const newTopLeft = JSG.ptCache.get();
				let newWidth = newbbox.getWidth();
				let newHeight = newbbox.getHeight();
				if (this.isCollapsed()) {
					const collapsable = this.isCollapsable();
					if (collapsable & ItemAttributes.Direction.HORIZONTAL) {
						newWidth = this._size.getWidth().getValue();
					}
					if (collapsable & ItemAttributes.Direction.VERTICAL) {
						newHeight = this._size.getHeight().getValue();
					}
				}
				this.setSize(newWidth, newHeight);
				this._bboxcache.setTo(newbbox);
				// new origin:
				this.setOriginTo(newbbox.getTopLeft(newTopLeft));
				JSG.ptCache.release(newTopLeft);
				// finally notify listeners about size change...
				this.enableEvents();
				this.sendPostEvent(event);
			}
		}
		JSG.boxCache.release(oldbbox);
	}

	/**
	 * Returns the current item size.</br>
	 * <b>Note:</b> this method takes the current collapsed state into account. So if the item is
	 * collapsed a copy of inner size with adjusted values is returned. If the item is not collapsed this
	 * method provides direct access to underlying size object. The <code>raw</code> flag can be used to
	 * get the underlying size object, regardless of current state. Default for this is <code>false</code>
	 *
	 * @method getSize
	 * @param {Boolean} [raw] Specify <code>true</code> to get direct access to underlying size object,
	 *     <code>false</code> to take inner state into account.
	 * @return {Size} The item size.
	 */
	getSize(raw) {
		if (raw === true) {
			return this._size;
		}
		if (this.isCollapsed()) {
			const collapsable = this.isCollapsable();
			if (collapsable === ItemAttributes.Direction.BOTH) {
				return this._collapsedSize;
			}

			const size = this._size.copy();
			if (collapsable & ItemAttributes.Direction.VERTICAL) {
				size.setHeight(this._collapsedSize.getHeight());
			}
			if (collapsable & ItemAttributes.Direction.HORIZONTAL) {
				size.setWidth(this._collapsedSize.getWidth());
			}

			return size;
		}

		return this._size;
	}

	/**
	 * Returns current size as point.</br>
	 * See {{#crossLink "GraphItem/getSize:method"}}{{/crossLink}} too.
	 *
	 * @method getSizeAsPoint
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The current size as point.
	 */
	getSizeAsPoint(reusepoint) {
		const point = reusepoint !== undefined ? reusepoint : new Point(0, 0);
		if (this.isCollapsed()) {
			const collapsable = this.isCollapsable();
			point.x =
				collapsable & ItemAttributes.Direction.HORIZONTAL
					? this._collapsedSize.getWidth().getValue()
					: this._size.getWidth().getValue();
			point.y =
				collapsable & ItemAttributes.Direction.VERTICAL
					? this._collapsedSize.getHeight().getValue()
					: this._size.getHeight().getValue();
		} else {
			point.x = this._size.getWidth().getValue();
			point.y = this._size.getHeight().getValue();
		}
		return point;
	}

	/**
	 * Returns the current width expression.
	 *
	 * @method getWidth
	 * @return {NumberExpression} The width expression.
	 */
	getWidth() {
		// var attributes = this._attributes;
		if (this.isCollapsed() === true) {
			const attributes = this.getItemAttributes();
			if (attributes.getCollapsable().getValue() & ItemAttributes.Direction.HORIZONTAL) {
				return this._collapsedSize.getWidth();
			}
		}
		return this._size.getWidth();
	}

	/**
	 * Returns the current height expression.
	 *
	 * @method getHeight
	 * @return {NumberExpression} The height expression.
	 */
	getHeight() {
		// var attributes = this._attributes;
		if (this.isCollapsed() === true) {
			const attributes = this.getItemAttributes();
			if (attributes.getCollapsable().getValue() & ItemAttributes.Direction.VERTICAL) {
				return this._collapsedSize.getHeight();
			}
		}
		return this._size.getHeight();
	}

	/**
	 * Returns the minimum size (in 1/100mm) to use for this GraphItem. That means the neither the
	 * width nor the height of this GraphItem is less than the returned minimum size.<br/>
	 * Subclasses can override this method to allow different minimum sizes.
	 * Note: negative values will be ignored, i.e. no minimum size.
	 *
	 * @method getMinSize
	 * @return {Number} The minimum size for this GraphItem.
	 */
	getMinSize() {
		return JSG.MIN_WIDTH_HEIGHT;
	}

	/**
	 * Sets the item size.
	 *
	 * @method setSizeTo
	 * @param {Size} size The new item size.
	 */
	setSizeTo(size) {
		this.setSize(size.getWidth(), size.getHeight());
	}

	/**
	 * Sets the item size to given point values.
	 *
	 * @method setSizeToPoint
	 * @param {Point} point A point which defines the new size.
	 */
	setSizeToPoint(point) {
		this.setSize(point.x, point.y);
	}

	/**
	 * Sets the item size to the given width and height expressions or value.
	 *
	 * @method setSize
	 * @param {NumberExpression | Number} wExpr The new width expression or the new width value.
	 * @param {NumberExpression | Number} hExpr The new height expression or the new height value.
	 */
	setSize(wExpr, hExpr) {
		let newWidth = wExpr !== undefined ? wExpr : this._size.getWidth();
		let newHeight = hExpr !== undefined ? hExpr : this._size.getHeight();

		function getValue(field) {
			return field.getValue !== undefined ? field.getValue() : field;
		}

		function setValue(field, val) {
			if (field.setValue !== undefined) {
				field.setValue(val);
			} else {
				field = val;
			}
			return field;
		}

		const minsize = this.getMinSize();
		// JSG.MIN_WIDTH_HEIGHT;
		if (minsize >= 0) {
			newWidth = getValue(newWidth) < minsize ? setValue(newWidth, minsize) : newWidth;
			newHeight = getValue(newHeight) < minsize ? setValue(newHeight, minsize) : newHeight;
		}

		if (!this._size.isEqualTo(newWidth, newHeight)) {
			const newSize = {
				width: newWidth,
				height: newHeight
			};
			const event = new Event(Event.SIZE, newSize);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._size.set(newWidth, newHeight);
				// we leave following to caller, because it setSize might be part of several changes!
				// this._size.evaluate(this);  //=> and only on last one a simple evaluate is wanted, e.g. via
				// GraphItem.evaluate... refresh cache:
				this.refresh();
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Sets the item width to given expressions or value.
	 *
	 * @method setWidth
	 * @param {NumberExpression | Number} wExpr The new width expression or the new width value.
	 */
	setWidth(wExpr) {
		this.setSize(wExpr, undefined);
	}

	/**
	 * Sets the item height to given expressions or value.
	 *
	 * @method setHeight
	 * @param {NumberExpression | Number} hExpr The new height expression or the new height value.
	 */
	setHeight(hExpr) {
		this.setSize(undefined, hExpr);
	}

	/**
	 * Sets the item collapsed size to the given width and height expressions or value.
	 *
	 * @method setCollapsedSize
	 * @param {NumberExpression | Number} wExpr The new width expression or the new width value.
	 * @param {NumberExpression | Number} hExpr The new height expression or the new height value.
	 */
	setCollapsedSize(wExpr, hExpr) {
		let newWidth = wExpr !== undefined ? wExpr : this._collapsedSize.getWidth();
		let newHeight = hExpr !== undefined ? hExpr : this._collapsedSize.getHeight();

		function getValue(field) {
			return field.getValue !== undefined ? field.getValue() : field;
		}

		function setValue(field, val) {
			if (field.setValue !== undefined) {
				field.setValue(val);
			} else {
				field = val;
			}
			return field;
		}

		const minsize = this.getMinSize();
		// JSG.MIN_WIDTH_HEIGHT;
		if (minsize >= 0) {
			newWidth = getValue(newWidth) < minsize ? setValue(newWidth, minsize) : newWidth;
			newHeight = getValue(newHeight) < minsize ? setValue(newHeight, minsize) : newHeight;
		}

		if (!this._collapsedSize.isEqualTo(newWidth, newHeight)) {
			const newSize = {
				width: newWidth,
				height: newHeight
			};
			const event = new Event(Event.COLLAPSEDSIZE, newSize);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._collapsedSize.set(newWidth, newHeight);
				// we leave following to caller, because it setSize might be part of several changes!
				// this._size.evaluate(this);  //=> and only on last one a simple evaluate is wanted, e.g. via
				// GraphItem.evaluate... refresh cache:
				this.refresh();
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Replaces current item shape with given one.
	 *
	 * @method setShapeTo
	 * @param {Shape} newshape The new item shape.
	 */
	setShapeTo(newshape) {
		const event = new Event(Event.SHAPE, newshape);
		event.source = this;
		this.sendPreEvent(event);
		if (event.doIt === true) {
			// go on...
			this._setShapeTo(newshape);
			this._shape.evaluate();
			this._shape.refresh();
			// call this to calculate shape points cache...
			this.sendPostEvent(event);
		}
	}

	_setShapeTo(newshape) {
		if (this._shape !== undefined) {
			this._shape.setItem(undefined);
		}
		this._shape = newshape;
		this._shape.setItem(this);
	}

	/**
	 * Returns direct access to inner used shape.
	 *
	 * @method getShape
	 * @return {Shape} Current item shape.
	 */
	getShape() {
		return this._shape;
	}

	/**
	 * Evaluates all {{#crossLink "Expression"}}{{/crossLink}}s used by this item.
	 * E.g. expressions within properties, attributes, formats and shape are evaluated.</br>
	 * <b>Note:</b> subitems will be evaluated too!
	 *
	 * @method evaluate
	 */
	evaluate() {
		if (!this._reading && !JSG.idUpdater.isActive) {
			this._angle.evaluate(this);
			this._layer.evaluate(this);
			this._type.evaluate(this);
			this._name.evaluate(this);
			this._link.evaluate(this);
			this._tooltip.evaluate(this);
			this._pin.evaluate();
			this._size.evaluate(this);
			this._collapsedSize.evaluate(this);
			this._shape.evaluate();

			this.getModelAttributes().evaluate(this);

			this._reshapeCoordinates.forEach((reshapeCoordinate) => {
				reshapeCoordinate.evaluate(this);
			});
			// evaluate subitems...
			this._subItems.forEach((subItem) => {
				subItem.evaluate();
			});

			// update cache without sending event...
			this.setRefreshNeeded(true);
			this._update();
		}
	}

	invalidateTerms() {
		this._angle.invalidateTerm();
		this._layer.invalidateTerm();
		this._type.invalidateTerm();
		this._name.invalidateTerm();
		this._link.invalidateTerm();
		this._tooltip.invalidateTerm();
		this._pin.invalidateTerms();
		this._size.invalidateTerms();
		this._collapsedSize.invalidateTerms();
		this._shape.invalidateTerms();
		this.getModelAttributes().invalidateTerm();

		this._reshapeCoordinates.forEach((reshapeCoordinate) => {
			reshapeCoordinate.invalidateTerms();
		});
		// evaluate subitems...
		this._subItems.forEach((subItem) => {
			subItem.invalidateTerms();
		});
	}

	/**
	 * Resolves parent references within internally used {{#crossLink "Expression"}}{{/crossLink}}s.</br>
	 * The passed GraphItem is used to resolve parent reference and the optional <code>doRemove</code>
	 * flag can be used to clear the complete Expression formula.<br/>
	 * This is useful in cases like copy & paste where the paste parent is not necessarily equal to
	 * the copy parent.
	 *
	 * @method resolveParentReference
	 * @param {GraphItem} item Used to resolve parent reference.
	 * @param {Boolean} [doRemove] Specify <code>true</code> to remove value Expression formula completely.
	 */
	resolveParentReferences(doRemove) {
		this._angle.resolveParentReference(this, doRemove);
		this._layer.resolveParentReference(this, doRemove);
		this._type.resolveParentReference(this, doRemove);
		this._name.resolveParentReference(this, doRemove);
		this._link.resolveParentReference(this, doRemove);
		this._tooltip.resolveParentReference(this, doRemove);

		this._pin.resolveParentReference(doRemove);
		this._size.resolveParentReference(this, doRemove);
		this._collapsedSize.resolveParentReference(this, doRemove);

		this._shape.resolveParentReference(doRemove);

		this.getModelAttributes().resolveParentReference(this, doRemove);

		this._reshapeCoordinates.forEach((reshapeCoordinate) => {
			reshapeCoordinate.resolveParentReference(this, doRemove);
		});
	}

	/**
	 * Rotates this item around specified point or around its pin if no rotation point is given.
	 *
	 * @method rotate
	 * @param {Number} angle The rotation angle in radiant.
	 * @param {Point} [point] An optional rotation point.
	 */
	rotate(angle, rotpoint) {
		if (angle === 0) {
			return;
		}

		if (rotpoint !== undefined) {
			this._pin.rotate(angle, rotpoint);
		}
		this.setAngle(this.getAngle().getValue() + angle);
	}

	/**
	 * Adds a new text node with given text to this item.</br>
	 * By default this method tries to place the created text node at the next free position defined by
	 * vertical and horizontal format properties.</br>
	 * <b>Note:</b> calling this method has only an effect if
	 * {{#crossLink "GraphItem/isAddLabelAllowed:method"}}{{/crossLink}} returns
	 * <code>true</code>.</br>
	 * See {{#crossLink "TextFormatAttributes.VerticalTextPosition"}}{{/crossLink}},
	 * {{#crossLink "TextFormatAttributes.HorizontalTextPosition"}}{{/crossLink}}
	 *
	 * @method addLabel
	 * @param {TextNode} [textnode] An optional text node, if specified this one will be taken as
	 *     label.
	 * @return {TextNode} The created text node or <code>undefined</code> if adding a label is not
	 *     allowed.
	 */
	addLabel(label) {
		if (!this.isAddLabelAllowed()) {
			return undefined;
			// ignore creation if not allowed...
		}

		const pos = this.getNewLabelPosition();
		if (pos !== undefined) {
			label.disableEvents();
			label.getTextFormat().setVerticalPosition(Math.floor(pos / 5) + 1);
			label.getTextFormat().setHorizontalPosition((pos % 5) + 1);
			label.enableEvents();
		}

		this.addItem(label);

		label.getTextFormat().setParent(this.getTextFormat());
		label.setItemAttribute(ItemAttributes.SNAPTO, false);
		label.evaluate();
		label.updateSize();

		return label;
	}

	getNewLabelPosition() {
		const positions = [];
		let i;

		// mark all positions as unused
		for (i = 0; i < 25; i += 1) {
			positions.push(false);
		}

		let found = false;
		// mark used positions
		this._subItems.forEach((item) => {
			if (item.isTextNode() && item.isAssociated()) {
				const vpos = item
					.getTextFormat()
					.getVerticalPosition()
					.getValue();
				const hpos = item
					.getTextFormat()
					.getHorizontalPosition()
					.getValue();
				if (hpos && vpos) {
					positions[(vpos - 1) * 5 + hpos - 1] = true;
				}
				found = true;
			}
		});

		if (found === false) {
			return undefined;
		}

		for (i = 0; i < 25; i += 1) {
			if (positions[i] === false) {
				return i;
			}
		}

		return undefined;
	}

	/**
	 * Returns <code>true</code> if this item supports simple label adding via
	 * {{#crossLink "GraphItem/addLabel:method"}}{{/crossLink}},
	 * <code>false</code> otherwise.</br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>true</code>.
	 *
	 * @method isAddLabelAllowed
	 * @return {Boolean} <code>true</code> if label adding is supported, <code>false</code> otherwise
	 */
	isAddLabelAllowed() {
		return (
			!this.isProtected() &&
			!(
				this.getItemAttributes()
					.getEditMask()
					.getValue() & ItemAttributes.EditMask.ADDLABEL
			)
		);
	}

	isEditLabelAllowed() {
		return (
			!this.isProtected() &&
			!(
				this.getItemAttributes()
					.getEditMask()
					.getValue() & ItemAttributes.EditMask.LABEL
			)
		);
	}

	/**
	 * Returns <code>true</code> if this item selecting by using the TAB key is allowed, and false, if not.
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>true</code>.
	 *
	 * @method isTabSelectAllowed
	 * @return {Boolean} <code>true</code> if selecting is supported, <code>false</code> otherwise
	 * @since 1.6.33
	 */
	isTabSelectAllowed() {
		return true;
	}

	/**
	 * Returns the layer expression of this item.</br>
	 * Layers are used to change selection and visibility state of items.</br>
	 * See {{#crossLink "Layer"}}{{/crossLink}} too.
	 *
	 * @method getLayer
	 * @return {StringExpression} The layer expression.
	 */
	getLayer() {
		return this._layer;
	}

	/**
	 * Sets the new layer expression or value.
	 *
	 * @method setLayer
	 * @param {StringExpression} newLayer The new layer expression.
	 */
	setLayer(newLayer) {
		if (!this._layer.isEqualToExpressionOrValue(newLayer)) {
			const event = new Event(Event.LAYER, newLayer);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._layer.setExpressionOrValue(newLayer);
				// create layer, if not existing
				if (this.getGraph()) {
					this.getGraph().getLayer(this._layer.getValue());
				}
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Iterate through layers attached to this GraphItem
	 * @method iterateLayers
	 * @param {function} callback Function called for each layer with layer name and layer as parameters. If layer
	 * is not defined in graph, it is still iterated here!
	 * @since 3.0
	 */
	iterateLayers(callback) {
		const layerNames = String(this._layer.getValue());
		const layers = layerNames.split(';');
		const graph = this.getGraph();

		layers.forEach((layerName) => {
			if (graph === undefined) {
				callback(layerName, undefined);
			} else {
				const layer = graph.getLayer(layerName);
				callback(layerName, layer);
			}
		});
	}

	/**
	 * Returns the type expression for this item.
	 *
	 * @method getType
	 * @return {StringExpression} The type expression.
	 */
	getType() {
		return this._type;
	}

	/**
	 * Sets the new type expression or value.
	 *
	 * @method setType
	 * @param {StringExpression} type The new type expression or value.
	 */
	setType(newType) {
		if (!this._type.isEqualToExpressionOrValue(newType)) {
			const event = new Event(Event.TYPE, newType);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._type.setExpressionOrValue(newType);
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Returns the name expression for this item.
	 *
	 * @method getName
	 * @return {StringExpression} The type expression.
	 */
	getName() {
		return this._name;
	}

	/**
	 * Sets the new name expression or value.
	 *
	 * @method setName
	 * @param {StringExpression} type The new type expression or value.
	 */
	setName(newName) {
		if (!this._name.isEqualToExpressionOrValue(newName)) {
			const event = new Event(Event.NAME, newName);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._name.setExpressionOrValue(newName);
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Returns the tag attribute for this item or <code>undefined</code> if none has been set.
	 *
	 * @method getTag
	 * @param {Object} [defval] An optional default value. If this parameter is specified the <code>Attribute</code>
	 *     value is returned instead of the <code>Attribute</code> itself. If no tag <code>Attribute</code> has been
	 *     set, this default value is returned.
	 * @return {Attribute} The tag attribute.
	 */
	getTag(defval) {
		const tagattr = this.getModelAttributes().getAttribute('tag');
		return defval !== undefined ? (tagattr ? tagattr.getValue() : defval) : tagattr;
	}

	/**
	 * Sets a new tag <code>StringExpression</code> or value.<br/>
	 * Note: this will create a new model attribute if none was set before.
	 *
	 * @method setTag
	 * @param {StringExpression|String} tag The new tag <code>Attribute</code> or value.
	 */
	setTag(tag) {
		const attributes = this.getModelAttributes();
		let tagattr = attributes.getAttribute('tag');
		tagattr = tagattr || attributes.addAttribute(new StringAttribute('tag', tag));
		tagattr.setExpressionOrValue(tag);
	}

	/**
	 * Calls layout on this item and on all of its subitems.</br>
	 * Note that subitems are traversed first.
	 *
	 * @method layoutAll
	 */
	layoutAll() {
		const notifyLayout = !!this._layout && this._layout.isEnabled(this);

		if (notifyLayout) {
			this._layout.preLayout(this);
		}

		this._subItems.forEach((item) => item.layoutAll());

		this.layout(true, false);

		if (notifyLayout) {
			this._layout.postLayout(this);
		}
	}

	/**
	 * Layout this item.
	 *
	 * @method layout
	 * @param {Boolean} [skipNotify] Specify <code>true</code> to skip notification of current <code>Layout</code> via
	 * <code>preLayout</code> and <code>postLayout</code>.
	 * @param {Boolean} [forceNodeLayout] Specify <code>true</code> or <code>undefined</code> to force the current
	 *     <code>Layout</code> to be executed.
	 */
	layout(skipNotify, forceNodeLayout) {
		if (this.isRefreshNeeded()) {
			const layout = this._layout;
			if (layout && layout.isEnabled(this)) {
				const notify = !skipNotify;
				if (notify) {
					layout.preLayout(this);
				}
				layout.layout(this, forceNodeLayout);
				if (notify) {
					layout.postLayout(this);
				}
			}
			// console.log('layout: ' + this.getId());
		}
	}

	/**
	 * Calculates the bounding rectangle which covers all inner subitems. This method is only used during
	 * layout.
	 *
	 * @method _getBoundingRectOffAllSubItems
	 * @param {Rectangle} rect The starting rectangle which will be extended to cover subitems.
	 * @param {GraphItem} sourceItem The initial graph item to start subitems traversal at.
	 * @param {Point} origin The reference origin used to translate rectangles.
	 * @private
	 */
	_getBoundingRectOffAllSubItems(rect, sourceItem, origin) {
		const getBoundingRect = (model, lrect, lsourceItem, lorigin) => {
			const modelOrigin = model.getOrigin();
			const rectSub = JSG.rectCache.get();

			lorigin.add(modelOrigin);

			model._subItems((item) => {
				item._getBoundingRectOffAllSubItems(rectSub, lsourceItem, lorigin);
			});

			lorigin.subtract(modelOrigin);
			rectSub.width += model
				.getItemAttributes()
				.getRightMargin()
				.getValue();
			rectSub.height += model
				.getItemAttributes()
				.getBottomMargin()
				.getValue();
			lrect.union(rectSub);
			JSG.rectCache.release(rectSub);
		};

		const box = this.getBoundingBox(JSG.boxCache.get());
		const itemRect = box.getBoundingRectangle(JSG.rectCache.get());
		JSG.boxCache.release(box);

		itemRect.translate(origin.x, origin.y);
		itemRect.x = Math.max(0, itemRect.x);
		itemRect.y = Math.max(0, itemRect.y);
		rect.union(itemRect);
		JSG.rectCache.release(itemRect);

		if (this.isCollapsed()) {
			return;
		}

		getBoundingRect(this, rect, sourceItem, origin);
	}

	/**
	 * Updates the positions of each registered text node depending on its text position setting.</br>
	 * See {{#crossLink "TextFormatAttributes.VerticalTextPosition"}}{{/crossLink}} and
	 * {{#crossLink "TextFormatAttributes.HorizontalTextPosition"}}{{/crossLink}}
	 *
	 * @method updateLabelPositions
	 */
	updateLabelPositions() {
		const pos = JSG.ptCache.get(0, 0);
		let newpos = JSG.ptCache.get(0, 0);
		let textBox = JSG.boxCache.get();
		let textRect = JSG.rectCache.get();

		this._subItems.forEach((item) => {
			if (this.isVisible()) {
				if (item.isTextNode() && item.isAssociated()) {
					const pin = item.getPin();
					const tf = item.getTextFormat();
					const margin = 0;
					textBox = item.getBoundingBox(textBox);
					textRect = textBox.getBoundingRectangle(textRect);
					const hp = tf.getHorizontalPosition().getValue();
					const vp = tf.getVerticalPosition().getValue();
					pos.set(pin.getX().getValue(), pin.getY().getValue());

					newpos = this.getLabelPositionAt(hp, vp, textRect, margin, newpos);
					if (newpos.x !== undefined && newpos.y !== undefined) {
						if (!newpos.isEqualTo(pos, 50)) {
							pin.setPointTo(newpos);
						}
					} else if (pos.x !== undefined && Math.abs(pos.x - newpos.x) > 50) {
						pin.setX(newpos.x);
					} else if (pos.y !== undefined && Math.abs(pos.y - newpos.y) > 50) {
						pin.setY(newpos.y);
					}
				}
			}
		});

		JSG.ptCache.release(pos, newpos);
		JSG.boxCache.release(textBox);
		JSG.rectCache.release(textRect);
	}

	getLabelPositionAt(hp, vp, labelRect, margin, reusepoint) {
		const pos = reusepoint || new Point(0, 0);
		const bbox = this.getBoundingBox();

		switch (vp) {
			case TextFormatAttributes.VerticalTextPosition.ONTOP:
				pos.y = -labelRect.height / 2 + margin;
				break;
			case TextFormatAttributes.VerticalTextPosition.TOP:
				pos.y = labelRect.height / 2 - margin;
				break;
			case TextFormatAttributes.VerticalTextPosition.CENTER:
				pos.y = bbox.getHeight() / 2;
				break;
			case TextFormatAttributes.VerticalTextPosition.BOTTOM:
				pos.y = bbox.getHeight() - labelRect.height / 2 + margin;
				break;
			case TextFormatAttributes.VerticalTextPosition.BELOWBOTTOM:
				pos.y = bbox.getHeight() + labelRect.height / 2 - margin;
				break;
			case TextFormatAttributes.VerticalTextPosition.CUSTOM:
				pos.y = undefined;
				break;
			default:
				break;
		}
		switch (hp) {
			case TextFormatAttributes.HorizontalTextPosition.TOLEFT:
				pos.x = -labelRect.width / 2;
				break;
			case TextFormatAttributes.HorizontalTextPosition.LEFT:
				pos.x = labelRect.width / 2;
				break;
			case TextFormatAttributes.HorizontalTextPosition.CENTER:
				pos.x = bbox.getWidth() / 2;
				break;
			case TextFormatAttributes.HorizontalTextPosition.RIGHT:
				pos.x = bbox.getWidth() - labelRect.width / 2;
				break;
			case TextFormatAttributes.HorizontalTextPosition.TORIGHT:
				pos.x = bbox.getWidth() + labelRect.width / 2;
				break;
			case TextFormatAttributes.HorizontalTextPosition.CUSTOM:
				pos.x = undefined;
				break;
			default:
				break;
		}

		return pos;
	}

	/**
	 * Returns the inner used format attributes.
	 *
	 * @method getFormat
	 * @return {FormatAttributes} The format attributes.
	 */
	getFormat() {
		if (this._attrCache.format !== undefined) {
			return this._attrCache.format;
		}
		return this.getModelAttributes().getAttribute(FormatAttributes.NAME);
	}

	/**
	 * Returns the inner used text format attributes.</br>
	 * <b>Note:</b> if this item has no text format a new text format is created and returned.
	 *
	 * @method getTextFormat
	 * @return {TextFormatAttributes} The text format attributes.
	 */
	getTextFormat() {
		const tf = this.getAttribute(TextFormatAttributes.NAME);
		return tf || this.addAttribute(new TextFormatAttributes()); // this._addTextFormat();
	}

	/**
	 * Returns the number of {{#crossLink "TextNode"}}{{/crossLink}}s this item currently
	 * has as subitems.
	 *
	 * @method getTextItemCount
	 * @return {Number} The number of text nodes added to this item.
	 */
	getTextItemCount() {
		let cnt = 0;

		this._subItems.forEach((item) => {
			if (item.isTextNode()) {
				cnt += 1;
			}
		});
		return cnt;
	}

	/**
	 * Returns the parent item or <code>undefined</code> if item has none.
	 *
	 * @method getParent
	 * @return {GraphItem} The parent item or <code>undefined</code>.
	 */
	getParent() {
		return this._parent;
	}

	/**
	 * Changes the parent of this item.</br>
	 * This will deregister this item from its old parent and evaluate it after adding to new parent.
	 *
	 * @method changeParent
	 * @param {GraphItem} newparent The new parent item.
	 */
	changeParent(newparent) {
		if (newparent !== this._parent) {
			const event = new Event(Event.PARENT, newparent);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				if (this._parent !== undefined) {
					Arrays.remove(this._parent._subItems, this);
				}
				this._parent = newparent;
				if (this._parent !== undefined) {
					this._parent._subItems.push(this);
				}
				// evaluate item because our parent changed...
				this.evaluate();
				this.sendPostEvent(event);
				// finally notify sub-items about path change:
				this.pathChanged();
			}
		}
	}

	pathChanged() {
		// notify listeners:
		this.sendPostEvent(new Event(Event.PATH));
		// notify sub items:
		this._subItems.forEach((item) => {
			item.pathChanged();
		});
	}

	/**
	 * Returns the {{#crossLink "Graph"}}{{/crossLink}} instance this item belongs to
	 * or <code>undefined</code> if it is not added yet.
	 *
	 * @method getGraph
	 * @return {Graph} The graph this item was added to or <code>undefined</code>.
	 */
	getGraph() {
		return this._parent !== undefined ? this._parent.getGraph() : undefined;
	}

	/**
	 * Returns direct access to the inner list of sub items.
	 *
	 * @method getItems
	 * @return {Array} The list of inner sub items.
	 */
	getItems() {
		return this._subItems;
	}

	/**
	 * Returns access to a sub item at the given index.
	 *
	 * @method getItemAt
	 * @param {Number} index Index of item to retrieve.
	 * @return {GraphItem} Sub item at given index position.
	 */
	getItemAt(index) {
		if (index < 0 || index >= this._subItems.length) {
			return undefined;
		}

		return this._subItems[index];
	}

	/**
	 * Returns number of sub items.
	 *
	 * @method getItemCount
	 * @return {Number} Current number of Sub items .
	 */
	getItemCount() {
		return this._subItems.length;
	}

	/**
	 * Looks up an item by given path.
	 *
	 * @method findItemByPath
	 * @param {Path} path The path of the item to find.
	 * @return {GraphItem} The item for given path or <code>undefined</code>.
	 */
	findItemByPath(path) {
		function findItemById(id, items) {
			let res;
			Arrays.every(items, (item) => {
				if (item.getId() === id) {
					res = item;
					return false;
				}
				return true;
			});
			return res;
		}

		if (path === undefined) {
			return undefined;
		}

		const id = path.nextId();
		const item = id !== undefined ? (id === this.getId() ? this : findItemById(id, this._subItems)) : undefined;

		return item !== undefined ? (path.hasNextId() ? item.findItemByPath(path) : item) : undefined;
	}

	/**
	 * Adds given item as a sub item.</br>
	 * <b>Note:</b> if given item is already a sub item of this GraphItem, calling this method has no effect.<br/>
	 * The index parameter is optional and if not set or if it is out or range the given item is simply
	 * append to the subitems list. </br>
	 * Furthermore note that the passed item will be removed from its parent first if it was not done before.
	 *
	 * @method addItem
	 * @param {GraphItem} item The item to add.
	 * @param {Number} [atIndex] An optional index to specify the position within subitems list.
	 * @return {GraphItem} The added item or <code>undefined</code> if item was not added.
	 */
	addItem(item, atIndex) {
		const oldparent = item.getParent();
		if (oldparent !== this) {
			const event = new Event(Event.ITEMADD, item);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				if (oldparent !== undefined) {
					oldparent.removeItem(item);
				}
				Arrays.insertAt(this._subItems, atIndex, item);
				item._parent = this;
				item._assignId();
				// finally evaluate item because its parent changed...
				item.evaluate();
				this.sendPostEvent(event);
				return item;
			}
		}
		return undefined;
	}

	/**
	 * Assigns a new ID to this graph item and to all of it sub items.</br>
	 * An ID is only assigned if this graph item has no ID yet or if the force parameter is set to <code>true</code>.
	 * In both cases the IDs of the sub-items are newly assigned.
	 * <b>Note:</b> usually it is not required to call this method from outside.
	 *
	 * @method _assignId
	 * @param {Boolean} [force] Optional flag, specify <code>true</code> to force creation of a new id!
	 * @private
	 */
	_assignId(force) {
		const oldId = this.getId();

		// TODO: JSG.idUpdater is set by JSGGlobals
		const newId =
			(JSG.idUpdater && JSG.idUpdater.isActive) || force || oldId === undefined ? this._createId() : undefined;
		if (newId !== undefined) {
			this.setId(newId);
			const attr = this.getItemAttributes().getAttribute('sheetsource');
			if (!attr || attr.getValue() !== 'cell') {
				this._assignName(newId);
			}
			// save old/new id match to restore references to id in expressions, attributes and ports

			// TODO: JSG.idUpdater is set by JSGGlobals
			if (JSG.idUpdater && JSG.idUpdater.isActive) {
				if (oldId !== undefined) {
					JSG.idUpdater.mapId(oldId, newId);
				}
			}
		}

		if (JSG.idUpdater && JSG.idUpdater.isActive) {
			JSG.idUpdater.addItem(this);
		}

		// assign new ids to sub items:
		this._subItems.forEach((item) => {
			item._assignId(force);
		});
	}

	_assignName(id) {
		let name = this.getShape().getType();

		name = name.charAt(0).toUpperCase() + name.slice(1);
		name = this.getGraph().getUniqueName(name, id);
		this.setName(name);
	}

	/**
	 * Creates a new id.</br>
	 * <b>Note:</b> usually it is not required to call this method from outside.
	 *
	 * @method _createId
	 * @return {Number} A new unique id or <code>undefined</code> if this item was not added to a graph yet.
	 * @private
	 */
	_createId() {
		const graph = this.getGraph();
		return graph !== undefined ? this.newUniqueId() : undefined;
	}

	/**
	 * Returns a new unique id to use for items within this Graph. </br>
	 * Note: the returned id is only unique within the scope of this graph.
	 *
	 * @method newUniqueId
	 * @return {Number} A new id number.
	 */
	newUniqueId() {
		const length = 12;
		const timestamp = Date.now();

		const _getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

		const ts = timestamp.toString();
		const parts = ts.split('').reverse();
		let id = '';

		for (let i = 0; i < length; i += 1) {
			const index = _getRandomInt(0, parts.length - 1);
			id += parts[index];
		}

		return Number(id);
	}

	/**
	 * Removes given item from the list of sub items.<br/>
	 * Note: calling this method has no effect if passed item either has no parent or a different one
	 * than this GraphItem.
	 *
	 * @method removeItem
	 * @param {GraphItem} item The item to remove.
	 */
	removeItem(item) {
		const parent = item.getParent();
		if (parent === this) {
			const event = new Event(Event.ITEMREMOVE, item);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				item._doDispose();
				item._lastParent = item._parent;
				item._parent = undefined;
				if (Arrays.remove(this._subItems, item)) {
					this.sendPostEvent(event);
				}
			}
		}
	}

	_doDispose() {
		// dispose subitems...
		this._subItems.forEach((item) => {
			item._doDispose();
		});
		this.dispose();
	}

	/**
	 * Returns the index of this item within the sub items list of its parent.
	 *
	 * @method getIndex
	 * @return {Number} This items index.
	 */
	getIndex() {
		return this._parent._subItems.indexOf(this);
	}

	/**
	 * Moves this item to the top of its parent sub items list.
	 *
	 * @method moveToTop
	 */
	moveToTop() {
		this.moveToIndex(this._parent._subItems.length - 1);
	}

	/**
	 * Moves this item one place up within the sub items list of its parent.
	 *
	 * @method moveUp
	 */
	moveUp() {
		const index = this._parent._subItems.indexOf(this);
		this.moveToIndex(index + 1);
	}

	/**
	 * Moves this item to the bottom of its parent sub items list.
	 *
	 * @method moveToBottom
	 */
	moveToBottom() {
		this.moveToIndex(0);
	}

	/**
	 * Moves this item one place down within the sub items list of its parent.
	 *
	 * @method moveDown
	 */
	moveDown() {
		const index = this._parent._subItems.indexOf(this);
		this.moveToIndex(index - 1);
	}

	/**
	 * Moves this item to the specified index within the sub items list of its parent.</br>
	 * If the index is out of range calling this method has no effect.
	 *
	 * @method moveToIndex
	 * @param {Number} toIndex The index to move this item to.
	 */
	moveToIndex(toIndex) {
		const subItems = this._parent._subItems;
		const last = subItems.length - 1;
		const index = subItems.indexOf(this);
		if (toIndex >= 0 && toIndex <= last && toIndex !== index) {
			const event = new Event(Event.INDEX, toIndex);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				Arrays.move(subItems, index, toIndex);
				this.sendPostEvent(event);
			}
		}
	}

	/**
	 * Translates given point up from this item to specified item.</br>
	 * After calling this method the given point is relative to the origin of specified item. Note that
	 * no new point is created and that the translation starts at this item parent. This means that the
	 * given point should be relative to this item parent.
	 *
	 * @method getTranslatedPoint
	 * @param {Point} point The point to translate.
	 * @param {GraphItem} toItem The item to translate point to.
	 * @return {Point} The translated point as convenience.
	 */
	getTranslatedPoint(point, toItem) {
		GraphUtils.traverseItemUp(this._parent, toItem, (item) => {
			item.translateToParent(point);
			return true;
		});
		return point;
	}

	/**
	 * Translates given point from item parent.</br>
	 * That means that the item origin is subtracted from given point and any rotation is applied.
	 *
	 * @method translateFromParent
	 * @param {Point} point The point to translate.
	 * @return {Point} The translated point as convenience.
	 */
	translateFromParent(point) {
		// const origin = this.getOrigin(JSG.ptCache.get());
		point.subtract(this._origincache);
		MathUtils.rotatePoint(point, -this._angle.getValue());
		// JSG.ptCache.release(origin);
		return point;
	}

	/**
	 * Translates given point to item parent.</br>
	 * That means that any rotation is applied to given point and item origin is added.
	 *
	 * @method translateToParent
	 * @param {Point} point The point to translate.
	 * @return {Point} The translated point as convenience.
	 */
	translateToParent(point) {
		// const origin = this.getOrigin(JSG.ptCache.get());
		MathUtils.rotatePoint(point, this._angle.getValue());
		point.add(this._origincache);
		// JSG.ptCache.release(origin);
		return point;
	}

	/**
	 * Returns translated shape points, i.e. the shape points are relative to given item.
	 *
	 * @method getTranslatedShapePoints
	 * @param {GraphItem} toItem The item to translate points to.
	 * @param {Array} [reusepoints] An optional array of points to reuse. If not provided a new one will be created.
	 * @return {Array} An array of translated shape points.
	 */
	getTranslatedShapePoints(toItem, reusepoints) {
		const getShapePoints = (shape, lreusepoints) => {
			const shapePoints = lreusepoints !== undefined ? lreusepoints : [];
			let points;
			if (shape instanceof BezierShape) {
				points = shape.getPolygonPointList().getPoints();
			} else {
				points = shape.getPoints();
			}
			Arrays.keep(shapePoints, points.length, Point.Factory);
			points.forEach((point, i) => {
				shapePoints[i].setTo(point);
			});
			return shapePoints;
		};

		const translatedShapePoints = getShapePoints(this._shape, reusepoints);

		const traverse = (item) => {
			translatedShapePoints.forEach((translatedShapePoint) => {
				item.translateToParent(translatedShapePoint);
			});
			return true;
		};

		GraphUtils.traverseItemUp(this, toItem, traverse);

		return translatedShapePoints;
	}

	/**
	 * Returns the translated bounding box of this item.</br>
	 * That means the returned bounding box is relative to given item.
	 *
	 * @method getTranslatedBoundingBox
	 * @param {GraphItem} toItem The item to translate bounding box to.
	 * @param {BoundingBox} [reusebbox] An optional bounding box to reuse. If not provided a new one will
	 *     be created.
	 * @return {BoundingBox} The translated bounding box.
	 * @deprecated use {{#crossLink "GraphUtils.translateBoundingBoxUp:method"}}{{/crossLink}}
	 */
	getTranslatedBoundingBox(toItem, reusebbox) {
		const translatedBBox = this.getBoundingBox(reusebbox);

		function traverse(item) {
			item.translateBoundingBoxToParent(translatedBBox);
			return true;
		}

		GraphUtils.traverseItemUp(this._parent, toItem, traverse);

		return translatedBBox;
	}

	/**
	 * Translates given bounding box to item parent.
	 *
	 * @method _translateBoundingBoxToParent
	 * @param {BoundingBox} bbox The bounding box to translate.
	 * @private
	 * @deprecated use public {{#crossLink
	 *     "GraphItem/translateBoundingBoxToParent:method"}}{{/crossLink}}
	 */
	_translateBoundingBoxToParent(bbox) {
		const topleft = bbox.getTopLeft(new Point(0, 0));
		this.translateToParent(topleft);
		bbox.setTopLeftTo(topleft);
		bbox.rotate(this.getAngle().getValue());
	}

	/**
	 * Translates given bounding box to item parent.
	 *
	 * @method translateBoundingBoxToParent
	 * @param {BoundingBox} bbox The bounding box to translate.
	 * @return {BoundingBox} The passed and now translated bbox as convenience.
	 */
	translateBoundingBoxToParent(bbox) {
		const topleft = bbox.getTopLeft(JSG.ptCache.get());
		this.translateToParent(topleft);
		bbox.setTopLeftTo(topleft);
		bbox.rotate(this.getAngle().getValue());
		JSG.ptCache.release(topleft);
		return bbox;
	}

	/**
	 * Translates given bounding box from this item parent.
	 *
	 * @method translateBoundingBoxFromParent
	 * @param {BoundingBox} bbox The bounding box to translate.
	 * @return {BoundingBox} The passed and now translated bbox as convenience.
	 */
	translateBoundingBoxFromParent(bbox) {
		const topleft = bbox.getTopLeft();
		this.translateFromParent(topleft);
		bbox.setTopLeftTo(topleft);
		bbox.rotate(-this.getAngle().getValue());
		return bbox;
	}

	/**
	 * Checks if given point is within this item bounding box and within the area defined by its inner
	 * shape.</br>
	 * The option find flag can be used to affect the result of this method.
	 *
	 *
	 * @method containsPoint
	 * @param {Point} point The point to test.
	 * @param {Shape.FindFlags} [findFlag] A flag to affect the result.
	 * @return {Boolean} <code>true</code> if item contains given point, <code>false</code> otherwise
	 */
	containsPoint(point, findFlag) {
		if (!point || JSG.scaledFindRadius === undefined) {
			return false;
		}

		const box = JSG.boxCache.get();
		const bbox = this.getBoundingBox(box);

		if (findFlag === Shape.FindFlags.AREAWITHFRAME || findFlag === Shape.FindFlags.BOXWITHFRAME) {
			bbox.expandBy(JSG.scaledFindRadius);
		} else if (findFlag === Shape.FindFlags.INNERAREA) {
			bbox.reduceBy(JSG.scaledFindRadius);
		}

		let contained = bbox.containsPoint(point);
		if ((contained && !this.isCollapsed()) || this._reshapeCoordinates.length) {
			if (findFlag !== Shape.FindFlags.BOXWITHFRAME) {
				if (findFlag === Shape.FindFlags.AREAWITHFRAME) {
					bbox.reduceBy(JSG.scaledFindRadius);
				} else if (findFlag === Shape.FindFlags.INNERAREA) {
					bbox.expandBy(JSG.scaledFindRadius);
				}
				const loc = JSG.ptCache.get();
				loc.setTo(point);
				// translate point to our coordinate system:
				this.translateFromParent(loc);
				contained = this._shape.containsPoint(loc, findFlag);
				JSG.ptCache.release(loc);
			}
		}
		JSG.boxCache.release(box);

		return contained;
	}

	/**
	 * Saves this item using the given writer.</br>
	 * Set the optional <code>absolute</code> parameter to specify if the GraphItem pin and angle should
	 * be saved absolute, i.e. relative to the CoordinateSystem of the Graph which contains this GraphItem.
	 *
	 * @method save
	 * @param {Writer} file Writer to use for saving.
	 * @param {Boolean} [absolute] If set to <code>true</code> the GraphItem pin and angle will be saved
	 * relative to its Graph.
	 */
	save(file, absolute) {
		file.writeStartElement('graphitem');

		if (this.getId() !== undefined) {
			file.writeAttributeString('id', this.getId());
		}
		if (this._parent !== undefined && this._parent.getId() !== undefined) {
			file.writeAttributeString('parentid', this._parent.getId());
		}

		this.saveAttributes(file);

		this._saveAngle(file, absolute);

		if (this._layer.hasFormula() || this._layer.getValue() !== '') {
			this._layer.save('layer', file);
		}
		if (this._type.hasFormula() || this._type.getValue() !== '') {
			this._type.save('type', file);
		}
		if (this._name.hasFormula() || this._name.getValue() !== '') {
			this._name.save('name', file);
		}
		if (this._link.hasFormula() || this._link.getValue() !== '') {
			this._link.save('link', file);
		}
		if (this._tooltip.hasFormula() || this._tooltip.getValue() !== '') {
			this._tooltip.save('tooltip', file);
		}

		this.saveContent(file, absolute);

		file.writeEndElement();
	}

	_saveAngle(file, absolute) {
		let angle = this._angle.getValue();

		function rotate(itm) {
			angle += itm.getAngle().getValue();
		}

		if (absolute === true) {
			const absAngle = this._angle.copy();
			GraphUtils.traverseItemUp(this.getParent(), this.getGraph(), rotate);
			absAngle.setValue(angle);
			if (absAngle.hasFormula() || absAngle.getValue() !== 0) {
				absAngle.save('angle', file, 10);
			}
		} else if (this._angle.hasFormula() || this._angle.getValue() !== 0) {
			this._angle.save('angle', file, 10);
		}
	}

	/**
	 * Saves the content of this item.</br>
	 * Set the optional <code>absolute</code> parameter to specify if the GraphItem pin and angle should
	 * be saved absolute, i.e. relative to the CoordinateSystem of the Graph which contains this GraphItem.</br>
	 * Subclasses can overwrite to perform custom saving but should call this method before.
	 *
	 * @method saveContent
	 * @param {Writer} file Writer object to save to.
	 * @param {Boolean} [absolute] If set to <code>true</code> the GraphItem pin and angle will be saved
	 * relative to its Graph.
	 */
	saveContent(file, absolute) {
		this._pin.save('pin', file, absolute);
		this._size.save('size', file);

		if (this._collapsedSize.getWidth().getValue() !== 1000 || this._collapsedSize.getHeight().getValue() !== 1000) {
			this._collapsedSize.save('collapsedsize', file);
		}

		if (this._reshapeCoordinates.length) {
			file.writeStartElement('rscoordinates');
			file.writeStartArray('c');

			this._reshapeCoordinates.forEach((coordinate) => {
				coordinate.save('c', file);
			});
			file.writeEndArray('c');
			file.writeEndElement();
		}

		this._shape.save('shape', file);

		this._saveSubItems(file);
	}

	_saveSubItems(file) {
		file.writeStartArray('graphitem');

		this._subItems.forEach((item) => {
			item.save(file);
		});

		file.writeEndArray('graphitem');
	}
	readAttributes(reader, object) {
		super.readAttributes(reader, object);
	}

	/**
	 * Reads the given object into the graphitem.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read from. The expected content depends on the reader type.
	 */
	read(reader, object) {
		this._reading = true;

		if (JSG.idUpdater.isActive) {
			JSG.idUpdater.addItem(this);
		}

		this.readAttributes(reader, object);

		this._updateAttributes();

		let id = reader.getAttribute(object, 'id');
		if (id !== undefined) {
			id = Number(id);
			if (id !== undefined) {
				this.setId(id);
			}
		}

		let type;

		reader.iterateObjects(object, (name, subnode) => {
			switch (name) {
				case 'angle':
					this._angle.read(reader, subnode);
					break;
				case 'layer':
					this._layer.read(reader, subnode);
					break;
				case 'type':
					this._type.read(reader, subnode);
					break;
				case 'link':
					this._link.read(reader, subnode);
					break;
				case 'tooltip':
					this._tooltip.read(reader, subnode);
					break;
				case 'shape': {
					type = reader.getAttribute(subnode, 'type');
					const shape = ShapeFactory.createShapeFromString(type);
					if (shape) {
						this.setShapeTo(shape);
						shape.read(reader, subnode);
					}
					break;
				}
				case 'size':
					this._size.read(reader, subnode);
					// after size change we up date bbox cache, so that subsequent call to bbox gets correct values...
					this._updateBoundingBox();
					break;
				case 'collapsedsize':
					this._collapsedSize.read(reader, subnode);
					// after size change we update bbox cache, so that subsequent call to bbox gets correct values...
					this._updateBoundingBox();
					break;
				case 'pin':
					this._pin.read(reader, subnode);
					// after pin change we update origin cache, so that subsequent call to origin gets correct values...
					this._updateOrigin();
					break;
				case 'rscoordinates': {
					const properties = GraphItemProperties;
					let index = 0;
					reader.iterateObjects(subnode, (childname, child) => {
						switch (childname) {
							case 'c': {
								const coordinate = new ReshapeCoordinate();
								coordinate.read(reader, child);
								this._reshapeCoordinates.push(coordinate);
								if (coordinate.getXType() !== ReshapeCoordinate.ReshapeType.RADIAL) {
									if (
										coordinate.getXType() !== ReshapeCoordinate.ReshapeType.NONE &&
										coordinate.getYType() !== ReshapeCoordinate.ReshapeType.NONE
									) {
										this._reshapeProperties.addIndexProperty(
											`${coordinate.getName()}X`,
											properties.getReshapePointX,
											properties.setReshapePointX,
											index
										);
										this._reshapeProperties.addIndexProperty(
											`${coordinate.getName()}Y`,
											properties.getReshapePointY,
											properties.setReshapePointY,
											index
										);
									} else if (coordinate.getXType() !== ReshapeCoordinate.ReshapeType.NONE) {
										this._reshapeProperties.addIndexProperty(
											coordinate.getName(),
											properties.getReshapePointX,
											properties.setReshapePointX,
											index
										);
									} else if (coordinate.getYType() !== ReshapeCoordinate.ReshapeType.NONE) {
										this._reshapeProperties.addIndexProperty(
											coordinate.getName(),
											properties.getReshapePointY,
											properties.setReshapePointY,
											index
										);
									}
								}
								index += 1;
								break;
							}
							default:
								break;
						}
					});
					break;
				}
				case 'graphitem':
				case 'gi': {
					// if(!opts || !opts.async) {
					type = reader.getAttribute(subnode, 'type');
					const graphItem = JSG.graphItemFactory.createItemFromString(type, true);
					if (graphItem) {
						graphItem.read(reader, subnode);
						graphItem._reading = true;
						this.addItem(graphItem);
						graphItem._reading = false;
						this.onReadSubItem(graphItem, this, reader);
					} else {
						JSG.debug.log('Unknown item could not be created during read');
					}
					// }
					break;
				}
				default:
					break;
			}
		});

		// TODO rethink name setting
		const name = reader.getObject(object, 'name');
		if (name !== undefined) {
			this._name.read(reader, name);
		}

		// apply layout:
		this.setLayout(
			this.getLayoutAttributes()
				.getLayout()
				.getValue()
		);

		JSG.graphItemFactory.initReadItem(this);

		this._reading = false;
	}

	/**
	 * Called when XML of given sub-item was read. <br/>
	 * Subclasses can overwrite. Default implementation adjust {{#crossLink
	 * "TextFormatAttributes"}}{{/crossLink}} setting for {{#crossLink
	 * "TextNode"}}{{/crossLink}}s
	 *
	 * @method onReadSubItem
	 * @param {GraphItem} subitem The sub-item which was read.
	 * @param {GraphItem} parent The parent of sub-item.
	 * @param {Reader} reader Reader to use for reading.
	 */
	onReadSubItem(subitem, parent, reader) {
		if (subitem.isTextNode() && subitem.isAssociated()) {
			// default behaviour for text node...
			const tf = subitem.getTextFormat();
			const tfparent = tf.getParent();
			// parent is standard template? => use text format or parent...
			if (!tf._pl && tfparent && tfparent.getName() === TextFormatAttributes.Template_ID) {
				tf.setParent(parent.getTextFormat());
			}
		}
	}

	/**
	 * Tries to find an item with specified id in the parent hierarchy of this item.<br/>
	 * To find a sub-item please check {{#crossLink "GraphItem.getItemById:method"}}{{/crossLink}}.
	 *
	 * @method getParentById
	 * @param {Number} id Id of the parent to find.
	 * @return {GraphItem} the corresponding parent item or <code>undefined</code> if none could be found.
	 * @since 3.0
	 */
	getParentById(id) {
		if (this._parent) {
			return this._parent.getId() === id ? this._parent : this._parent.getParentById(id);
		}
		return undefined;
	}

	/**
	 * Tries to find a sub item of this item by given id.
	 *
	 * @method getItemById
	 * @param {Number} id Id of the item to find.
	 * @return {GraphItem} the corresponding item or <code>undefined</code> if none could be found.
	 */
	getItemById(id) {
		if (this.getId() === id) {
			return this;
		}

		let i;
		let subItem;

		for (i = this._subItems.length - 1; i >= 0; i -= 1) {
			subItem = this._subItems[i].getItemById(id);
			if (subItem !== undefined) {
				return subItem;
			}
		}
		return undefined;
	}

	/**
	 * Tries to find a sub item of this item by given name.
	 *
	 * @method getItemByName
	 * @param {Number} name Name of the item to find.
	 * @return {GraphItem} the corresponding item or <code>undefined</code> if none could be found.
	 */
	getItemByName(name) {
		if (Strings.compare(this.getName().getValue(), name, true)) {
			return this;
		}

		let i;
		let subItem;

		for (i = this._subItems.length - 1; i >= 0; i -= 1) {
			subItem = this._subItems[i].getItemByName(name);
			if (subItem !== undefined) {
				return subItem;
			}
		}
		return undefined;
	}

	/**
	 * Restores ids within expressions of this item sub items.
	 *
	 * @method _restoreConnection
	 * @param {Graph} graph A graph instance used to find any items by ids.
	 * @private
	 */
	_restoreConnections(graph) {
		// seems to be the wrong place for this method :)
		//= > what are connections of a GraphItem??
		//= > move to Utility class?
		const items = this._subItems.slice(0);
		items.forEach((item) => {
			if (item) {
				item._restoreConnections(graph);
			}
		});
	}

	// overwritten to handle text format and pin changes...
	sendPostEvent(event) {
		this.setRefreshNeeded(true);

		// isn't this better placed in corresponding controller?
		const ID = Event;
		switch (event.id) {
			case ID.PIN:
				if (this.isRefreshEnabled()) {
					this.refresh();
				} else {
					// we have to update our origin & bbox caches even if refresh is disabled!
					//= > important for listeners (e.g. BBoxListener) which requires an up to date bbox...
					this._update();
				}
				break;
			case ID.ATTRIBUTE:
				if (event.detailId === AttributeChangeEvent.VALUE) {
					if (event.isCategory(TextFormatAttributes.NAME)) {
						// check for font changes...
						this._subItems.forEach((item) => {
							if (item.isTextNode() && item.isAssociated()) {
								item.invalidateSize();
							}
						});
					} else if (event.isCategory(ItemAttributes.NAME)) {
						this._updateAttributes();
						let doUpdate = false;
						const attr = event.getAttribute();
						if (attr.getName() === ItemAttributes.COLLAPSED) {
							doUpdate = true;
						}
						if (doUpdate) {
							this._update();
						}
					}
				}
				break;
			default:
				break;
		}
		super.sendPostEvent(event);
	}

	/**
	 * Returns the TextNode found at specified location. If no location is provided or if no TextNode contains provided
	 * location the first TextNode found is returned as default.<br/>
	 * Note: only the sub items of this item are checked! This method returns <code>undefined</code> if no TextNode
	 * could be found.
	 *
	 * @method getTextSubItem
	 * @param {Point} [loc] A location relative to this item.
	 * @return {TextNode} A TextNode or <code>undefined</code> if none could be found.
	 */
	getTextSubItem(loc) {
		let firstitem;

		for (let i = 0; i < this._subItems.length; i += 1) {
			const item = this._subItems[i];
			if (item.isTextNode() && item.isAssociated()) {
				if (!loc || item.containsPoint(loc)) {
					return item;
				}
				firstitem = firstitem || item;
			}
		}

		return firstitem;
	}

	getEditableTextSubItem() {
		for (let i = 0, n = this._subItems.length; i < n; i += 1) {
			const item = this._subItems[i];
			if (item.isTextNode() && item.isAssociated() && item.isEditLabelAllowed()) {
				return item;
			}
		}

		return undefined;
	}

	/**
	 * Disables execution of GraphItems <code>refresh</code> function.
	 *
	 * @method disableRefresh
	 * @deprecated This method is currently under review!
	 */
	disableRefresh() {
		this._refreshEnabled = false;
	}

	/**
	 * Enables execution of GraphItems <code>refresh</code> function.
	 *
	 * @method enableRefresh
	 * @param {Boolean} [execute] If set to <code>true</code> the refresh function is called immediately.
	 * @deprecated This method is currently under review!
	 */
	enableRefresh(execute) {
		this._refreshEnabled = true;
		if (execute === true) {
			this.refresh();
		}
	}

	/**
	 * Returns if refresh is enabled or disabled. Disabled means that a call to <code>refresh</code>
	 * has no effect if it is not forced.
	 *
	 * @method isRefreshEnabled
	 * @return {Boolean} <code>true</code> if refresh is enabled, <code>false</code> otherwise.
	 */
	isRefreshEnabled() {
		return this._refreshEnabled;
	}

	isRefreshNeeded() {
		return this._refreshNeeded;
	}

	setRefreshNeeded(flag) {
		this._refreshNeeded = flag;

		this._subItems.forEach((item) => {
			if (item) {
				item.setRefreshNeeded(flag);
			}
		});
	}

	/**
	 * Refreshes this item.</br>
	 * This method can be used to update any used cache. <b>Note:</b> the framework assumes that after
	 * calling this method this item and all of its sub items are up to date!
	 *
	 * @method refresh
	 * @param {Boolean} [force] If set to <code>true</code> refresh sends an event even if inner cache was not changed.
	 */
	refresh(force) {
		if (this._refreshEnabled === true || force === true) {
			// this._isStale = false;
			this._doRefresh(force);
		}
	}

	_getGrandParent() {
		const parent = this.getParent();
		return parent ? parent.getParent() : undefined;
	}

	_doRefresh(force) {
		if (this.isRefreshNeeded()) {
			if (
				this.getItemAttributes()
					.getViewMode()
					.getValue() === 2
			) {
				if (this._oldBoundingBox === undefined) {
					this._oldBoundingBox = this.getBoundingBox();
				}
				// TODO (MR please review) is it really always wanted to reference grandparent here?
				const grandparent = this._getGrandParent();
				if (grandparent) this.setSizeTo(grandparent.getSize().copy());

				this.setOrigin(0, 0);
				this.layout();
			} else if (this._oldBoundingBox) {
				this.setBoundingBoxTo(this._oldBoundingBox);
				this._oldBoundingBox = undefined;
			}
			const changed = this._update();
			if (changed || force === true) {
				const event = GraphItem._tmpEvent;
				event.source = this;
				event.isForced = !changed;
				this.sendPostEvent(event);
			}
			this._shape.refresh();
		}
		this._refreshSubItems(force);
	}

	_refreshSubItems(...args) {
		// simply run through subitems...
		this._subItems.forEach((item) => {
			item.refresh(...args);
		});
	}

	/**
	 * Updates inner cache.
	 *
	 * @method _update
	 * @return {Boolean} <code>true</code> if cache changed, <code>false</code> otherwise.
	 * @private
	 */
	_update() {
		this._updateAttributes();
		let changed = this._updateOrigin();
		changed = this._updateBoundingBox() || changed;
		return changed;
	}

	/**
	 * Recalculates, the cached origin of this graph item.
	 *
	 * @method _updateOrigin
	 * @return {Boolean} <code>true</code> if cache changed, <code>false</code> otherwise.
	 * @private
	 */
	_updateOrigin() {
		const pin = this._pin.getPoint(JSG.ptCache.get());
		let localpin = this._pin.getLocalPoint(JSG.ptCache.get());
		localpin = MathUtils.rotatePoint(localpin, this._angle.getValue());
		pin.subtract(localpin);
		const ret = pin.isEqualTo(this._origincache, 0.1);
		if (!ret) {
			this._origincache.setTo(pin);
		}
		JSG.ptCache.release(pin, localpin);
		return !ret;
	}

	/**
	 * Recalculates, the cached bounding box of this graph item.
	 *
	 * @method _updateBoundingBox
	 * @return {Boolean} <code>true</code> if cache changed, <code>false</code> otherwise.
	 * @private
	 */
	_updateBoundingBox() {
		const size = this.getSizeAsPoint(JSG.ptCache.get());
		const oldbbox = JSG.boxCache.get().setTo(this._bboxcache);

		this._bboxcache.setTopLeftTo(this._origincache);
		this._bboxcache.setSizeTo(size);
		this._bboxcache.setAngle(this._angle.getValue());

		JSG.ptCache.release(size);
		JSG.boxCache.release(oldbbox);

		return !oldbbox.isEqualTo(this._bboxcache, 0.1);
	}

	addAttribute(attribute) {
		this._attrCache = {};
		return super.addAttribute(attribute);
	}

	updateSubAttributes() {
		this._updateAttributes();
		this._subItems.forEach((subItem) => {
			subItem.updateSubAttributes();
		});
	}

	_updateAttributes() {
		this._attrCache.format = this.getModelAttributes().getAttribute(FormatAttributes.NAME);
		this._attrCache.itemAttributes = this.getModelAttributes().getAttribute(ItemAttributes.NAME);

		// set to undefined in order for funcs not to use cache
		this._attrCache.visible = undefined;
		this._attrCache.itemvisible = undefined;
		this._attrCache.collapsable = undefined;
		this._attrCache.collapsed = undefined;
		this._attrCache.selectable = undefined;

		this._attrCache.visible = this.isVisible();
		this._attrCache.itemvisible = this.isItemVisible();
		this._attrCache.collapsable = this.isCollapsable();
		this._attrCache.collapsed = this.isCollapsed();
		this._attrCache.selectable = this.isSelectable();
	}

	/**
	 * Sets the <code>Layout</code> to use for this item. Passing <code>undefined</code> will remove current layout.
	 *
	 * @method setLayout
	 * @param {Layout|String} layout Either a <code>Layout</code> instance or a layout type.
	 * @since 1.6.18
	 */
	setLayout(layout) {
		// unregister will remove layout attributes on read, so simply check...
		if (this._layout && !this._reading) {
			// unregister from old layout
			this._layout.unregister(this);
		}
		layout = typeof layout === 'string' ? JSG.layoutFactory.getLayout(layout, this) : layout;
		this._layout = layout ? layout.register(this) : undefined;
	}

	/**
	 * Returns currently registered <code>Layout</code> or <code>undefined</code> if no layout was set.
	 *
	 * @method getLayout
	 * @return {Layout} The currently registered layout or <code>undefined</code>.
	 * @since 1.6.18
	 */
	getLayout() {
		return this._layout;
	}

	/**
	 * Returns the settings object for currently registered <code>Layout</code> or <code>undefined</code> if no layout
	 * was set. In case of API defined layouts the settings object is usually an instance of {{#crossLink
	 * "Settings"}}{{/crossLink}}.
	 *
	 * @method getLayoutSettings
	 * @return {Object} The settings object or <code>undefined</code>.
	 * @since 2.1.0.8
	 */
	getLayoutSettings() {
		return this._layout && this._layout.getSettings(this);
	}

	setSelectionId(id) {
		this._selectionId = id;
	}

	getSelectionId() {
		return this._selectionId || 'global';
	}

	setSelection(id, data) {
		let list = this.getModelAttributes().getAttribute('selection');

		if (list === undefined) {
			list = new AttributeList('selection');
			this.addAttribute(list);
		}

		list.addAttribute(new Attribute(String(id), data));
	}

	getSelection(id) {
		const list = this.getModelAttributes().getAttribute('selection');

		if (list === undefined) {
			return undefined;
		}

		return list.getAttribute(String(id));
	}

	getSelectionList() {
		return this.getModelAttributes().getAttribute('selection');
	}

	removeSelection(id) {
		const list = this.getModelAttributes().getAttribute('selection');

		if (list === undefined) {
			return;
		}

		const attr = list.getAttribute(String(id));
		if (attr !== undefined) {
			list.removeAttribute(attr);
		}
	}

	isReading() {
		return this._isReading;
	}

	assignIdsToChildren(item, lid) {
		item.getItems().forEach((subItem) => {
			subItem._id = lid;
			lid += 1;
			lid = subItem.assignIdsToChildren(subItem, lid);
		});

		return lid;
	}

	isTextNode() {
		return this._paras;
	}

	get expressions() {
		return [];
	}

	static get _tmpEvent() {
		return _tmpEvent;
	}
}

module.exports = GraphItem;
