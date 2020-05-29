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
