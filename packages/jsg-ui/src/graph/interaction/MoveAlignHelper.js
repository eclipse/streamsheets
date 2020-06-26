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
import { default as JSG, MathUtils, ItemAttributes } from '@cedalo/jsg-core';

/**
 * Helper class to align feedback on {{#crossLink "MoveInteraction"}}{{/crossLink}}s. An instance
 * of this class is registered to the {{#crossLink "MoveDelegate"}}{{/crossLink}} of a
 * MoveInteraction.
 *
 * @class MoveAlignHelper
 * @constructor
 */
class MoveAlignHelper {
	/**
	 * Returns the default <code>MoveAlignHelper</code> implementation.<br/>
	 * Subclasses can simply replace this method to globally register a customized <code>MoveAlignHelper</code>.
	 *
	 * @method getDefault
	 * @return {MoveAlignHelper} The global default <code>MoveAlignHelper</code> to use.
	 */
	static getDefault() {
		return new MoveAlignHelper();
	}

	/**
	 * Checks if a horizontal or vertical align should be done.
	 *
	 * @method doAlignHV
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The current used ControllerViewer.
	 * @return {Boolean} <code>true</code> if a horizontal or vertical align should be done, <code>false</code>
	 *     otherwise.
	 */
	doAlignHV(event, viewer) {
		return event && event.event.shiftKey;
	}

	/**
	 * Aligns given new position either horizontally or vertically.<br/>
	 * Note: this calls {{#crossLink "MoveAlignHelper/doAlignHV:method"}}{{/crossLink}} to check
	 * if this kind of alignment should be done.
	 *
	 * @method alignToHV
	 * @param {Point} newposition The position to align.
	 * @param {Point} startpos The start position to use as reference for alignment.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The current used ControllerViewer.
	 * @return {Point} The aligned position point.
	 */
	alignToHV(newposition, startpos, event, viewer) {
		if (this.doAlignHV(event, viewer)) {
			const offset = JSG.ptCache
				.get()
				.setTo(newposition)
				.subtract(startpos);
			if (Math.abs(newposition.x - startpos.x) > Math.abs(newposition.y - startpos.y)) {
				offset.y = 0;
			} else {
				offset.x = 0;
			}
			newposition.setTo(startpos).add(offset);
			JSG.ptCache.release(offset);
		}
		return newposition;
	}

	/**
	 * Aligns given feedback.<br/>
	 * The alignment takes the current moveable setting of the {{#crossLink
	 * "GraphItem"}}{{/crossLink}}s into account which are referenced by inner {{#crossLink
	 * "Feedback"}}{{/crossLink}}s, i.e. available via
	 * {{#crossLink "FeedbackView/getFeedbacks:method"}}{{/crossLink}}. The moveable setting can be
	 * get and set by using the {{#crossLink "ItemAttributes"}}{{/crossLink}} of a GraphItem.
	 *
	 * @method alignFeedback
	 * @param {FeedbackView} feedback The feedback to align.
	 * @param {Point} startpos The start position to use as reference for alignment.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The current used ControllerViewer.
	 */
	alignFeedback(feedback, startpos, event, viewer) {
		// align according to item settings...
		const offset = JSG.ptCache.get();
		const topleft = feedback.getLocation(JSG.ptCache.get());
		const feedbacks = feedback.getFeedbacks();
		offset.setTo(topleft).subtract(startpos);
		// now here we have settings for each individual feedback!!!
		const graph = viewer.getGraph();

		feedbacks.forEach((fb) => {
			const item = fb.getOriginalItem();
			const fbItem = fb.getFeedbackItem();
			const moveable = item
				.getItemAttributes()
				.getMoveable()
				.getValue();
			if ((moveable & ItemAttributes.Moveable.BOTH) !== ItemAttributes.Moveable.BOTH) {
				if (moveable & ItemAttributes.Moveable.VERTICAL) {
					offset.x = 0;
				} else if (moveable & ItemAttributes.Moveable.HORIZONTAL) {
					offset.y = 0;
				}
			}
			if (moveable & ItemAttributes.Moveable.LIMITTOCONTAINER) {
				const fbBox = fbItem.getBoundingBox(JSG.boxCache.get());
				const parentBox = item.getParent().getTranslatedBoundingBox(graph, JSG.boxCache.get());

				const pt = JSG.ptCache.get();
				const ptmax = JSG.ptCache.get(0, 0);
				const boxpt = JSG.ptCache.get();
				for (let k = 0; k < 4; k += 1) {
					if (this._getOffsetToBBox(fbBox.getCornerAt(k, boxpt), parentBox, pt)) {
						if (pt.length() > ptmax.length()) {
							ptmax.setTo(pt);
						}
					}
				}
				offset.subtract(ptmax);
				JSG.ptCache.release(pt, ptmax, boxpt);
				JSG.boxCache.release(fbBox, parentBox);
			}
		});

		// position.setTo(topleft.add(offset));
		topleft.setTo(startpos).add(offset);
		feedback.setLocationTo(topleft);
		JSG.ptCache.release(offset, topleft);
	}

	/**
	 * Returns the offset of given point to specified BoundingBox.
	 *
	 * @method _getOffsetToBBox
	 * @param {Point} point The point to get the offset for.
	 * @param {Point} offset A point to take the offset values.
	 * @return {Boolean} <code>true</code> if a valid offset could be determined, <code>false</code> otherwise.
	 * @private
	 */
	_getOffsetToBBox(point, bbox, offset) {
		let valid = false;
		const boxcenter = bbox.getCenter(JSG.ptCache.get(), true);
		let i = 0;
		const pt1 = JSG.ptCache.get();
		const pt2 = JSG.ptCache.get();
		for (i = 0; i < 4; i += 1) {
			bbox.getCornerAt(i, pt1);
			bbox.getCornerAt((i + 1) % 4, pt2);
			if (MathUtils.getIntersectionOfLines(pt1, pt2, point, boxcenter, offset, false)) {
				MathUtils.getLinePointOffset(pt1, pt2, point, offset);
				valid = true;
				break;
			}
		}
		JSG.ptCache.release(boxcenter, pt1, pt2);
		return valid;
	}
}

export default MoveAlignHelper;
