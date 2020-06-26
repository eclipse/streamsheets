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
import Interaction from './Interaction';

/**
 * An interaction subclass to perform a pan gesture.<br/>
 * This gesture is used on touch devices to scroll a view.
 *
 * @class PanInteraction
 * @extends Interaction
 * @constructor
 */
class PanInteraction extends Interaction {
	constructor() {
		super();
		this._startScroll = undefined;
	}

	activate(viewer) {
		this._startScroll = undefined;
	}

	onPanStart(event, viewer) {
		const panel = viewer.getScrollPanel();
		this._startScroll = panel.getScrollPosition();
	}

	onPan(event, viewer) {
		if (this._startScroll) {
			const panel = viewer.getScrollPanel();
			const cs = viewer.getCoordinateSystem();
			panel.setScrollPosition(
				-this._startScroll.x - cs.deviceToLogX(event.gesture.deltaX),
				-this._startScroll.y - cs.deviceToLogY(event.gesture.deltaY)
			);
		}
	}

	onPanEnd(event, viewer) {
		this._startScroll = undefined;
	}
}

export default PanInteraction;
