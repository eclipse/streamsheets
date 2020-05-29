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
	CompoundCommand,
	SetAttributeAtPathCommand,
	SetSizeCommand,
	AttributeUtils,
	ItemAttributes
} from '@cedalo/jsg-core';

import Interaction from './Interaction';
import Feedback from '../feedback/Feedback';

/**
 * Interaction that handles Splitter movement resizing of attached items.
 *
 * @class SplitterInteraction
 *
 * @constructor
 */
export default class SplitterInteraction extends Interaction {
	constructor() {
		super();

		this._controller = undefined;
		this._feedback = undefined;
	}

	deactivate(viewer) {
		viewer.removeInteractionFeedback(this._feedback);

		this._feedback = undefined;

		super.deactivate(viewer);
	}

	onMouseDrag(event, viewer) {
		this._getFeedback(viewer);

		const coordinates = this._calcCoordinates(event, viewer);
		if (coordinates === undefined) {
			return;
		}

		const origin = this._origin.copy();
		const item = this._controller.getModel();

		if (item.getDirection() === ItemAttributes.Direction.VERTICAL) {
			origin.x += coordinates.change;
		} else {
			origin.y += coordinates.change;
		}
		this._feedback.setOriginTo(origin);
	}

	onMouseDoubleClick(event /* , viewer */) {
		event.isConsumed = true;
		event.hasActivated = true;
	}

	willFinish(event, viewer) {
		const coordinates = this._calcCoordinates(event, viewer);
		if (coordinates === undefined) {
			return;
		}

		const item = this._controller.getModel();
		const container = item.getParent();
		let containerToResize = item.getContainerToResize();
		if (containerToResize === undefined) {
			containerToResize = this._controller.getModel().getParent();
		}
		const pos = item.getIndex();
		let itemToSize;
		let box;
		const cmds = new CompoundCommand();

		if (item.getItemToResize()) {
			itemToSize = item.getItemToResize();
		} else if (pos === 0) {
			itemToSize = container.getItemAt(1);
		} else {
			itemToSize = container.getItemAt(pos - 1);
		}

		if (item.getDirection() === ItemAttributes.Direction.VERTICAL) {
			if (container.setSizeFromSplitter) {
				container.setSizeFromSplitter(cmds, itemToSize, coordinates);
			} else {
				const size = itemToSize.getSize();
				size.setWidth(coordinates.newSize);
				cmds.add(new SetSizeCommand(itemToSize, size));
			}
		} else if (container.setSizeFromSplitter) {
			container.setSizeFromSplitter(cmds, itemToSize, coordinates);
		} else {
			const size = itemToSize.getSize();
			size.setHeight(coordinates.newSize);
			cmds.add(new SetSizeCommand(itemToSize, size));
		}

		const visible = coordinates.newSize > JSG.MIN_WIDTH_HEIGHT;
		const path = AttributeUtils.createPath(ItemAttributes.NAME, ItemAttributes.VISIBLE);
		cmds.add(new SetAttributeAtPathCommand(itemToSize, path, visible));

		if (item.getDirection() === ItemAttributes.Direction.HORIZONTAL) {
			box = containerToResize.getBoundingBox();
			if (pos === 0) {
				box._topleft.y += coordinates.change;
			} else {
				box._bottomright.y += coordinates.change;
			}
			cmds.add(new JSG.ResizeItemCommand(containerToResize, box));
		}

		item.getGraph().markDirty();
		this.getInteractionHandler().execute(cmds);
	}

	_calcCoordinates(event, viewer) {
		const tmppoint = event.location.copy();
		viewer.translateFromParent(tmppoint);

		const container = this._controller.getModel().getParent();
		const item = this._controller.getModel();
		const pos = item.getIndex();
		let size = 0;
		let itemToSize;
		let newSize;
		let change;

		if (item.getItemToResize()) {
			itemToSize = item.getItemToResize();
		} else if (pos === 0) {
			// first item -> only resize next item, if existing
			itemToSize = container.getItemAt(1);
		} else {
			itemToSize = container.getItemAt(pos - 1);
		}
		if (itemToSize === undefined) {
			return undefined;
		}

		if (item.getDirection() === ItemAttributes.Direction.VERTICAL) {
			change = tmppoint.x - this.startLocation.x;

			if (itemToSize.isVisible()) {
				size = itemToSize.getWidth().getValue();
			}
		} else {
			change = tmppoint.y - this.startLocation.y;

			if (itemToSize.isVisible()) {
				size = itemToSize.getHeight().getValue();
			}
		}

		if (pos === 0 || pos < itemToSize.getIndex()) {
			newSize = size - change;
			if (container.adjustHeight) {
				newSize = container.adjustHeight(itemToSize, newSize);
			}

			if (newSize <= JSG.MIN_WIDTH_HEIGHT) {
				newSize = 0;
			}
			change = size - newSize;
		} else {
			newSize = size + change;
			if (container.adjustHeight) {
				newSize = container.adjustHeight(itemToSize, newSize);
			}

			if (newSize <= JSG.MIN_WIDTH_HEIGHT) {
				newSize = 0;
			}
			change = newSize - size;
		}

		return {
			change,
			newSize
		};
	}

	cancelInteraction(event, viewer) {
		if (event !== undefined) {
			event.doRepaint = true;
		}
		this._controller = undefined;

		super.cancelInteraction(event, viewer);
	}

	/**
	 * Creates, if necessary, and returns the view to use as interaction feedback.
	 *
	 * @method _getFeedbackRect
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {MarqueeFeedbackView} The feedback view.
	 * @private
	 */
	_getFeedback(viewer) {
		if (this._feedback) {
			return this._feedback;
		}

		const model = this._controller.getModel();
		const fbItem = model.copy(true);
		const fbView = this._controller.createFeedbackView(fbItem, false);
		const feedback = new Feedback(fbItem, fbView, model);

		viewer.addInteractionFeedback(feedback);

		feedback.init();

		this._origin = feedback.getOrigin();
		this._feedback = feedback;

		return this._feedback;
	}
}
