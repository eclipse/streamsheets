import { default as JSG } from '@cedalo/jsg-core';
import Interaction from './Interaction';
import InteractionActivator from './InteractionActivator';

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
