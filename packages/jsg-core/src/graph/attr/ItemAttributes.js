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
const AttributeList = require('./AttributeList');
const BooleanAttribute = require('./BooleanAttribute');
const NumberAttribute = require('./NumberAttribute');
const RangeConstraint = require('../expr/RangeConstraint');
const StringAttribute = require('./StringAttribute');
const Attribute = require('./Attribute');


const NAME = 'graphitem';
const TemplateID = 'ItemAttributes.Template';

/**
 * PortMode definitions. The PortMode defines where a port can be created and an edge can be attached, while hovering
 * over a GraphItem, visualized by a red circle.
 * @class PortMode
 */
const PortMode = {
	/**
	 * No port creation is offered.
	 * @property NONE
	 * @final
	 * @static
	 * @type {Number}
	 */
	NONE: 0,
	/**
	 * A port is offered at any point on the shape lines or curves.
	 * @property SHAPE
	 * @final
	 * @static
	 * @type {Number}
	 */
	SHAPE: 2,
	/**
	 * A port is offered at the center of the shape.
	 * @property CENTER
	 * @final
	 * @static
	 * @type {Number}
	 */
	CENTER: 4,
	/**
	 * A port is offered at the centers of the sides of the the bounding rectangle.
	 * @property SIDESCENTER
	 * @final
	 * @static
	 * @type {Number}
	 */
	SIDESCENTER: 8,
	/**
	 * A port is offered at the 1/4th, the center and 3/4th of the sides of the bounding rectangle.
	 * @property SIDESQUARTER
	 * @final
	 * @static
	 * @type {Number}
	 */
	SIDESQUARTER: 16,
	CENTERSTARTATSIDE: 32,
	/**
	 * A port is offered at the corners of the bounding rectangle.
	 * @property CORNERS
	 * @final
	 * @static
	 * @type {Number}
	 */
	CORNERS: 64,
	/**
	 * A port is offered at each definition point of the polygon.
	 * @property POINTS
	 * @final
	 * @static
	 * @type {Number}
	 */
	POINTS: 128,
	/**
	 * A port is offered in the middle of each line of the polygon.
	 * @property LINECENTER
	 * @final
	 * @static
	 * @type {Number}
	 */
	LINESCENTER: 256,
	/**
	 * A port is offered at each definition point of the shape
	 * and in the middle between two definition points.
	 * @property DEFAULT
	 * @final
	 * @static
	 * @type {Number}
	 */
	DEFAULT: 384,
	/**
	 * A combination of all port modes.
	 * @property ALL
	 * @final
	 * @static
	 * @type {Number}
	 */
	ALL: 510
};

/**
 * SelectionMode definitions. The SelectionMode defines how a GraphItem can be selected.
 * @class SelectionMode
 */
const SelectionMode = {
	/**
	 * Item can not be selected.
	 * @property NONE
	 * @final
	 * @static
	 * @type {Number}
	 */
	NONE: 0,
	/**
	 * Item can only be selected at be border or frame of the item.
	 * @property BORDER
	 * @final
	 * @static
	 * @type {Number}
	 */
	BORDER: 1,
	/**
	 * Item can only be selected by clicking in the area of the object.
	 * @property AREA
	 * @final
	 * @static
	 * @type {Number}
	 */
	AREA: 2,
	/**
	 * How item can be selected is defined by the framework. In general items are selected, if clicked with the area
	 * of the GraphItem. If the FillStyle is set to NONE, the item can only be selected at the border.
	 * @property DEFAULT
	 * @final
	 * @static
	 * @type {Number}
	 */
	DEFAULT: 4,
	/**
	 * The parent item of this item is selected, if the item is hit.
	 * @property SELECTPARENT
	 * @final
	 * @static
	 * @type {Number}
	 */
	SELECTPARENT: 8
};

/**
 * The direction defines if and how a GraphItem can be moved in addition to the direction flags.
 * @class Moveable
 */
const Moveable = {
	/**
	 * Moving is disabled.
	 * @property NONE
	 * @final
	 * @static
	 * @type {Number}
	 */
	NONE: 0,
	/**
	 * Only moveable in the vertical direction.
	 * @property VERTICAL
	 * @final
	 * @static
	 * @type {Number}
	 */
	VERTICAL: 1,
	/**
	 * Only moveable in the horizontal direction.
	 * @property HORIZONTAL
	 * @final
	 * @static
	 * @type {Number}
	 */
	HORIZONTAL: 2,
	/**
	 * Moveable in both directions.
	 * @property BOTH
	 * @final
	 * @static
	 * @type {Number}
	 */
	BOTH: 3,
	/**
	 * Moveable: Moving is limited to the parent container. The parent can also not be changed.
	 * @property LIMITTOCONTAINER
	 * @final
	 * @static
	 * @type {Number}
	 */
	LIMITTOCONTAINER: 4,
	ALL: 7
};

/**
 * The direction defines if and how a GraphItem expands and collapses.
 * @class Direction
 */
