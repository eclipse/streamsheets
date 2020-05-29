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
import {
	default as JSG,
	Shape,
	Point,
	ItemAttributes,
	FormatAttributes,
	TextFormatAttributes,
	Rectangle, GraphUtils
} from '@cedalo/jsg-core';
import View from '../../ui/View';
import ShapeRenderer from './shapes/ShapeRenderer';

/**
 * This module contains classes related to the visual representation of view related classes.
 * Whereas the {{#crossLink "GraphItem"}}{{/crossLink}} contains the data
 * and its corresponding {{#crossLink "GraphItemController"}}{{/crossLink}}
 * defines the behavior the view classes deal with the actual visualization.</br>
 * Any visualization data which needs to be persisted must be added to the GraphItem.
 *  - base class
 *  - format
 *  - subclasses should extend => important methods
 *  - examples NodeView, EdgeView...
 */

/**
 * Each GraphItemView has a collapse button by default. The button is implemented as a simple View
 * and is drawn as a decoration on top of a GraphItemView if required.
 *
 * @class CollapseButton
 * @extends View
 * @param {GraphItem} item The GraphItem of the corresponding GraphItemView.
 * @constructor
 */
class CollapseButton extends View {
	constructor(item) {
		super();
		this._item = item;
		this._bounds = new Rectangle(0, 0, 300, 300);
		this._imgExpanded = JSG.imagePool.get(JSG.ImagePool.IMG_EXPANDED);
		this._imgCollapsed = JSG.imagePool.get(JSG.ImagePool.IMG_COLLAPSED);
	}

	containsPoint(point) {
		return this._item.isCollapsable() ? this._bounds.containsPoint(point) : false;
	}

	draw(graphics) {
		if (this._item.isCollapsable()) {
			const icon = this._item.isCollapsed() ? this._imgExpanded : this._imgCollapsed;
			this._updateBounds(graphics.getCoordinateSystem().deviceToLogXNoZoom(16));
			graphics.drawImage(icon, this._bounds.x, this._bounds.y, this._bounds.width, this._bounds.height);
		}
	}

	_updateBounds(size) {
		this._bounds.setSize(size, size);
		const x = this._item
			.getSize()
			.getWidth()
			.getValue();
		const y = this._item
			.getSize()
			.getHeight()
			.getValue();
		switch (
			this._item
				.getItemAttributes()
				.getCollapsedButton()
				.getValue()
		) {
			case ItemAttributes.ButtonPosition.TOPLEFT:
				this._bounds.x = 0;
				this._bounds.y = 0;
				break;
			case ItemAttributes.ButtonPosition.TOPRIGHT:
				this._bounds.x = x - this._bounds.width;
				this._bounds.y = 0;
				break;
			case ItemAttributes.ButtonPosition.TOPCENTER:
				this._bounds.x = (x - this._bounds.width) / 2.0;
				this._bounds.y = 0;
				break;
			case ItemAttributes.ButtonPosition.BOTTOMCENTER:
				this._bounds.x = (x - this._bounds.width) / 2.0;
				this._bounds.y = y - this._bounds.height;
				break;
		}
	}
}

/**
 * The base class to visualize GraphItems. Subclasses should extend this one.
 *
 * @class GraphItemView
 * @param {GraphItem} item The associated graph item.
 * @extends View
 * @constructor
 */
class GraphItemView extends View {
	constructor(item) {
		super();

		this._item = item;
		this._collapseBtn = new CollapseButton(item);
		this._shapeRenderer = ShapeRenderer.fromShape(item._shape);

		/**
		 * A plain javascript object to store decoration views. A decoration view is simply a subclass of
		 * {{#crossLink "View"}}{{/crossLink}}. These views are drawn via
		 * {{#crossLink "GraphItemView/drawDecorations:method"}}{{/crossLink}}. To store a view simply
		 * register it under a unique string.
		 * @example
		 *      graphItemView.decorations['my.deco.view'] = myDecorationView;
		 *
		 * @property decorations
		 * @type {Object}
		 */
		this.decorations = {};
	}

