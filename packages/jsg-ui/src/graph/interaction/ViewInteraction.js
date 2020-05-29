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
import { default as JSG, GraphUtils, Shape } from '@cedalo/jsg-core';
import Interaction from './Interaction';

/**
 * A ViewInteraction simply passes each retrieved event to its registered View instance.
 *
 * @class ViewInteraction
 * @extends Interaction
 * @param {View} A view instance to pass the events to.
 * @constructor
 */
class ViewInteraction extends Interaction {
	constructor(view) {
		super();
		this._view = view;
	}

	deactivate(viewer) {
		this._view = undefined;
		super.deactivate(viewer);
	}

	setCurrentLocation(point) {
		function translation(v) {
			v.translateFromParent(point);
		}

		// translate current location, so that it is relative to coordinate system of interaction view...
		if (this._view) {
			GraphUtils.traverseDown(this._view.getGraphView(), this._view, translation);
			super.setCurrentLocation(point);
		}
	}

	onMouseDown(event, viewer) {
		if (this._view && this._view.onMouseDown) {
			this._view.onMouseDown(this.currentLocation, viewer, event);
		} else {
			this._notifyMouseEvent(event);
		}
	}

	onMouseDrag(event, viewer) {
		this._notifyMouseEvent(event);
	}

	onMouseUp(event, viewer) {
		this._notifyMouseEvent(event);
		this.finishInteraction(event, viewer);
	}

	onMouseExit(event, viewer) {
		// cancel
		event.doRepaint = true; // we get canceled on exit, but have to do a repaint to show effect...
		this.cancelInteraction(event, viewer);
	}

	onMouseDoubleClick(event, viewer) {
		this._notifyMouseEvent(event);
	}

	onMouseMove(event, viewer) {
		this._notifyMouseEvent(event);
	}

	onMouseWheel(event, viewer) {
		this._notifyMouseEvent(event);
	}

	_notifyMouseEvent(event, viewer) {
		// we simply pass event to view
		if (this._view) {
			event.location.setTo(this.currentLocation);
			this._view.handleMouseEvent(event, viewer);
		}
	}

	onDragEnter(event, viewer) {
		this._notifyDragEvent(event);
	}

	onDragExit(event, viewer) {
		this._notifyDragEvent(event);
	}

	onDragLeave(event, viewer) {
		this._notifyDragEvent(event);
	}

	onDragOver(event, viewer) {
		this._notifyDragEvent(event);
	}

	onDrop(event, viewer) {
		this._notifyDragEvent(event);
	}

	_notifyDragEvent(event) {
		// we simply pass event to view
		if (this._view) {
			event.location.setTo(this.currentLocation);
			this._view.handleDragEvent(event);
		}
	}

	onKeyDown(event, viewer) {
		this._notifyKeyEvent(event);
	}

	onKeyUp(event, viewer) {
		this._notifyKeyEvent(event);
	}

	_notifyKeyEvent(event) {
		// we simply pass event to view
		if (this._view) {
			event.location.setTo(this.currentLocation);
			this._view.handleKeyEvent(event);
		}
	}

	// DON'T pass event to active interaction => fixes bug that next item is selected on mouse up!!
	//= > if we include it again, we should do it for certain situations only...
	// didFinish(event, viewer) {
	// ViewInteraction._super.didFinish.call(this, event, viewer);
	// if (!event.isConsumed && event instanceof MouseEvent) {
	// //pass event directly to interaction, so (e.g.) a selection is directly processed...
	// this.getInteractionHandler().handleMouseEvent(event);
	// }
	// };
}

export default ViewInteraction;