const Direction = {
	/**
	 * Collapsible: Collapsing is not enabled.
	 * AlwaysVisible: Invalid flag.
	 * Moveable: Moving is disabled.
	 * @property NONE
	 * @final
	 * @static
	 * @type {Number}
	 */
	NONE: 0,
	/**
	 * Collapsible: Collapsing is enabled and the item collapses in the vertical dimension
	 * AlwaysVisible: In the vertical direction.
	 * Moveable: Only moveable in the vertical direction.
	 * @property VERTICAL
	 * @final
	 * @static
	 * @type {Number}
	 */
	VERTICAL: 1,
	/**
	 * Collapsible: Collapsing is enabled and the item collapses in the horizontal dimension
	 * AlwaysVisible: In the horizontal direction.
	 * Moveable: Only moveable in the horizontal direction.
	 * @property HORIZONTAL
	 * @final
	 * @static
	 * @type {Number}
	 */
	HORIZONTAL: 2,
	/**
	 * Collapsing is enabled and the item collapses in both dimensions.
	 * AlwaysVisible: Invalid flag.
	 * Moveable: Moveable in both directions.
	 * @property BOTH
	 * @final
	 * @static
	 * @type {Number}
	 */
	BOTH: 3
};

/**
 * The ButtonPosition defines where the collapse button is visualized, if collapsing is enabled.
 * @class ButtonPosition
 */
const ButtonPosition = {
	/**
	 * The collapse button is displayed in the top left corner of the GraphItem.
	 * @property TOPLEFT
	 * @final
	 * @static
	 * @type {Number}
	 */
	TOPLEFT: 0,
	/**
	 * The collapse button is displayed in the top right corner of the GraphItem.
	 * @property TOPRIGHT
	 * @final
	 * @static
	 * @type {Number}
	 */
	TOPRIGHT: 1,
	/**
	 * The collapse button is displayed at the top center of the GraphItem.
	 * @property TOPCENTER
	 * @final
	 * @static
	 * @type {Number}
	 */
	TOPCENTER: 2,
	/**
	 * The collapse button is displayed at the bottom center of the GraphItem.
	 * @property BOTTOMCENTER
	 * @final
	 * @static
	 * @type {Number}
	 */
	BOTTOMCENTER: 3
};

/**
 * Supported edit mask flags. Used to adjust edit behaviour of a {{#crossLink
 * "GraphItem"}}{{/crossLink}}.
 * @class EditMask
 */
const EditMask = {
	/**
	 * Signals no edit restriction, i.e. all properties of a {{#crossLink "GraphItem"}}{{/crossLink}}
	 * can be edited.</br> See {{#crossLink "ItemAttributes/setEditMask:method"}}{{/crossLink}}.
	 * @property NONE
	 * @final
	 * @static
	 * @type {Number}
	 */
	NONE: 0,
	/**
	 * If set the coordinates of a {{#crossLink "GraphItem"}}{{/crossLink}} cannot be edited.</br>
	 * See {{#crossLink "ItemAttributes/setEditMask:method"}}{{/crossLink}}.
	 * @property COORDINATES
	 * @final
	 * @static
	 * @type {Number}
	 */
	COORDINATES: 1,
	/**
	 * If set the inner label of a {{#crossLink "GraphItem"}}{{/crossLink}} cannot be edited.</br>
	 * See {{#crossLink "ItemAttributes/setEditMask:method"}}{{/crossLink}}.
	 * @property LABEL
	 * @final
	 * @static
	 * @type {Number}
	 */
	LABEL: 2,
	/**
	 * Supresses the automatic creation of a TextNode upon pushind the F2 button, if this flag is set.</br>
	 * See {{#crossLink "ItemAttributes/setEditMask:method"}}{{/crossLink}}.
	 * @property ADDLABEL
	 * @final
	 * @static
	 * @type {Number}
	 * @since 2.0.22.5
	 */
	ADDLABEL: 4
	/*
	 TODO to come...
	 ROTATE : 4,
	 SIZE : 8,
	 DELETE : 16
	 */
};

/**
 * Predefined flags to influence an edge {{#crossLink "Layout"}}{{/crossLink}} behavior.</br>
 * E.g. these flags are used as a <code>behavior</code> setting for an {{#crossLink
 * "OrthogonalLayout"}}{{/crossLink}}.
 *
 * @class LineBehavior
 * @static
 */
const LineBehavior = {
	/**
	 * Use this flag to let the layout algorithm completely decide how to arrange the shape coordinates.
	 *
	 * @property AUTO
	 * @type String
	 * @static
	 */
	AUTO: 'Auto',
	/**
	 * Use this flag to perform a kind of manual layout, i.e. the layout algorithm keeps all edge points with minimal
	 * point adjustment.
	 *
	 * @property MANUAL
	 * @type String
	 * @static
	 */
	MANUAL: 'Manual',
	/**
	 * Using this flag the layout algorithm tries to enter attached node horizontally.<br/>
	 * This is most useful if edge is attached to a center port.
	 *
	 * @property HORIZONTAL
	 * @type String
	 * @static
	 */
	HORIZONTAL: 'Horizontal',
	/**
	 * Using this flag the layout algorithm tries to enter attached node vertically.<br/>
	 * This is most useful if edge is attached to a center port.
	 *
	 * @property VERTICAL
	 * @type String
	 * @static
	 */
	VERTICAL: 'Vertical',

	/**
	 * Using this flag will disable any edge layout, i.e. neither automatic layout nor any point
	 * adjustment is done. Note: this may cause unwanted effects, e.g. an orthogonal edge might become none orthogonal.
	 *
	 * @property DISABLED
	 * @type String
	 * @static
	 */
	DISABLED: 'Disabled'
};