	/**
	 * Should be called if this view is no longer used.<br/>
	 * Subclasses may overwrite to free up resources, but should call base implementation.<br/>
	 * Note: usually it is not required to call this method directly.
	 *
	 * @method dispose
	 * @since 2.2.17
	 */
	dispose() {
		// this._item.dispose();
	}

	/**
	 * Returns the id of the associated {{#crossLink "GraphItem"}}{{/crossLink}}.
	 *
	 * @method getId
	 * @return {Number} The id of the underlying GraphItem.
	 */
	getId() {
		return this._item.getId();
	}

	/**
	 * Returns the underlying GraphItem
	 *
	 * @method getItem
	 * @return {GraphItem} The underlying GraphItem
	 */
	getItem() {
		return this._item;
	}

	/**
	 * Convenience method to retrieve internally used format attributes.
	 * @method getFormat
	 * @return {JSG.mode.attr.FormatAttributes} The currently used format attributes.
	 * @since 2.0.22.0
	 */
	getFormat() {
		return this._item && this._item.getFormat();
	}

	/**
	 * Returns the GraphView, i.e. the view associated to the {{#crossLink "Graph"}}{{/crossLink}}
	 * model.
	 *
	 * @method getGraphView
	 * @return {GraphView} The GraphView
	 */
	getGraphView() {
		return this._parent !== undefined ? this._parent.getGraphView() : undefined;
	}

	isVisible() {
		return this._item.isVisible();
	}

	setVisible(doIt) {
		const visible = this._item.getItemAttribute(ItemAttributes.VISIBLE);
		visible.setExpressionOrValue(doIt);
	}

	/**
	 * Convenience method to get the rotation angle of the underlying {{#crossLink
	 * "GraphItem"}}{{/crossLink}}.
	 *
	 * @method getAngle
	 * @return {Number} The angle expression value of the underlying GraphItem.
	 */
	getAngle() {
		return this._item.getAngle().getValue();
	}

	/**
	 * Convenience method to get the {{#crossLink "Shape"}}{{/crossLink}} points
	 * of the underlying {{#crossLink "GraphItem"}}{{/crossLink}}. Note that the
	 * points are defined relative to the origin of corresponding GraphItem.</br>
	 * See {{#crossLink "GraphItemView/getTranslatedShapePoints:method"}}{{/crossLink}} too.
	 *
	 * @method getPointList
	 * @return {PointList} The shape points.
	 */
	getPointList() {
		// called by ResizeInteraction...
		return this._item._shape.getPointList();
	}

	/**
	 * Gets the BoundingBox of the underlying {{#crossLink "GraphItem"}}{{/crossLink}}.
	 *
	 * @method getBoundingBox
	 * @return {BoundingBox} BoundingBox of underlying GraphItem.
	 */
	getBoundingBox(reusebbox) {
		return this._item.getBoundingBox(reusebbox);
	}

	/**
	 * Gets the origin of the underlying {{#crossLink "GraphItem"}}{{/crossLink}}.
	 *
	 * @method getOrigin
	 * @param {Point} [reusepoint] An optional Point instance to reuse, if not defined a new one will be
	 *     created.
	 * @return {Point} The origin of underlying GraphItem.
	 */
	getOrigin(reusepoint) {
		return this._item.getOrigin(reusepoint);
	}

	/**
	 * Sets the origin of the underlying {{#crossLink "GraphItem"}}{{/crossLink}} to the
	 * specified Point.
	 *
	 * @method setOriginTo
	 * @param {Point} point The new origin location
	 */
	setOriginTo(point) {
		this._item.setOriginTo(point);
	}

