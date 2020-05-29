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
import { BoundingBox, FormatAttributes, MathUtils, Point, default as JSG } from '@cedalo/jsg-core';
import View from '../../ui/View';

/**
 * A simple {{#crossLink "BoundingBox"}}{{/crossLink}} based view.
 *
 * @class BBoxView
 * @extends View
 * @constructor
 */
class BBoxView extends View {
	constructor() {
		super();

		this._bbox = new BoundingBox(0, 0);
		this._format = new FormatAttributes();
	}

	newInstance() {
		return new BBoxView();
	}

	copy() {
		const copy = super.copy();
		copy._bbox = this._bbox.copy();
		copy._format = this._format.copy();
		return copy;
	}

	getPoints() {
		return this._bbox.getPoints();
	}

	/**
	 * Checks if given point is within the BoundingBox of this BBoxView.
	 *
	 * @method containsPoint
	 * @param {Point} point Point to check.
	 * @return {Boolean} <code>true</code> if point is within inner BoundingBox, <code>false</code> otherwise.
	 */
	containsPoint(point) {
		return this._bbox.containsPoint(point);
	}

	getAngle() {
		return this._bbox.getAngle();
	}

	/**
	 * Returns direct access to inner <code>BoundingBox</code>.
	 *
	 * @method getBoundingBox
	 * @param {BoundingBox} reusebbox If provided it is set to the value of inner <code>BoundingBox</code>
	 *     and returned instead of the internally used <code>BoundingBox</code> instance.
	 * @return {BoundingBox} Either the internally used <code>BoundingBox</code> instance or the
	 * <code>reusebbox</code> parameter if provided.
	 */
	getBoundingBox(reusebbox) {
		return reusebbox ? reusebbox.setTo(this._bbox) : this._bbox;
	}

	/**
	 * Updates the internally used <code>BoundingBox</code>.
	 * @method setBoundingBoxTo
	 * @param {BoundingBox} bbox A <code>BoundingBox</code> which provides new location, size and rotation
	 *     angle.
	 * @since 2.0.8
	 */
	setBoundingBoxTo(bbox) {
		if (bbox) {
			this._bbox.setTo(bbox);
		}
	}

	/**
	 * Returns the location of this view, i.e. the top-left corner of inner BoundingBox.
	 *
	 * @method getLocation
	 * @param {Point} [reusepoint] An optional <code>Point</code> to reuse. If not provided a new
	 *     <code>Point</code> is created.
	 * @return {Point} The top-left corner of inner BoundingBox.
	 */
	getLocation(reusepoint) {
		return this._bbox.getTopLeft(reusepoint);
	}

	/**
	 * Returns direct access to inner Format.
	 *
	 * @method getFormat
	 * @return {FormatAttributes} Format instance used by this view.
	 */
	getFormat() {
		return this._format;
	}

	/**
	 * Returns the current size of this view as Point instance.
	 *
	 * @method getSize
	 * @param {Point} [reusepoint] An optional <code>Point</code> to reuse. If not provided a new
	 *     <code>Point</code> is created.
	 * @return {Point} The size of this view.
	 */
	getSize(reusepoint) {
		const pt = reusepoint || new Point();
		pt.set(this._bbox.getWidth(), this._bbox.getHeight());
		return pt;
	}

	/**
	 * Sets the angle of inner BoundingBox to specified angle.
	 *
	 * @method setAngle
	 * @param {Number} angle The rotation angle in radians.
	 */
	setAngle(angle) {
		this._bbox.setAngle(angle);
	}

	/**
	 * Sets the new width and height of this view by applying specified values to inner BoundingBox.
	 *
	 * @method setSize
	 * @param {Number} width The new view width.
	 * @param {Number} height The new view height.
	 */
	setSize(width, height) {
		this._bbox.setWidth(width);
		this._bbox.setHeight(height);
	}

	/**
	 * Sets the new view location by applying specified values to the top-left point of inner BoundingBox.
	 *
	 * @method setLocation
	 * @param {Number} x The x coordinate of new view location.
	 * @param {Number} y The y coordinate of new view location.
	 */
	setLocation(x, y) {
		this._bbox.setTopLeft(x, y);
	}