/**
 * This AttributeList defines default attributes for each {{#crossLink "GraphItem"}}{{/crossLink}}.
 * <b>Note:</b> each setter method has an optional GraphItem parameter. If this is set the Attribute value
 * change is done via passed GraphItem and an {{#crossLink
 * "AttributeChangeEvent"}}{{/crossLink}} is raised.
 *
 * @class ItemAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined item attributes.
 */
class ItemAttributes extends AttributeList {
	constructor(mapExpr) {
		super(ItemAttributes.NAME, mapExpr);
		this.setParent(ItemAttributes.template);
	}

	newInstance(mapExpr) {
		return new ItemAttributes(mapExpr);
	}

	getClassString() {
		return 'ItemAttributes';
	}

	static get PortMode() {
		return PortMode;
	}

	static get SelectionMode() {
		return SelectionMode;
	}

	static get LineBehavior() {
		return LineBehavior;
	}

	static get EditMask() {
		return EditMask;
	}

	static get ButtonPosition() {
		return ButtonPosition;
	}

	static get Moveable() {
		return Moveable;
	}

	static get Direction() {
		return Direction;
	}

	/**
	 * Defines whether the children or subitems of a container get clipped, if they are located outside the border of
	 * the container.<br/> Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setClipChildren
	 * @param {BooleanExpression | Boolean} clipchildren True to enable the flag, otherwise false. You can pass
	 *     either an expression or a value. The value will automatically converted into
	 */
	setClipChildren(clipchildren) {
		this.setAttribute(ItemAttributes.CLIPCHILDREN, clipchildren);
	}

	/**
	 * Returns the attribute the ClipChildren flag. The flag defines whether the children or subitems of a container
	 * get clipped, if they are located outside the border of the container.
	 *
	 * @method getClipChildren
	 * @return {Attribute} Attribute with current setting for ClipChildren.
	 */
	getClipChildren() {
		return this.getAttribute(ItemAttributes.CLIPCHILDREN);
	}

	/**
	 * Defines, whether a GraphItem gets closed. This applies primarily to polylines and bezier curves.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setClosed
	 * @param {BooleanExpression | Boolean} closed True to enable the flag, otherwise false. You can pass
	 *     either an expression or a value. The value will automatically converted into
	 */
	setClosed(closed) {
		this.setAttribute(ItemAttributes.CLOSED, closed);
	}

	/**
	 * Returns the attribute for the Closed flag. The flag defines whether an item is displayed as closed.
	 *
	 * @method getClosed
	 * @return {Attribute} Attribute with current setting for Closed.
	 */
	getClosed() {
		return this.getAttribute(ItemAttributes.CLOSED);
	}

	/**
	 * Defines, whether and how a GraphItem can be collapsed and expanded.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setCollapsable
	 * @param {BooleanExpression | ItemAttributes.Direction} collapsable Collapse setting. There are
	 *     different options for the collapsable behaviour.
	 */
	setCollapsable(collapsable) {
		this.setAttribute(ItemAttributes.COLLAPSABLE, collapsable);
	}

	/**
	 * Returns the attribute for the Collapsable flag. The flag defines whether and how an item can be collapsed or
	 * expanded.
	 *
	 * @method getCollapsable
	 * @return {Attribute} Attribute with current setting for Collapsable.
	 */
	getCollapsable() {
		return this.getAttribute(ItemAttributes.COLLAPSABLE);
	}

	/**
	 * Defines, whether and how a GraphItem behaves, if it is collapsed. If this value is set to 0, which is default,
	 * the item is hidden and if it the value is set to one, it remains visible.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setCollapseBehaviour
	 * @param {BooleanExpression | ItemAttributes.Direction} behaviour Collapse behaviour setting.
	 * @since 3.0
	 */
	setCollapseBehaviour(behaviour) {
		this.setAttribute(ItemAttributes.COLLAPSEBEHAVIOUR, behaviour);
	}

	/**
	 * Returns the attribute for the Collapsa behaviour. The flag defines whether and how an item behaves, if collapsed.
	 *
	 * @method getCollapseBehaviour
	 * @return {Attribute} Attribute with current setting for Collapsa behaviour.
	 * @since 3.0
	 */
	getCollapseBehaviour() {
		return this.getAttribute(ItemAttributes.COLLAPSEBEHAVIOUR);
	}

	/**
	 * Defines, whether a GraphItem is collapsed and expanded.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setCollapsed
	 * @param {BooleanExpression | Boolean} collapsed Collapsed setting. True to collapse the item, otherwise
	 *     false.
	 */
	setCollapsed(collapsed) {
		this.setAttribute(ItemAttributes.COLLAPSED, collapsed);
	}

