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
/* global document */

import {
	BoundingBox,
	NotificationCenter,
	FormatAttributes,
	Rectangle,
	default as JSG
} from '@cedalo/jsg-core';
import Widget from './Widget';
import RangeModel from './scrollview/RangeModel';
import ScalableGraphics from './graphics/ScalableGraphics';

/**
 * Class to manage and display a vertical or horizontal scale based on current coordinate system.</br>
 * The coordinate system and graph settings are provided by specified GraphViewer instance. Note: a scale provides an
 * <code>onRangeChange<code> method so it can be added as an observer to a {{#crossLink
 * "RangeModel"}}{{/crossLink}}. This is useful for scrolling in order to update the Scale
 * automatically.
 *
 * @class Scale
 * @extends Widget
 * @constructor
 * @param {Boolean} isVertical Specify <code>true</code>, to create a vertical scale and <code>false</code> to create a
 *     horizontal.
 * @param {GraphViewer} viewer The graph viewer currently used for displaying graph content.
 */
class Scale extends Widget {
	constructor(isVertical, viewer) {
		super();

		this._size = 750;
		this._scrollpos = 0;
		this._isVertical = isVertical;
		this._viewer = viewer;
		// private object to store information used for drawing...
		this._drawctxt = {};
		this._drawctxt.bounds = new Rectangle();
		this._drawctxt.graphBounds = new BoundingBox();

		this._steps = { minor: 0, major: 0 };
		this._repaint = true;

		this.setVisible(true);
		this.getFormat().setFillColor(JSG.bkColorHeader);
		this.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);

