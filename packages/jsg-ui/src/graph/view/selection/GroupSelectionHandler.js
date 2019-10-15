import { default as JSG } from '@cedalo/jsg-core';
import BBoxSelectionHandler from './BBoxSelectionHandler';

/**
 * A <code>BBoxSelectionHandler</code> subclass to use for a single {{#crossLink
 * "Group"}}{{/crossLink}} selection.
 *
 * @class GroupSelectionHandler
 * @extends BBoxSelectionHandler
 * @constructor
 * @param {GraphItemView} [views]* The views which represent current selection. Either a single view or
 * an array of views can be passed.
 */
class GroupSelectionHandler extends BBoxSelectionHandler {
	// overwritten to set rotation pin always to center of group's bounding-box...
	refresh() {
		super.refresh();
		// set pin location to center of bbox size
		const pinpt = JSG.ptCache.get();
		pinpt.set(this._bbox.getWidth() / 2, this._bbox.getHeight() / 2);
		this._markers[8].setPinLocation(pinpt);
		JSG.ptCache.release(pinpt);
	}
}

export default GroupSelectionHandler;