	/**
	 * Gets the Pin location of the underlying {{#crossLink "GraphItem"}}{{/crossLink}}.
	 *
	 * @method getPin
	 * @param {Point} [reusepoint] An optional Point instance to reuse, if not defined a new one will be
	 *     created.
	 * @return {Point} The Pin location of underlying GraphItem.
	 */
	getPin(reusepoint) {
		return this._item.getPin();
	}

	/**
	 * Checks if given Point is within this view.
	 *
	 * @method containsPoint
	 * @param {Point} point The point to check.
	 * @param {Shape.FindFlags} [findFlag] A flag to affect the contain decision.
	 * @return {Boolean} <code>true</code> if this view contains given point, <code>false</code> otherwise.
	 */
	containsPoint(point, findFlag) {
		return this._item.containsPoint(point, findFlag);
	}

	/**
	 * Translates given point from Views parent.</br>
	 * See {{#crossLink "GraphItem/translateFromParent:method"}}{{/crossLink}} too.
	 *
	 * @method translateFromParent
	 * @param {Point} point The point to translate.
	 * @return {Point} Given and now translated point as convenience.
	 */
	translateFromParent(point) {
		return this._item.translateFromParent(point);
	}

	/**
	 * Translates given point to parent of this view.</br>
	 * See {{#crossLink "GraphItem/translateToParent:method"}}{{/crossLink}} too.
	 *
	 * @method translateToParent
	 * @param {Point} point The point to translate.
	 * @return {Point} Given and now translated point as convenience.
	 */
	translateToParent(point) {
		return this._item.translateToParent(point);
	}

	/**
	 * Convenience method to get the {{#crossLink "Shape"}}{{/crossLink}} points already
	 * translated to the given view. </br> I.e. the shape points are relative to the origin of given view.
	 *
	 * @method getTranslatedShapePoints
	 * @param {GraphItemView} toView The GraphItemView to translate points to.
	 * @param {Array} [reusepoints] An optional array of points to reuse. If not provided a new one will be created.
	 * @return {Array} An array of translated shape points.
	 */
	getTranslatedShapePoints(toView, reusepoints) {
		return this._item.getTranslatedShapePoints(toView.getItem(), reusepoints);
	}

	/**
	 * Returns the BoundingBox of the underlying {{#crossLink "GraphItem"}}{{/crossLink}} already
	 * translated to given GraphItemView.</br> That means the returned BoundingBox is relative to given item.
	 *
	 * @method getTranslatedBoundingBox
	 * @param {GraphItemView} toView The GraphItemView to translate BoundingBox to.
	 * @param {BoundingBox} [reusebbox] An optional bounding box to reuse. If not provided a new one will
	 *     be created.
	 * @return {BoundingBox} The translated bounding box.
	 */
	getTranslatedBoundingBox(toView, reusebbox) {
		return this._item.getTranslatedBoundingBox(toView.getItem(), reusebbox);
	}

	/**
	 * The main drawing routine.</br>
	 * Usually it is not required to override this method. Instead subclasses should rather overwrite one of
	 * {{#crossLink "GraphItemView/drawFill:method"}}{{/crossLink}},
	 * {{#crossLink "GraphItemView/drawBorder:method"}}{{/crossLink}} or
	 * {{#crossLink "GraphItemView/drawDecorations:method"}}{{/crossLink}} methods which
	 * are called in that order.
	 *
	 * @method draw
	 * @param {Graphics} graphics The current Graphics instance to use for drawing this GraphItemView.
	 */