		const nc = NotificationCenter.getInstance();
		nc.register(this, NotificationCenter.SCROLL_NOTIFICATION);
		nc.register(this, NotificationCenter.ZOOM_NOTIFICATION);
		nc.register(this, NotificationCenter.DISPLAY_MODE_NOTIFICATION);
	}

	destroy() {
		const nc = NotificationCenter.getInstance();
		nc.unregister(this, NotificationCenter.SCROLL_NOTIFICATION);
		nc.unregister(this, NotificationCenter.ZOOM_NOTIFICATION);
		nc.unregister(this, NotificationCenter.DISPLAY_MODE_NOTIFICATION);
	}


	onNotification(notification) {
		switch (notification.name) {
		case NotificationCenter.SCROLL_NOTIFICATION:
		case NotificationCenter.ZOOM_NOTIFICATION:
		case NotificationCenter.DISPLAY_MODE_NOTIFICATION:
			this._repaint = true;
			break;
		}
	}

	isEndless() {
		const settings = this._viewer.getGraphSettings();
		return settings ? settings.getScaleEndless() : false;
	}

	/**
	 * Gets current scale visibility.</br>
	 * Note: returned value corresponds to the current property value in {{#crossLink
	 * "GraphSettings"}}{{/crossLink}}.
	 *
	 * @method isVisible
	 * @return {Boolean} <code>true</code>, if scale is visible, otherwise <code>false</code>.
	 */
	isVisible() {
		const settings = this._viewer.getGraphSettings();
		return settings ? settings.getScaleVisible() : this._isVisible;
	}

	/**
	 * Sets the scale visible flag.</br>
	 * Note: this will change corresponding property value in {{#crossLink
	 * "GraphSettings"}}{{/crossLink}}.
	 *
	 * @method setVisible
	 * @param {Boolean} doIt Specify <code>true</code> to show scale or <code>false</code> to hide it.
	 */
	setVisible(doIt) {
		this._isVisible = doIt;
		const settings = this._viewer.getGraphSettings();
		if (settings) {
			settings.setScaleVisible(doIt);
		}
	}

	/**
	 * Gets Scale height.
	 *
	 * @method getHeight
	 * @return {Number} Height in logical units not zoomed.
	 */
	getHeight() {
		return this._viewer.getCoordinateSystem().metricToLogYNoZoom(this._size);
	}

	/**
	 * Gets Scale width.
	 *
	 * @method getWidth
	 * @return {Number} Width in logical units not zoomed.
	 */
	getWidth() {
		return this._viewer.getCoordinateSystem().metricToLogXNoZoom(this._size);
	}

	/**
	 * Implements the contract for a {{#crossLink "RangeModel"}}{{/crossLink}} observer.</br>
	 * This will simply update the inner scroll position of this Scale.
	 *
	 * @method onRangeChange
	 * @param {RangeModel} range The RangeModel which has changed.
	 * @param {Number} type    A change type constant which is one of the predefined by RangeModel.
	 */
	onRangeChange(range, type) {
		if (type === RangeModel.CHANGED_VALUE) {
			this._scrollpos = -range.getValue();
		}
	}

	/**
	 * Draws the Scale content depending on current scroll position and display mode settings.
	 *
	 * @method drawBackground
	 * @param {Graphics} graphics Graphics to use for drawing.
	 */
	drawBackground(graphics) {
		const cs = this._viewer.getCoordinateSystem();
		const graph = this._viewer.getGraph();
		const context = this._drawctxt;
		const settings = graph ? graph.getSettings() : undefined;
		if (settings === undefined) {
			return;
		}

		if (this._canvas === undefined) {
			this._canvas = document.createElement('canvas');
			this._repaint = true;
		}

		const graphbounds = graph.getBoundingBox(JSG.boxCache.get());

		if (!context.bounds.isEqualTo(this._bounds) ||
			!context.graphBounds.isEqualTo(graphbounds) ||
			this._repaint) {
			this._graphics = new ScalableGraphics(this._canvas, cs);

			// define draw context:
			context.cs = cs;
			context.graph = graph;
			context.bounds.setTo(this._bounds);
			context.scaleBounds = this._bounds.copy();
			context.graphBounds = graphbounds.copy();
			context.topleft = graphbounds.getTopLeft(JSG.ptCache.get());
			context.zoom = cs.getZoom();
			context.majorStep = cs.getMajorUnit();
			context.minorStep = cs.getMinorUnit();

			this._canvas.width = cs.logToDeviceX(context.scaleBounds.width + 1000);
			this._canvas.height = cs.logToDeviceX(context.scaleBounds.height + 1000);

			if (this._canvas.width === 0 || this._canvas.height === 0) {
				// nothing to draw -> leads to error in IE11
				return;
			}

			this._graphics.save();
			this._graphics.setClip(context.bounds);
			this._graphics.setFillColor(graphics.getFillColor());
			this._graphics.fillRect(context.bounds);

			if (this._isVertical) {
				this.drawVertical(this._graphics, context);
			} else {
				this.drawHorizontal(this._graphics, context);
			}

			this._graphics.restore();
			this._repaint = false;

			JSG.ptCache.release(context.topleft);
		}

		JSG.boxCache.release(graphbounds);

		graphics.drawImage(this._canvas, 0, 0);
	}

	/**
	 * Draws a horizontal Scale.
	 *
	 * @method drawHorizontal
	 * @param {Graphics} graphics Graphics to use for drawing.
	 * @param {Object} context The internally used drawing context which provides additional information.
	 */
	drawHorizontal(graphics, context) {
		graphics.translate(context.bounds.x + this._scrollpos, 0);
		graphics.setLineColor('#555555');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.getContext().textBaseline = 'middle';
		graphics.getContext().textAlign = 'center';
		this._drawHorEndless(graphics, context);
	}


	_drawHorEndless(graphics, context) {
		const textY0 = this.getHeight() / 2;
		const markerY0 = (context.bounds.height * 3 / 8) - 1;
		const markerY1 = (context.bounds.height * 5 / 8);
		let width = 0;
		let x;

		if (this.isEndless()) {
			x = -this._scrollpos;
			width = context.bounds.width;
		}

		const steps = this._getNextSteps(x, context, this._steps);

		// draw background:
		context.scaleBounds.set(x, context.bounds.height / 4, width, context.bounds.height / 2);
		graphics.setFillColor('#FFFFFF');
		graphics.fillRect(context.scaleBounds);
		// draw marker:
		graphics.beginPath();
		graphics.setFillColor('#777777');
		for (; steps.minor < width || steps.major < width;) {
			if (context.zoom > 0.4 && (steps.minor > 0 && steps.minor < width)) {
				graphics.moveTo(x + steps.minor, markerY0);
				graphics.lineTo(x + steps.minor, markerY1);
			}
			if (steps.major > 0 && steps.major < width) {
				graphics.fillText(context.cs.getMajorUnitString(x + steps.major).toFixed(0), x + steps.major, textY0);
			}
			steps.minor += context.majorStep;
			steps.major += (context.zoom > 0.5) ? context.majorStep : (context.zoom > 0.3) ?
				(context.majorStep * 2) : (context.majorStep * 5);
		}
		graphics.stroke();
	}

	/**
	 * Draws a vertical Scale.
	 *
	 * @method drawVertical
	 * @param {Graphics} graphics Graphics to use for drawing.
	 * @param {Object} context The internally used drawing context which provides additional information.
	 */
	drawVertical(graphics, context) {
		graphics.translate(0, context.bounds.y + this._scrollpos);
		graphics.setLineColor('#555555');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.getContext().textBaseline = 'middle';
		graphics.getContext().textAlign = 'center';
		this._drawVerEndless(graphics, context);
	}

	_drawVerEndless(graphics, context) {
		const textX0 = this.getWidth() / 2;
		const markerX0 = (context.bounds.width * 3 / 8);
		const markerX1 = (context.bounds.width * 5 / 8);
		let height = 0;
		let y;

		if (this.isEndless()) {
			height = context.bounds.height;
			y = -this._scrollpos;
		}

		const steps = this._getNextSteps(y, context, this._steps);

		// draw background:
		context.scaleBounds.set(context.bounds.width / 4, y, context.bounds.width / 2, height);
		graphics.setFillColor('#FFFFFF');
		// graphics.setFillColor("#FF0000");
		graphics.fillRect(context.scaleBounds);
		// draw marker...
		graphics.beginPath();
		graphics.setFillColor('#777777');
		for (; steps.minor < height || steps.major < height;) {
			if (context.zoom > 0.4 && (steps.minor > 0 && steps.minor < height)) {
				graphics.moveTo(markerX0, y + steps.minor);
				graphics.lineTo(markerX1, y + steps.minor);
			}
			if (steps.major > 0 && steps.major < height) {
				graphics.translate(textX0, y + steps.major);
				graphics.rotate(-Math.PI_2);
				graphics.fillText(context.cs.getMajorUnitString(y + steps.major).toFixed(0), 0, 0);
				graphics.rotate(Math.PI_2);
				graphics.translate(-textX0, -(y + steps.major));
			}
			steps.minor += context.majorStep;
			steps.major += (context.zoom > 0.5) ? context.majorStep : (context.zoom > 0.3) ?
				(context.majorStep * 2) : (context.majorStep * 5);
		}
		graphics.stroke();
	}

	_getNextSteps(value, context, reusesteps) {
		const steps = reusesteps || { major: 0, minor: 0 };
		steps.major = Math.abs(value) % context.majorStep;
		steps.major = (value < 0) ? steps.major : context.majorStep - steps.major;
		if (steps.major > context.minorStep) {
			// special case for value = 0 -> major == majorStep...
			steps.minor = (steps.major === context.majorStep) ?
				steps.major - context.minorStep : steps.major % context.minorStep;
		} else {
			steps.minor = steps.major + context.minorStep;
		}
		return steps;
	}
}

export default Scale;