	/**
	 * Returns the attribute for the Collapsed flag. The flag defines whether an item is collapsed or expanded.
	 *
	 * @method getCollapsed
	 * @return {Attribute} Attribute with current setting for Collapsed.
	 */
	getCollapsed() {
		return this.getAttribute(ItemAttributes.COLLAPSED);
	}

	/**
	 * Defines, the view mode of a GraphItem.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setViewMode
	 * @param {BooleanExpression | Number} mode ViewMode setting.
	 * @since 3.0
	 */
	setViewMode(mode) {
		this.setAttribute(ItemAttributes.VIEWMODE, mode);
	}

	/**
	 * Returns the attribute for the Viewmode flag. The flag defines whether an item is maximized, minimized of normal.
	 *
	 * @method getViewMode
	 * @return {Attribute} Attribute with current setting for the viewmode.
	 * @since 3.0
	 */
	getViewMode() {
		return this.getAttribute(ItemAttributes.VIEWMODE);
	}

	/**
	 * Defines, where the collapse/expand button is displayed.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setCollapsedButton
	 * @param {BooleanExpression | ItemAttributes.ButtonPosition} collapsedButton CollapsedButton
	 *     setting. They are different position available as defined in ButtonPosition
	 */
	setCollapsedButton(collapsedButton) {
		this.setAttribute(ItemAttributes.COLLAPSEDBUTTON, collapsedButton);
	}

	/**
	 * Returns the attribute for the CollapsedButton flag. The setting defines where the collapse/expand button is
	 * displayed.
	 *
	 * @method getCollapsedButton
	 * @return {Attribute} Attribute with current setting for CollapsedButton.
	 */
	getCollapsedButton() {
		return this.getAttribute(ItemAttributes.COLLAPSEDBUTTON);
	}

	/**
	 * Defines whether the user can drag other or new items into this item becoming part of the GraphItem as a
	 * subitems. Subitems are moved are managed with the container.<br/> Note: if this AttributeList is attached to a
	 * GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setContainer
	 * @param {BooleanExpression | Boolean} collapsed Container setting. True to define item as a container,
	 *     otherwise false.
	 */
	setContainer(container) {
		this.setAttribute(ItemAttributes.CONTAINER, container);
	}

	/**
	 * Returns the attribute for the container flag status.
	 *
	 * @method getContainer
	 * @return {Attribute} Attribute with current setting for Container status.
	 */
	getContainer() {
		return this.getAttribute(ItemAttributes.CONTAINER);
	}

	/**
	 * Defines, whether an item can be deleted by the user. API calls to delete the item are still allowed.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setDeleteable
	 * @param {BooleanExpression | Boolean} collapsed Deleteable setting. True to allow deleting, otherwise
	 *     false.
	 */
	setDeleteable(deleteable) {
		this.setAttribute(ItemAttributes.DELETEABLE, deleteable);
	}

	/**
	 * Returns the attribute for the Deleteable flag status.
	 *
	 * @method getDeleteable
	 * @return {Attribute} Attribute with current setting for Deleteable flag.
	 */
	getDeleteable() {
		if (JSG.itemAttributesHandler) {
			const attr = JSG.itemAttributesHandler(
				ItemAttributes.DELETEABLE,
				this.getAttributeList().item
			);
			if (attr) {
				return attr;
			}
		}

		return this.getAttribute(ItemAttributes.DELETEABLE);
	}

	/**
	 * Defines, whether an item can be moved by the user using a direction definition. API calls to move the item are
	 * still allowed.<br/> Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setMoveable
	 * @param {BooleanExpression | ItemAttributes.Direction} moveable Moveable setting.
	 */
	setMoveable(moveable) {
		this.setAttribute(ItemAttributes.MOVEABLE, moveable);
	}

	/**
	 * Returns the attribute for the Moveable direction allowed setting.
	 *
	 * @method getMoveable
	 * @return {Attribute} Attribute with current setting for Moveable.
	 */
	getMoveable() {
		if (JSG.itemAttributesHandler) {
			const attr = JSG.itemAttributesHandler(
				ItemAttributes.MOVEABLE,
				this.getAttributeList().item
			);
			if (attr) {
				return attr;
			}
		}

		return this.getAttribute(ItemAttributes.MOVEABLE);
	}

	/**
	 * Defines the port mode for the item. The port mode describes where a port can be created, if the user hovers with
	 * the mouse over the item.<br/> Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a
	 * corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setPortMode
	 * @param {BooleanExpression | ItemAttributes.PortMode} portMode PortMode setting.
	 * The different options are described at {{#crossLink "ItemAttributes.PortMode"}}{{/crossLink}}.
	 */
	setPortMode(portMode) {
		this.setAttribute(ItemAttributes.PORTMODE, portMode);
	}