	draw(graphics) {
		if (!this._item.isVisible()) {
			return;
		}

		let format;
		let tmprect;
		let transparency;
		const draw = this._item.isDrawEnabled() || this._item._isFeedback;

		graphics.save(this);
		const cancelGroup = graphics.startGroup(this);
		// translate & rotate:
		this.translateGraphics(graphics);

		if (cancelGroup === true) {
			graphics.endGroup();
			graphics.restore();
			return;
		}

		if (draw) {
			this._item.updateLabelPositions();

			transparency = this._item.getTransparencyFromLayer();
			if (transparency !== 100) {
				graphics.setTransparency(transparency);
				graphics.disableTransparency();
			}

			format = this._item.getFormat();
			tmprect = this._item.getSize().toRectangle(JSG.rectCache.get());

			graphics.addBoundingRectInfo('node-rect', tmprect);

			if (
				this.getItemAttributes()
					.getScaleShow()
					.getValue()
			) {
				const scaleRect = tmprect.copy();
				scaleRect.y -= 500;
				scaleRect.height = 500;

				this.drawHorEndless(graphics, scaleRect);

				scaleRect.setTo(tmprect);
				scaleRect.x -= 500;
				scaleRect.width = 500;

				this.drawVerEndless(graphics, scaleRect);
			}

			this._shapeRenderer.init(this._item._shape, graphics);

			this.drawFill(graphics, format, tmprect);
		}
		if (this._item.isClipChildren()) {
			if (this.hasSubviews()) {
				this.drawSubViews(graphics);
			}
			if (draw) {
				this.drawBorder(graphics, format, tmprect);
			}
		} else {
			if (draw) {
				this.drawBorder(graphics, format, tmprect);
			}
			if (this.hasSubviews()) {
				this.drawSubViews(graphics);
			}
		}

		if (draw) {
			this.drawDecorations(graphics, tmprect);

			if (transparency !== 100) {
				graphics.setTransparency(100);
				graphics.enableTransparency();
			}
			JSG.rectCache.release(tmprect);
		}

		graphics.endGroup();
		graphics.restore();
	}

	/**
	 * Translates given Graphics instance to the origin of this view.</br>
	 * Called during drawing, subclasses may overwrite.
	 *
	 * @method translateGraphics
	 * @param {Graphics} graphics The graphics to use for drawing.
	 */
	translateGraphics(graphics) {
		const pt = JSG.ptCache.get();
		const origin = this._item.getOrigin(pt);
		graphics.translate(origin.x, origin.y);
		graphics.rotate(this._item.getAngle().getValue());
		JSG.ptCache.release(pt);
	}

	/**
	 * Fills the defined {{#crossLink "Shape"}}{{/crossLink}} using given Format.</br>
	 * This applies specified format and shadow to provided Graphics instance. The Shape then is actually
	 * drawn by using inner {{#crossLink "ShapeRenderer"}}{{/crossLink}} instance.</br>
	 * Note: called during drawing, subclasses may overwrite.
	 *
	 * @method drawFill
	 * @param {Graphics} graphics The graphics to use for drawing.
	 * @param {FormatAttributes} format The Format to use for drawing.
	 * @param {Rectangle} rect A rectangle which specifies the GraphItem bounds
	 */
	drawFill(graphics, format, rect) {
		// if (format.hasFill()) {
		if (format.applyFillToGraphics(graphics, rect)) {
			format.applyShadowToGraphics(graphics, rect);
			this._shapeRenderer.drawShapeFill(this._item._shape, this._item.isClosed(), graphics);
			format.removeShadowFromGraphics(graphics);
		}

		// if (this.getItem().myVideo && !this.videoStarted) {
		// 	this.videoStarted = true;
		// 	this.getItem().myVideo.addEventListener('play', () => {
		// 		const step = () => {
		// 			const view = this.getGraphView();
		// 			const p = new Point(rect.x, rect.y);
		//
		// 			GraphUtils.traverseDown(view, this, (v) => {
		// 				v.translateToParent(p);
		// 				return true;
		// 			});
		// 			view.orgGraphics.drawImage(this.getItem().myVideo, p.x, p.y, rect.width, rect.height);
		// 			requestAnimationFrame(step);
		// 		};
		//
		// 		requestAnimationFrame(step);
		// 	});
		// }
	}