	/**
	 * Sets the new view location to specified <code>Point</code>.
	 *
	 * @method setLocationTo
	 * @param {Point} pt The new view location.
	 */
	setLocationTo(pt) {
		this.setLocation(pt.x, pt.y);
	}

	translateFromParent(point) {
		const loc = this.getLocation(JSG.ptCache.get());
		point.subtract(loc);
		MathUtils.rotatePoint(point, -this.getAngle());
		JSG.ptCache.release(loc);
		return point;
	}

	translateToParent(point) {
		const loc = this.getLocation(JSG.ptCache.get());
		MathUtils.rotatePoint(point, this.getAngle());
		point.add(loc);
		JSG.ptCache.release(loc);
		return point;
	}

	/**
	 * Draws rectangle shape of this view as defined by inner BoundingBox.</br>
	 * The actual drawing  is splitted into several functions, each of it can be overwritten by subclasses. The
	 * sequence of called function is as follow: <code>translateGraphics</code>, <code>drawBackground</code>,
	 * <code>drawSubViews</code>, <code>drawBorder</code> and <code>drawDecorations</code>.</br>
	 *
	 * @method draw
	 * @param {Graphics} graphics The graphics to use for drawing.
	 */
	draw(graphics) {
		graphics.save(this);

		this.translateGraphics(graphics);
		this.drawBackground(graphics);
		this.drawSubViews(graphics);
		this.drawBorder(graphics);
		this.drawDecorations(graphics);

		graphics.restore();
	}

	/**
	 * Translates given Graphics instance.</br>
	 * Called during drawing, subclasses may overwrite. Default implementation does nothing.
	 *
	 * @method translateGraphics
	 * @param {Graphics} graphics The graphics to use for drawing.
	 */
	translateGraphics(graphics) {}

	/**
	 * Draws the views background fill.</br>
	 * This applies inner format and shadow to provided Graphics instance.</br>
	 * Note: called during drawing, subclasses may overwrite.
	 *
	 * @method drawFill
	 * @param {Graphics} graphics The graphics to use for drawing.
	 */
	drawBackground(graphics) {
		// if (this._format.hasFill()) {
		const rect = this._bbox.toRectangle(JSG.rectCache.get());
		rect.setLocation(0, 0);
		if (this._format.applyFillToGraphics(graphics, rect)) {
			this._format.applyShadowToGraphics(graphics, rect);
			graphics.fillPolyline(this.getPoints());
			this._format.removeShadowFromGraphics(graphics);
		}
		JSG.rectCache.release(rect);
	}

	/**
	 * Draws the sub views of this view.</br>
	 * Note: called during drawing, subclasses may overwrite. Default implementation simply calls
	 * <code>draw</code> on each sub view.
	 *
	 * @method drawSubViews
	 * @param {Graphics} graphics The Graphics to use for drawing.
	 */
	drawSubViews(graphics) {
		graphics.save(this);
		graphics.startGroup();

		const origin = this._bbox.getTopLeft(JSG.ptCache.get());
		graphics.translate(origin.x, origin.y);
		JSG.ptCache.release(origin);

		this._subviews.forEach((subview) => {
			subview.draw(graphics);
		});

		graphics.endGroup();
		graphics.restore();
	}

	/**
	 * Strokes this view.</br>
	 * This applies inner line format to provided Graphics instance.</br>
	 * Note: called during drawing, subclasses may overwrite.
	 *
	 * @method drawBorder
	 * @param {Graphics} graphics The graphics to use for drawing.
	 */
	drawBorder(graphics) {
		// if (this._format.hasBorder()) {
		if (this._format.applyLineToGraphics(graphics)) {
			graphics.drawPolyline(this.getPoints(), true);
			this._format.removeLineFromGraphics(graphics);
		}
	}

	/**
	 * Used to draw any additional elements or components on top of this View.</br>
	 * Note: called during drawing, subclasses may overwrite. Default implementation does nothing.
	 *
	 * @method drawDecorations
	 * @param {Graphics} graphics The graphics to use for drawing.
	 */
	drawDecorations(graphics) {}
}

export default BBoxView;