	/**
	 * Returns the PortMode attribute. The port mode describes where a port can be created, if the user hovers with the
	 * mouse over the item.
	 *
	 * @method getPortMode
	 * @return {Attribute} Attribute with current setting for the PortMode setting.
	 * The different options are described at {{#crossLink "ItemAttributes.PortMode"}}{{/crossLink}}.
	 */
	getPortMode() {
		return this.getAttribute(ItemAttributes.PORTMODE);
	}

	/**
	 * Defines, whether an item can be rotated by the user.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setRotatable
	 * @param {BooleanExpression | Boolean} rotatable Rotatable setting. True to allow rotation, otherwise
	 *     false.
	 */
	setRotatable(rotatable) {
		this.setAttribute(ItemAttributes.ROTATABLE, rotatable);
	}

	/**
	 * Returns the attribute for the Rotatable flag status.
	 *
	 * @method getRotatable
	 * @return {Attribute} Attribute with current setting for Rotatable flag.
	 */
	getRotatable() {
		if (JSG.itemAttributesHandler) {
			const attr = JSG.itemAttributesHandler(
				ItemAttributes.ROTATABLE,
				this.getAttributeList().item
			);
			if (attr) {
				return attr;
			}
		}

		return this.getAttribute(ItemAttributes.ROTATABLE);
	}

	/**
	 * Defines the SelectionMode. The selection mode defines, how and where items are selectable.
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setSelectionMode
	 * @param {BooleanExpression | ItemAttributes.SelectionMode} selectionMode SelectionMode setting.
	 * The different options are described at {{#crossLink "ItemAttributes.SelectionMode"}}{{/crossLink}}.
	 */
	setSelectionMode(selectionMode) {
		this.setAttribute(ItemAttributes.SELECTIONMODE, selectionMode);
	}

	/**
	 * Returns the SelectionMode attribute. The selection mode defines, how and where items are selectable.
	 *
	 * @method getSelectionMode
	 * @return {Attribute} Attribute with current setting for the SelectionMode setting.
	 * The different options are described at {{#crossLink "ItemAttributes.SelectionMode"}}{{/crossLink}}.
	 */
	getSelectionMode() {
		if (JSG.itemAttributesHandler) {
			const attr = JSG.itemAttributesHandler(
				ItemAttributes.SELECTIONMODE,
				this.getAttributeList().item
			);
			if (attr) {
				return attr;
			}
		}

		return this.getAttribute(ItemAttributes.SELECTIONMODE);
	}

	setSelectParentFirst(mode) {
		let current = this.getSelectionMode().getValue();
		if (mode) {
			current |= ItemAttributes.SelectionMode.SELECTPARENT;
		} else {
			current &= ~ItemAttributes.SelectionMode.SELECTPARENT;
		}
		this.setSelectionMode(current);
	}

	/**
	 * Checks if given selection mode is set.
	 * @method hasSelectionMode
	 * @param {Number} mode One of the predefined {{#crossLink "ItemAttributes.SelectionMode"}}{{/crossLink}}s.
	 * @return {Boolean} Returns <code>true</code> if specified mode is set, <code>false</code> otherwise.
	 * @since 2.0.22.5
	 */
	hasSelectionMode(mode) {
		const selectionmode = this.getSelectionMode().getValue();
		return !!(selectionmode & mode);
	}

	setSelected(selected) {
		this.setAttribute(ItemAttributes.SELECTED, selected);
	}

	getSelected() {
		return this.getAttribute(ItemAttributes.SELECTED);
	}

	/**
	 * Defines, whether an item can be resized by the user.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setSizeable
	 * @param {BooleanExpression | Boolean} sizeable Sizeable setting. True to allow resizing, otherwise false.
	 */
	setSizeable(sizeable) {
		this.setAttribute(ItemAttributes.SIZEABLE, sizeable);
	}

	/**
	 * Returns the attribute for the Sizeable flag status.
	 *
	 * @method getSizeable
	 * @return {Attribute} Attribute with current setting for the Sizeable flag.
	 */
	getSizeable() {
		if (JSG.itemAttributesHandler) {
			const attr = JSG.itemAttributesHandler(
				ItemAttributes.SIZEABLE,
				this.getAttributeList().item
			);
			if (attr) {
				return attr;
			}
		}

		return this.getAttribute(ItemAttributes.SIZEABLE);
	}

	/**
	 * Set the SnapTo flag status. The Snap defines whether the border of this item is used for aligning other items as
	 * a guideline while moving it.<br/> Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a
	 * corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setSnapTo
	 * @param {BooleanExpression | Boolean} snapTo Expression or flag with current setting for the SnapTo flag.
	 */
	setSnapTo(snapTo) {
		this.setAttribute(ItemAttributes.SNAPTO, snapTo);
	}

	/**
	 * Returns the attribute for the SnapTo flag status. The Snap defines whether the border of this item is used for
	 * aligning other items as a guideline while moving it.
	 *
	 * @method getSnapTo
	 * @return {Attribute} Attribute with current setting for the SnapTo flag.
	 */
	getSnapTo() {
		return this.getAttribute(ItemAttributes.SNAPTO);
	}