	/**
	 * Draws the sub views of this GraphItemView.</br>
	 * Note: called during drawing, subclasses may overwrite.
	 *
	 * @method drawSubViews
	 * @param {Graphics} graphics The Graphics to use for drawing.
	 */
	drawSubViews(graphics) {
		if (this._item.isClipChildren()) {
			graphics.save();
			// due to setting clip area...
			this._shapeRenderer.setClipArea(this._item._shape, graphics);
		}

		// draw content:
		if (this._item.isCollapsed()) {
			const title = this._item.getTitle ? this._item.getTitle() : undefined;
			this._subviews.forEach((subview) => {
				if (
					subview.getItem() === title ||
					subview
						.getItemAttributes()
						.getCollapseBehaviour()
						.getValue()
				) {
					subview.draw(graphics);
				}
			});
		} else {
			this._subviews.forEach((subview) => {
				if (subview.isVisible() === true) {
					subview.draw(graphics);
				}
			});
		}
		if (this._item.isClipChildren()) {
			graphics.restore();
			// restores clip area...
		}
	}

	/**
	 * Strokes the defined {{#crossLink "Shape"}}{{/crossLink}} using given Format
	 * and inner {{#crossLink "ShapeRenderer"}}{{/crossLink}} instance.</br>
	 * Note: called during drawing, subclasses may overwrite.
	 *
	 * @method drawBorder
	 * @param {Graphics} graphics The graphics to use for drawing.
	 * @param {FormatAttributes} format The Format to use for drawing.
	 * @param {Rectangle} rect A rectangle which specifies the GraphItem bounds
	 */
	drawBorder(graphics, format, rect) {
		// if (format.hasBorder()) {
		if (format.applyLineToGraphics(graphics)) {
			if (
				format.getLineArrowStart().getValue() !== FormatAttributes.ArrowStyle.NONE ||
				format.getLineArrowEnd().getValue() !== FormatAttributes.ArrowStyle.NONE
			) {
				format.applyFillToGraphics(graphics, rect);
				// use line transparency here
				graphics.setTransparency(format.getLineTransparency().getValue());
			}
			this._shapeRenderer.drawShapeBorder(this._item._shape, this._item.isClosed(), graphics);
			format.removeLineFromGraphics(graphics);
		}
	}

	/**
	 * Used to draw any additional elements or components on top of this GraphItemView. To register a <code>View</code>
	 * as decoration use the {{#crossLink "GraphItemView/decorations:property"}}{{/crossLink}}
	 * property.</br> Note: this method is called during drawing, subclasses may overwrite.
	 *
	 * @method drawDecorations
	 * @param {Graphics} graphics The graphics to use for drawing.
	 * @param {Rectangle} rect A rectangle which specifies the GraphItem bounds
	 */
	drawDecorations(graphics, rect) {
		this._collapseBtn.draw(graphics);

		let deco;
		const { decorations } = this;

		// eslint-disable-next-line no-restricted-syntax,guard-for-in
		for (const id in decorations) {
			deco = decorations.hasOwnProperty(id) ? decorations[id] : undefined;
			if (deco && deco.isVisible()) {
				deco.draw(graphics, rect);
			}
		}

		const graph = this._item.getGraph();
		if (!graph) {
			return;
		}

		const settings = graph.getSettings();
		if (settings.getNamesVisible()) {
			graphics.setFillColor('#AAAAAA');
			graphics.setTextBaseline('top');
			graphics.setTextAlign(TextFormatAttributes.TextAlignment.LEFT);
			graphics.setFontName('Arial');
			graphics.setFontSize(8 / graphics.getCoordinateSystem().getZoom());
			graphics.setFont();
			graphics.fillText(this._item.getName().getValue(), 0, rect.getBottom());
		}
	}

