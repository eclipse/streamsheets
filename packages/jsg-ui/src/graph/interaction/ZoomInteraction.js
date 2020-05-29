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
import { default as JSG, Point } from '@cedalo/jsg-core';
import Interaction from './Interaction';
import MarqueeFeedbackView from '../view/MarqueeFeedbackView';
import Cursor from '../../ui/Cursor';

/**
 * An interaction subclass that handles zooming using the mouse.
 * This is done by spanning a rectangle area over the area, that should be zoomed to.
 *
 * @class ZoomInteraction
 * @extends Interaction
 * @constructor
 * @since 1.6.0
 */
class ZoomInteraction extends Interaction {
	constructor() {
		super();
		// the feedback rectangle:
		this._feedbackRect = undefined;
	}

	deactivate(viewer) {
		viewer.removeInteractionFeedback(this._feedbackRect);
		this._feedbackRect = undefined;
		super.deactivate(viewer);
	}

	onMouseMove(event, viewer) {
		this.setCursor(Cursor.Style.CROSS);
		event.isConsumed = true;
	}

	onMouseDrag(event, viewer) {
		// show and update feedback rectangle...
		const tmppoint = new Point(0, 0);
		tmppoint.setTo(event.location);
		viewer.translateFromParent(tmppoint);
		const feedback = this._getFeedbackRect(viewer);
		feedback.setBounds(
			Math.min(this.startLocation.x, tmppoint.x),
			Math.min(this.startLocation.y, tmppoint.y),
			Math.abs(tmppoint.x - this.startLocation.x),
			Math.abs(tmppoint.y - this.startLocation.y)
		);
	}

	/**
	 * Created, if necessary, and returns the view to use as interaction feedback.
	 *
	 * @method _getFeedbackRect
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {MarqueeFeedbackView} The feedback view.
	 * @private
	 * @since 1.6.0
	 */
	_getFeedbackRect(viewer) {
		if (!this._feedbackRect) {
			viewer.clearInteractionFeedback();
			this._feedbackRect = new MarqueeFeedbackView();
			viewer.addInteractionFeedback(this._feedbackRect);
		}
		return this._feedbackRect;
	}

	willFinish(event, viewer, offset) {
		if (this._feedbackRect === undefined) {
			return;
		}

		// evaluate and set the scroll position and zoom factor from the selected rectangle
		const rect = this._feedbackRect.getBounds(JSG.rectCache.get());
		const settings = viewer.getGraphSettings();
		const canvas = viewer.getGraphicSystem().getCanvas();
		const cs = viewer.getCoordinateSystem();
		const tl = JSG.ptCache.get(rect.x, rect.y);
		const br = JSG.ptCache.get(rect.getRight(), rect.getBottom());

		const xfact = (cs.deviceToLogXNoZoom(canvas.width) - 1250) / (br.x - tl.x);
		const yfact = (cs.deviceToLogYNoZoom(canvas.height) - 1250) / (br.y - tl.y);

		viewer.setZoom(Math.min(xfact, yfact));
		viewer.getScrollPanel().setScrollPosition(tl.x, tl.y);

		JSG.ptCache.release(tl, br);
		JSG.rectCache.release(rect);
	}

	onMouseExit(event, viewer) {
		this.cancelInteraction(event, viewer);
	}

	cancelInteraction(event, viewer) {
		if (event) {
			event.doRepaint = true;
		}
		this.setCursor(Cursor.Style.AUTO);
		super.cancelInteraction(event, viewer);
	}
}

export default ZoomInteraction;