	/**
	 * Defines, whether an item is visible.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setVisible
	 * @param {BooleanExpression | Boolean} visible Visible setting. True to make the item visible otherwise
	 *     false.
	 */
	setVisible(visible) {
		this.setAttribute(ItemAttributes.VISIBLE, visible);
	}

	/**
	 * Returns the attribute for the Visible flag status.
	 *
	 * @method getVisible
	 * @return {Attribute} Attribute with current setting for the Visible flag.
	 */
	getVisible() {
		return this.getAttribute(ItemAttributes.VISIBLE);
	}

	/**
	 * Defines the left margin of an item.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLeftMargin
	 * @param {NumberExpression | Number} margin Left margin setting in 1/100th mm.
	 */
	setLeftMargin(margin) {
		this.setAttribute(ItemAttributes.MARGINLEFT, margin);
	}

	/**
	 * Returns the attribute for the left margin.
	 *
	 * @method getLeftMargin
	 * @return {Attribute} Attribute with current setting for the left margin.
	 */
	getLeftMargin() {
		return this.getAttribute(ItemAttributes.MARGINLEFT);
	}

	/**
	 * Defines the right margin of an item.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setRightMargin
	 * @param {NumberExpression | Number} margin Right margin setting in 1/100th mm.
	 */
	setRightMargin(margin) {
		this.setAttribute(ItemAttributes.MARGINRIGHT, margin);
	}

	/**
	 * Returns the attribute for the right margin.
	 *
	 * @method getRightMargin
	 * @return {Attribute} Attribute with current setting for the right margin.
	 */
	getRightMargin() {
		return this.getAttribute(ItemAttributes.MARGINRIGHT);
	}

	/**
	 * Defines the top margin of an item.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setTopMargin
	 * @param {NumberExpression | Number} margin Top margin setting in 1/100th mm.
	 */
	setTopMargin(margin) {
		this.setAttribute(ItemAttributes.MARGINTOP, margin);
	}

	/**
	 * Returns the attribute for the top margin.
	 *
	 * @method getTopMargin
	 * @return {Attribute} Attribute with current setting for the top margin.
	 */
	getTopMargin() {
		return this.getAttribute(ItemAttributes.MARGINTOP);
	}

	/**
	 * Defines the bottom margin of an item.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setBottomMargin
	 * @param {NumberExpression | Number} margin Bottom margin setting in 1/100th mm.
	 */
	setBottomMargin(margin) {
		this.setAttribute(ItemAttributes.MARGINBOTTOM, margin);
	}

	/**
	 * Returns the attribute for the bottom margin.
	 *
	 * @method getBottomMargin
	 * @return {Attribute} Attribute with current setting for the bottom margin.
	 */
	getBottomMargin() {
		return this.getAttribute(ItemAttributes.MARGINBOTTOM);
	}

	/**
	 * Defines whether a GraphItem works as a part of another GraphItem and should not be used on itself.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setItemPart
	 * @param {BooleanExpression | Boolean} isPart Item Expression or boolean flag to mark a GraphItem
	 *     as part of another.
	 */
	setItemPart(isPart) {
		this.setAttribute(ItemAttributes.ITEMPART, isPart);
	}

	/**
	 * Retrieve the status of the <code>ITEMPART</code> flag. The flag defines whether an GraphItem is marked
	 * as part of another GraphItem.
	 *
	 * @method getItemPart
	 * @return {Attribute} Attribute with current setting for the current <code>ITEMPART</code> setting.
	 */
	getItemPart() {
		return this.getAttribute(ItemAttributes.ITEMPART);
	}

	/**
	 * Defines an GraphItem edit mask. </br>
	 * The edit mask defines which properties of a GraphItem cannot be edited. Please refer to
	 * {{#crossLink "ItemAttributes.EditMask"}}{{/crossLink}} for supported edit mask values.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setEditMask
	 * @param {NumberExpression | ItemAttributes.EditMask} editmask The new edit mask setting.
	 */
	setEditMask(editmask) {
		this.setAttribute(ItemAttributes.EDITMASK, editmask);
	}

	/**
	 * Gets the current edit mask setting.</br>
	 * The edit mask defines which properties of a GraphItem cannot be edited. Please refer to
	 * {{#crossLink "ItemAttributes.EditMask"}}{{/crossLink}} for supported edit mask values.
	 *
	 * @method getEditMask
	 * @return {Attribute} Attribute with current setting for the current edit mask setting.
	 */
	getEditMask() {
		return this.getAttribute(ItemAttributes.EDITMASK);
	}

	/**
	 * Checks if given edit mask constant is set. </br>
	 * Please refer to {{#crossLink "ItemAttributes.EditMask"}}{{/crossLink}} for supported edit mask values.
	 *
	 * @method hasEditMask
	 * @param {Number} mask The edit constant mask to check.
	 * @return {Boolean} <code>true</code> if given mask is set, <code>false</code> otherwise.
	 */
	hasEditMask(mask) {
		const editmask = this.getAttribute(ItemAttributes.EDITMASK).getValue();
		return (editmask & mask) === mask;
	}