	drawHorEndless(graphics, rect) {
		const textY0 = rect.y + rect.height / 2 - 25;
		const markerY0 = rect.y + (rect.height * 3) / 8 - 1;
		const markerY1 = rect.y + (rect.height * 5) / 8;
		const { width } = rect;
		const cs = graphics.getCoordinateSystem();
		const zoom = cs.getZoom();

		graphics.setFontTo(`${Math.max(1, 8 * zoom)}pt Verdana`);
		graphics.setLineColor('#555555');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.getContext().textBaseline = 'middle';
		graphics.getContext().textAlign = 'center';

		const steps = this.getNextSteps(0, cs);

		// draw background:
		graphics.setFillColor('#EEEEEE');
		graphics.fillRect(rect);
		// draw marker:
		graphics.beginPath();
		graphics.setFillColor('#777777');
		for (; steps.minor < width || steps.major < width; ) {
			if (zoom > 0.4 && (steps.minor > 0 && steps.minor < width)) {
				graphics.moveTo(steps.minor, markerY0);
				graphics.lineTo(steps.minor, markerY1);
			}
			if (steps.major > 0 && steps.major < width) {
				graphics.fillText(cs.getMajorUnitString(steps.major).toFixed(0), steps.major, textY0);
			}
			steps.minor += cs._majorUnit;
			steps.major += zoom > 0.5 ? cs._majorUnit : zoom > 0.3 ? cs._majorUnit * 2 : cs._majorUnit * 5;
		}
		graphics.stroke();
	}

	drawVerEndless(graphics, rect) {
		const textX0 = rect.x + rect.width / 2 - 25;
		const markerX0 = rect.x + (rect.width * 3) / 8;
		const markerX1 = rect.x + (rect.width * 5) / 8;
		const { height } = rect;
		const cs = graphics.getCoordinateSystem();
		const zoom = cs.getZoom();

		graphics.setLineColor('#555555');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

		const steps = this.getNextSteps(0, cs);

		// draw background:
		graphics.setFillColor('#EEEEEE');
		graphics.fillRect(rect);
		// draw marker...
		graphics.beginPath();
		graphics.setFillColor('#777777');
		for (; steps.minor < height || steps.major < height; ) {
			if (zoom > 0.4 && (steps.minor > 0 && steps.minor < height)) {
				graphics.moveTo(markerX0, steps.minor);
				graphics.lineTo(markerX1, steps.minor);
			}
			if (steps.major > 0 && steps.major < height) {
				graphics.translate(textX0, steps.major);
				graphics.rotate(-Math.PI_2);
				graphics.fillText(cs.getMajorUnitString(steps.major).toFixed(0), 0, 0);
				graphics.rotate(Math.PI_2);
				graphics.translate(-textX0, -steps.major);
			}
			steps.minor += cs._majorUnit;
			steps.major += zoom > 0.5 ? cs._majorUnit : zoom > 0.3 ? cs._majorUnit * 2 : cs._majorUnit * 5;
		}
		graphics.stroke();
	}

	getNextSteps(value, cs) {
		const steps = { major: 0, minor: 0 };
		steps.major = Math.abs(value) % cs._majorUnit;
		steps.major = value < 0 ? steps.major : cs._majorUnit - steps.major;
		if (steps.major > cs._minorUnit) {
			// special case for value = 0 -> major == majorStep...
			steps.minor = steps.major === cs._majorUnit ? steps.major - cs._minorUnit : steps.major % cs._minorUnit;
		} else {
			steps.minor = steps.major + cs._minorUnit;
		}
		return steps;
	}

	/**
	 * Checks if given event at specified location is handled by this GraphItemView.
	 *
	 * @method doHandleEventAt
	 * @param {Point} location The location at which the event occurred.
	 * @param {ClientEvent} event The event to handle.
	 * @return {Boolean} <code>true</code> if the event will be consumed by this GraphItemView, <code>false</code>
	 *     otherwise.
	 */
	doHandleEventAt(location, event) {
		return this.hitCollapseButton(location);
	}

