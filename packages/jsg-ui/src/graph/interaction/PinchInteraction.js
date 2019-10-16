import { default as JSG } from '@cedalo/jsg-core';
import Interaction from './Interaction';
import InteractionActivator from './InteractionActivator';

/**
 * An interaction subclass to perform a pinch gesture.<br/>
 * This gesture is used on touch devices to zoom in our out with two fingers.
 *
 * @class PinchInteraction
 * @extends Interaction
 * @constructor
 */
class PinchInteraction extends Interaction {
	constructor() {
		super();
		this._startZoom = undefined;
	}

	activate(viewer) {
		this._startZoom = undefined;
	}

	onPinchStart(event, viewer) {
		this._startZoom = viewer.getZoom();
	}

	onPinch(event, viewer) {
		if (this._startZoom) {
			viewer.setZoom(this._startZoom * event.gesture.scale);
		}
	}

	onPinchEnd(event, viewer) {
		this._startZoom = undefined;
	}
}

export default PinchInteraction;