	setScaleType(type) {
		this.setAttribute(ItemAttributes.SCALETYPE, type);
	}

	getScaleType() {
		return this.getAttribute(ItemAttributes.SCALETYPE);
	}

	setScaleShow(flag) {
		this.setAttribute(ItemAttributes.SCALESHOW, flag);
	}

	getScaleShow() {
		return this.getAttribute(ItemAttributes.SCALESHOW);
	}

	static retainFromSelection(selection) {
		function unionCondition(attr1, attr2) {
			return (
				attr1 &&
				attr2 &&
				attr1.getExpression().isEqualTo(attr2.getExpression())
			);
		}

		if (selection.length !== 0) {
			let i;
			let n;
			// copy formats including all template attributes:
			const formats = selection[0]
				.getModel()
				.getItemAttributes()
				.toFlatList();

			for (i = 1, n = selection.length; i < n; i += 1) {
				formats.retainAll(
					selection[i].getModel().getItemAttributes(),
					unionCondition
				);
			}
			return formats;
		}

		return undefined;
	}

	read(reader, object) {
		super.read(reader, object);

		let portMode = this.getPortMode().getValue();
		if (portMode & 1) {
			portMode &= ~1;
			this.setPortMode(portMode & ItemAttributes.PortMode.DEFAULT);
		}
	}

	doSaveParentRef() {
		return (
			this._parent && this._parent.getName() !== ItemAttributes.TemplateID
		);
	}

	/**
	 * Our unique name constant.
	 *
	 * @property NAME
	 * @type {String}
	 * @static
	 */
	static get NAME() {
		return NAME;
	}

	/**
	 * Predefined constant to reference clip children attribute.
	 *
	 * @property CLIPCHILDREN
	 * @type {String}
	 * @static
	 */
	static get CLIPCHILDREN() {
		return 'clipchildren';
	}

	/**
	 * Predefined constant to reference closed attribute.
	 *
	 * @property CLOSED
	 * @type {String}
	 * @static
	 */
	static get CLOSED() {
		return 'closed';
	}

	/**
	 * Predefined constant to reference collapsable attribute.
	 *
	 * @property COLLAPSABLE
	 * @type {String}
	 * @static
	 */
	static get COLLAPSABLE() {
		return 'collapsable';
	}

	/**
	 * Predefined constant to reference collapse behaviour.
	 *
	 * @property COLLAPSEBEHAVIOUR
	 * @type {String}
	 * @static
	 * @since 3.0
	 */
	static get COLLAPSEBEHAVIOUR() {
		return 'collapsebehaviour';
	}

	/**
	 * Predefined constant to reference collapsed attribute.
	 *
	 * @property COLLAPSED
	 * @type {String}
	 * @static
	 */
	static get COLLAPSED() {
		return 'collapsed';
	}

	/**
	 * Predefined constant to reference collapsed button attribute.
	 *
	 * @property COLLAPSEDBUTTON
	 * @type {String}
	 * @static
	 */
	static get COLLAPSEDBUTTON() {
		return 'collapsedbutton';
	}

	/**
	 * Predefined constant to reference container attribute.
	 *
	 * @property CONTAINER
	 * @type {String}
	 * @static
	 */
	static get CONTAINER() {
		return 'container';
	}

	/**
	 * Predefined constant to reference deletable attribute.
	 *
	 * @property DELETEABLE
	 * @type {String}
	 * @static
	 */
	static get DELETEABLE() {
		return 'deleteable';
	}

	/**
	 * Predefined constant to reference viemode attribute.
	 *
	 * @property VIEWMODE
	 * @type {String}
	 * @static
	 */
	static get VIEWMODE() {
		return 'viewmode';
	}