	/**
	 * Called, if mouse is pressed on top of this GraphItemView.
	 *
	 * @method onMouseDown
	 * @param {Point} location Location, relative to the container coordinates, of the mouse event.
	 * @param {GraphViewer} viewer Viewer to which the controller belongs.
	 * @param {MouseEvent} event MouseEvent parameters.
	 * @return {Boolean} Return false to intercept the event. No further processing will occur or true to allow default
	 *     handling.
	 */
	onMouseDown(location, viewer, event) {
		const item = this._item;
		// check if we hit collapse button
		if (item.isCollapsable()) {
			if (this.hitCollapseButton(location)) {
				const interactionHandler = this._getInteractionHandler(viewer);
				if (interactionHandler) {
					return interactionHandler.collapse(item);
				}
			}
		}
		return false;
	}

	_getInteractionHandler(viewer) {
		const defInteraction = viewer.getDefaultInteraction();
		return defInteraction ? defInteraction.getInteractionHandler() : undefined;
	}

	/**
	 * Checks if location is inside the collapse button bounds of this GraphItemView.
	 *
	 * @method hitCollapseButton
	 * @param {Point} location The location to check.
	 * @return {Boolean} <code>true</code> if given location is inside collapse button bounds, <code>false</code>
	 *     otherwise.
	 */

	hitCollapseButton(location) {
		return this._collapseBtn.containsPoint(location);
	}

	/**
	 * Returns the Shape definition of the underlying {{#crossLink "GraphItem"}}{{/crossLink}}.
	 *
	 * @method getShape
	 * @return {Shape} The Shape instance used by corresponding GraphItem.
	 */
	getShape() {
		return this._item._shape;
	}

	/**
	 * Returns the Attributes of the underlying {{#crossLink "GraphItem"}}{{/crossLink}}.
	 *
	 * @method getItemAttributes
	 * @return {ItemAttributes} The Attributes used by corresponding GraphItem.
	 */
	getItemAttributes() {
		return this._item.getItemAttributes();
	}

	/**
	 * Sets the ShapeRenderer to use for drawing the Shape of underlying {{#crossLink
	 * "GraphItem"}}{{/crossLink}}.
	 *
	 * @method setShapeRenderer
	 * @param {ShapeRenderer} shapeRenderer The ShapeRenderer to use for drawing the Shape.
	 */
	setShapeRenderer(shapeRenderer) {
		if (shapeRenderer) {
			this._shapeRenderer = shapeRenderer;
		}
	}

	/**
	 * Sets the BoundingBox of the underlying {{#crossLink "GraphItem"}}{{/crossLink}}.
	 *
	 * @method setBoundingBox
	 * @param {BoundingBox} The new BoundingBox of underlying GraphItem.
	 */
	setBoundingBoxTo(bbox) {
		this._item.setBoundingBoxTo(bbox);
	}

	/**
	 * Calculates the preferred bounding Rectangle this view needs to draw itself. The optional parameter
	 * can be used to give hints to calculation, e.g. to specify the available space.</br>
	 * <b>Note:</b> This method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method getPreferredBounds
	 * @param {Rectangle} [recthint] An optional Rectangle to influence calculation.
	 * @param {Rectangle} [reuserect] An optional Rectangle to reuse, if not supplied a new one will be
	 *     created.
	 * @return {Rectangle} The preferred Rectangle this view needs to draw itself.
	 */
	getPreferredBounds(recthint, reuserect) {}

	adaptHighlight(highlight) {}

	checkMaximumImageDimensions(image) {
		return true;
	}

	getSelectedFormula(sheet) {
		let formula = '';
		const attrFormula = this.getItem().getItemAttributes().getAttribute('sheetformula');
		const expr = attrFormula ? attrFormula.getExpression() : undefined;
		if (expr && expr.getTerm()) {
			formula = `=${expr.getTerm().toLocaleString(JSG.getParserLocaleSettings(), {
				item: sheet,
				useName: true,
			})}`;
		} else {
			return expr && expr.getFormula() ? expr.getFormula() : '';
		}

		return formula;
	}

	applyAttributes() {
		return false;
	}
}

export default GraphItemView;