	/**
	 * Predefined constant to reference moveable attribute.
	 *
	 * @property MOVEABLE
	 * @type {String}
	 * @static
	 */
	static get MOVEABLE() {
		return 'moveable';
	}
	/**
	 * Predefined constant to reference port mode attribute.
	 *
	 * @property PORTMODE
	 * @type {String}
	 * @static
	 */
	static get PORTMODE() {
		return 'portmode';
	}
	/**
	 * Predefined constant to reference rotatable attribute.
	 *
	 * @property ROTATABLE
	 * @type {String}
	 * @static
	 */
	static get ROTATABLE() {
		return 'rotatable';
	}
	/**
	 * Predefined constant to reference selection mode attribute.
	 *
	 * @property SELECTIONMODE
	 * @type {String}
	 * @static
	 */
	static get SELECTIONMODE() {
		return 'selectionmode';
	}
	/**
	 * Predefined constant to reference selected attribute.
	 *
	 * @property SELECTED
	 * @type {String}
	 * @static
	 */
	static get SELECTED() {
		return 'selected';
	}
	/**
	 * Predefined constant to reference sizeable attribute.
	 *
	 * @property SIZEABLE
	 * @type {String}
	 * @static
	 */
	static get SIZEABLE() {
		return 'sizeable';
	}
	/**
	 * Predefined constant to reference snap to attribute.
	 *
	 * @property SNAPTO
	 * @type {String}
	 * @static
	 */
	static get SNAPTO() {
		return 'snapto';
	}
	/**
	 * Predefined constant to reference visible attribute.
	 *
	 * @property VISIBLE
	 * @type {String}
	 * @static
	 */
	static get VISIBLE() {
		return 'visible';
	}
	/* Predefined constant to reference margin top attribute.
	 *
	 * @property MARGINTOP
	 * @type {String}
	 * @static
	 */
	static get MARGINTOP() {
		return 'margintop';
	}
	/**
	 * Predefined constant to reference margin left attribute.
	 *
	 * @property MARGINLEFT
	 * @type {String}
	 * @static
	 */
	static get MARGINLEFT() {
		return 'marginleft';
	}
	/**
	 * Predefined constant to reference margin right attribute.
	 *
	 * @property MARGINRIGHT
	 * @type {String}
	 * @static
	 */
	static get MARGINRIGHT() {
		return 'marginright';
	}
	/**
	 * Predefined constant to reference margin bottom attribute.
	 *
	 * @property MARGINBOTTOM
	 * @type {String}
	 * @static
	 */
	static get MARGINBOTTOM() {
		return 'marginbottom';
	}
	/**
	 * Predefined constant to reference item part attribute.
	 *
	 * @property ITEMPART
	 * @type {String}
	 * @static
	 */
	static get ITEMPART() {
		return 'itempart';
	}
	/**
	 * Predefined constant to reference edit mask attribute.
	 *
	 * @property EDITMASK
	 * @type {String}
	 * @static
	 */
	static get EDITMASK() {
		return 'editmask';
	}

	static get SCALETYPE() {
		return 'scaletype';
	}

	static get SCALESHOW() {
		return 'scaleshow';
	}

	static get TemplateID() {
		return TemplateID;
	}

	static createTemplate() {
		const attributes = new ItemAttributes();

		function addAttribute(attribute, value, constraint) {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		}

		// simply add default attributes:
		addAttribute(new BooleanAttribute(ItemAttributes.CLIPCHILDREN), false);
		addAttribute(new BooleanAttribute(ItemAttributes.CLOSED), true);
		addAttribute(new NumberAttribute(ItemAttributes.COLLAPSEBEHAVIOUR), 0);
		addAttribute(
			new NumberAttribute(ItemAttributes.COLLAPSABLE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				ItemAttributes.Direction,
				ItemAttributes.Direction.NONE
			)
		);
		addAttribute(new BooleanAttribute(ItemAttributes.COLLAPSED), false);
		addAttribute(new NumberAttribute(ItemAttributes.VIEWMODE), 0);
		addAttribute(
			new NumberAttribute(ItemAttributes.COLLAPSEDBUTTON),
			undefined,
			RangeConstraint.fromPropertiesOf(
				ItemAttributes.ButtonPosition,
				ItemAttributes.ButtonPosition.TOPRIGHT
			)
		);
		addAttribute(new BooleanAttribute(ItemAttributes.CONTAINER), true);
		addAttribute(new BooleanAttribute(ItemAttributes.DELETEABLE), true);
		addAttribute(
			new NumberAttribute(ItemAttributes.MOVEABLE),
			ItemAttributes.Moveable.BOTH
		);
		addAttribute(
			new NumberAttribute(ItemAttributes.PORTMODE),
			ItemAttributes.PortMode.DEFAULT | ItemAttributes.PortMode.CENTER
		);
		addAttribute(new BooleanAttribute(ItemAttributes.ROTATABLE), true);
		addAttribute(
			new NumberAttribute(ItemAttributes.SELECTIONMODE),
			ItemAttributes.SelectionMode.DEFAULT
		);
		// we don't save selected state:
		const selected = new BooleanAttribute(ItemAttributes.SELECTED);
		selected.setTransient(true);
		selected.setExpressionOrValue(false);
		attributes.addAttribute(selected);
		addAttribute(new BooleanAttribute(ItemAttributes.SIZEABLE), true);
		addAttribute(new BooleanAttribute(ItemAttributes.SNAPTO), true);
		addAttribute(new Attribute(ItemAttributes.VISIBLE), true);
		addAttribute(new NumberAttribute(ItemAttributes.MARGINLEFT), 0);
		addAttribute(new NumberAttribute(ItemAttributes.MARGINRIGHT), 0);
		addAttribute(new NumberAttribute(ItemAttributes.MARGINTOP), 0);
		addAttribute(new NumberAttribute(ItemAttributes.MARGINBOTTOM), 0);
		addAttribute(new BooleanAttribute(ItemAttributes.ITEMPART), false);
		addAttribute(
			new NumberAttribute(ItemAttributes.EDITMASK),
			ItemAttributes.EditMask.NONE
		);
		addAttribute(new StringAttribute(ItemAttributes.SCALETYPE), 'top');
		addAttribute(new BooleanAttribute(ItemAttributes.SCALESHOW), false);

		return attributes.toTemplate(ItemAttributes.TemplateID);
	}
}

ItemAttributes.template = ItemAttributes.createTemplate();

module.exports = ItemAttributes;
