import {
	LineConnection,
	TextNode,
	Dictionary,
	SetLineShapePointsCommand,
	BoundingBox,
	TextNodeAttributes,
	ResizeItemCommand,
	GraphUtils,
	Point,
	default as JSG
} from '@cedalo/jsg-core';
import AbstractInteraction from './AbstractInteraction';
import SnapHelper from './SnapHelper';
import EdgeFeedback from '../feedback/EdgeFeedback';
import LayerId from '../view/LayerId';
import SelectionFeedbackView from '../view/SelectionFeedbackView';

/**
 * Internally used structure to track information during resize.<br/>
 * This namely stores and updates the relation between the BoundingBox of given feedback and the BoundingBox of current
 * selection. This is useful for multiple selection.
 *
 * @class FeedbackStructure
 * @constructor
 * @param {Feedback} feedback The feedback to create this structure for
 * @param {BoundingBox} selbbox The BoundingBox of current selection.
 */
class FeedbackStructure {
	constructor(feedback, selbbox) {
		const selbboxTopleft = selbbox.getTopLeft();
		const selsize = selbbox.getSize();

		const toFactor = (point) => {
			point.subtract(selbboxTopleft);
			selbbox.rotateLocalPointInverse(point);
			point.set(point.x / selsize.x, point.y / selsize.y);
			return point;
		};

		this.feedback = feedback;
		const bbox = feedback.getBoundingBox();

		this._bbox = bbox.copy();
		this._topleftfactor = toFactor(bbox.getTopLeft());
		this._bottomrightfactor = toFactor(bbox.getBottomRight());
	}

	/**
	 * Updates this structure using actualized BoundingBox of current selection.
	 *
	 * @method update
	 * @param {BoundingBox} selbbox The BoundingBox of current selection.
	 */
	update(selbbox) {
		this.feedback.resize(selbbox);

		const size = selbbox.getSize();
		const selbboxTopleft = selbbox.getTopLeft();
		const fbItem = this.feedback.getFeedbackItem();

		const fromFactor = (factor, point) => {
			point.set(factor.x * size.x, factor.y * size.y);
			selbbox.rotateLocalPoint(point);
			point.add(selbboxTopleft);
			return point;
		};

		const newTopLeft = fromFactor(this._topleftfactor, new Point(0, 0));
		const newBottomRight = fromFactor(this._bottomrightfactor, new Point(0, 0));

		if (
			this.feedback
				.getItemAttributes()
				.getSizeable()
				.getValue()
		) {
			this._bbox.setTopLeftTo(newTopLeft);
			this._bbox.setBottomRightTo(newBottomRight);
			fbItem.setBoundingBoxTo(this._bbox);
			// no need to refresh, its done within setBoundingBoxTo and maybe unwanted for certain items (e.g. Group)
			if (fbItem instanceof TextNode) {
				// TODO comment out again, because it should not be necessary!
				fbItem.refresh();
			}
		}
	}
}

/**
 * A private custom snap helper for resize interaction
 *
 * @class ResizeSnapHelper
 * @extends SnapHelper
 * @constructor
 * @since 1.6.0
 */
class ResizeSnapHelper extends SnapHelper {
	constructor() {
		super();

		this.bbox = new BoundingBox();
		this.index = undefined;
	}

	/**
	 * Custom <code>snapToBBox</code> implementation called by <code>ResizeInteraction</code>.<br/>
	 * Stores provided BoundingBox and resize handle index.<br/>
	 * See {{#crossLink "SnapHelper/snapToBBox:method"}}{{/crossLink}} too.
	 *
	 * @method snapToBBox
	 * @param {BoundingBox} bbox The <code>BoundingBox</code> to align.
	 * @param {Number} index The index of the used resize handle.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @param {Point} [reusepoint] An optional point to reuse for returned offset. If not provided a new
	 *     one will be created.
	 * @return {Point} The align offset.
	 * @since 1.6.0
	 */
	snapToBBox(bbox, index, viewer, reusepoint) {
		this.index = index;
		this.bbox.setTo(bbox);
		const offset = super.snapToBBox(bbox, undefined, viewer, reusepoint);
		return offset;
	}

	// overwritten
	getSnapLinesForRect(rect, viewer) {
		const index = this.index;
		let lines = super.getSnapLinesForRect(rect, viewer);
		if (index > -1) {
			const filter = this.bbox && Math.abs(this.bbox.getAngle()) < 0.001 ? this._filter : this._filterRotated;
			lines = filter.call(this, lines, rect, viewer);
		}
		return lines;
	}

	/**
	 * Filters given list of snap lines in case of an unrotated selection.
	 *
	 * @method _filter
	 * @param {Array} lines The snap-lines to filter.
	 * @param {Rectangle} rect The resized <code>Rectangle</code> to snap to.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @return {Array} The list of snap-lines which match filter.
	 * @private
	 * @since 1.6.0
	 */
	_filter(lines, rect, viewer) {
		const index = this.index;
		lines.vertical = lines.vertical.filter((line) => {
			let ok = false;
			switch (line.pivot) {
			case 'l':
				ok = index < 1 || index > 5;
				break;
			case 'r':
				ok = index > 1 && index < 5;
				break;
			}
			return ok;
		});
		lines.horizontal = lines.horizontal.filter((line) => {
			let ok = false;
			switch (line.pivot) {
			case 't':
				ok = index < 3;
				break;
			case 'b':
				ok = index > 3 && index < 7;
				break;
			}
			return ok;
		});
		return lines;
	}

	/**
	 * Filters given list of snap lines in case of a rotated selection.
	 *
	 * @method _filterRotated
	 * @param {Array} lines The snap-lines to filter.
	 * @param {Rectangle} rect The resized <code>Rectangle</code> to snap to.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @return {Array} The list of snap-lines which match filter.
	 * @private
	 * @since 1.6.0
	 */
	_filterRotated(lines, rect, viewer) {
		const pivot = this._getSnapPivot(rect, this.index);
		lines.vertical = lines.vertical.filter((line) => line.pivot === pivot);
		lines.horizontal = lines.horizontal.filter((line) => line.pivot === pivot);
		return lines;
	}

	/**
	 * Returns the pivot of the snap-line to snap to. <code>undefined</code> is returned if no pivot could be
	 * determined.
	 *
	 * @method _getSnapPivot
	 * @param {Rectangle} rect The resized <code>Rectangle</code> to snap to.
	 * @param {Number} index The index of the used resize handle.
	 * @return {String} The pivot of the snap-line to snap to or <code>undefined</code>.
	 * @private
	 * @since 1.6.0
	 */
	_getSnapPivot(rect, index) {
		let pivot;
		// attention: we currently support only even index, i.e. resize at corner point...
		if (index % 2 === 0) {
			index /= 2;
			const bbox = this.bbox;
			const center = bbox.getCenter(JSG.ptCache.get(), true);
			const corner = bbox.getCornerAt(index, JSG.ptCache.get());
			const rectbox = rect.toBoundingBox(JSG.boxCache.get());
			const rectindex = rectbox.getIntersectionIndex(center, corner);
			switch (rectindex) {
			case 0:
				pivot = 't';
				break;
			case 1:
				pivot = 'r';
				break;
			case 2:
				pivot = 'b';
				break;
			case 3:
				pivot = 'l';
				break;
			}
			JSG.ptCache.release(center, corner);
			JSG.boxCache.release(rectbox);
		}
		return pivot;
	}

	getSnapControllerCondition(viewer) {
		return (controller, box) => {
			const item = controller.getModel();
			return (
				!(item instanceof LineConnection) &&
				item.isVisible() &&
				item
					.getItemAttributes()
					.getSnapTo()
					.getValue() &&
				!controller.isSelected()
			);
		};
	}
}


/**
 * A general interaction to handle resize of {{#crossLink "GraphItem"}}{{/crossLink}}s.</br>
 * This can be used to perform a resize based on the {{#crossLink "BoundingBox"}}{{/crossLink}} of one
 * or several GraphItems. For other, somewhat specialized resize interactions see
 * {{#crossLink "ResizeEdgeInteraction"}}{{/crossLink}},
 * {{#crossLink "ResizeOrthoEdgeInteraction"}}{{/crossLink}} and
 * {{#crossLink "ResizeLineNodeInteraction"}}{{/crossLink}}.
 *
 *
 * @class ResizeInteraction
 * @extends AbstractInteraction
 * @constructor
 * @param {SelectionHandle} activeHandle The SelectionHandle to use for resize.
 */
class ResizeInteraction extends AbstractInteraction {
	constructor(activeHandle) {
		super();

		this._activeHandle = activeHandle;
		this._fbStructures = undefined;
		this._selectionbox = undefined;
		this._snaphelper = undefined;
	}

	deactivate(viewer) {
		viewer.getSelectionView().setVisible(true);
		this._selectionbox = undefined;
		this._fbStructures = undefined;
		this._activeHandle = undefined;
		this.getSnapHelper().release(viewer);
		super.deactivate(viewer);
	}

	getSnapHelper() {
		this._snaphelper = this._snaphelper || new ResizeSnapHelper();
		return this._snaphelper;
	}

	onMouseDown(event, viewer) {
		this.getSnapHelper().init(viewer);
		this._fbStructures = new Dictionary();
		this._selectionbox = new BoundingBox(0, 0);
		viewer.getSelectionView().getBoundingBox(this._selectionbox);
		viewer.getSelectionView().setVisible(false);

		super.onMouseDown(event, viewer);
	}

	createActionFeedback(event, viewer) {
		const handle = this._activeHandle;
		if (handle) {
			const feedback = new SelectionFeedbackView(handle.getPointIndex());
			feedback.setBoundingBox(this._selectionbox);
			return feedback;
		}

		return undefined;
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback) {
			if (this._selectionbox) {
				this.actionFeedback.setBoundingBox(this._selectionbox);
			}
		}
	}

	_createSelectionFeedback(controller, viewer) {
		const feedback = super._createSelectionFeedback(controller, viewer);
		feedback.initResize(this._selectionbox);
		if (feedback.getFeedbackItem() instanceof TextNode) {
			const attributes = feedback.getFeedbackItem().getItemAttributes();
			let mode = attributes.getSizeMode().getValue();
			if (mode !== TextNodeAttributes.SizeMode.NONE) {
				mode |= TextNodeAttributes.SizeMode.WIDTH;
				mode &= ~TextNodeAttributes.SizeMode.TEXT;
			}
			attributes.setSizeMode(mode);
		}
		const view = controller.getView();
		// store new feedback structure...
		this._fbStructures.put(
			view.getId(),
			new FeedbackStructure(feedback, this._selectionbox)
		);
		return feedback;
	}

	updateFeedback(event, viewer, offset) {
		const self = this;
		const bbox = this._selectionbox;
		const handle = this._activeHandle;
		const index = handle.getPointIndex();

		if (index > -1) {
			const gridpt = self.alignToGrid(this.currentLocation, viewer, event.event.altKey, JSG.ptCache.get());
			this._toBBox(bbox, gridpt, offset);
			this._resizeBBox(bbox, offset, index);
			// SNAP IT:
			this._alignToSnapLines(bbox, index, viewer, offset);
			this._toBBox(bbox, gridpt.add(offset), offset);
			this._resizeBBox(bbox, offset, index);

			JSG.ptCache.release(gridpt);
			// apply new box to selection:
			this._fbStructures.iterate((id, fbStr) => {
				fbStr.update(bbox); // self._selectionbox);
			});
		}
	}

	_toBBox(bbox, pt, reusepoint) {
		const boxpt = reusepoint || new Point();
		const topleft = bbox.getTopLeft(JSG.ptCache.get());
		boxpt.setTo(pt);
		boxpt.subtract(topleft);
		bbox.rotateLocalPointInverse(boxpt);
		JSG.ptCache.release(topleft);
		return boxpt;
	}

	_resizeBBox(bbox, offset, index) {
		const size = bbox.getSize(JSG.ptCache.get());
		const topleft = bbox.getTopLeft(JSG.ptCache.get());
		switch (index) {
			case 0:
				topleft.add(offset);
				bbox.rotatePoint(topleft);
				bbox.setTopLeftTo(topleft);
				offset.multiply(-1);
				offset.add(size);
				break;
			case 1:
				topleft.set(topleft.x, topleft.y + offset.y);
				bbox.rotatePoint(topleft);
				bbox.setTopLeftTo(topleft);
				offset.set(size.x, size.y - offset.y);
				break;
			case 2:
				topleft.set(topleft.x, topleft.y + offset.y);
				bbox.rotatePoint(topleft);
				bbox.setTopLeftTo(topleft);
				offset.set(offset.x, size.y - offset.y);
				break;
			case 3:
				offset.y = size.y;
				break;
			// case 4: nothing to do, can keep offset...
			case 5:
				offset.x = size.x;
				break;
			case 6:
				topleft.set(topleft.x + offset.x, topleft.y);
				bbox.rotatePoint(topleft);
				bbox.setTopLeftTo(topleft);
				offset.set(size.x - offset.x, offset.y);
				break;
			case 7:
				topleft.set(topleft.x + offset.x, topleft.y);
				bbox.rotatePoint(topleft);
				bbox.setTopLeftTo(topleft);
				offset.set(size.x - offset.x, size.y);
				break;
		}
		bbox.setSizeTo(offset);
		JSG.ptCache.release(size, topleft);
	}

	// snap
	_alignToSnapLines(bbox, index, viewer, reusepoint) {
		viewer.clearLayer(LayerId.SNAPLINES);
		const offset = reusepoint || new Point();
		const snaphelper = this.getSnapHelper();
		snaphelper.snapToBBox(bbox, index, viewer, offset);
		return offset;
	}

	/**
	 * Creates the resize command to execute.
	 *
	 * @method createCommand
	 * @param {Point} offset The offset between start and current event. Usually the difference between
	 *     start and current location.
	 * @param {GraphItemController} selectedController The currently selected controller.
	 * @return {ResizeItemCommand} An instance of a ResizeItemCommand to be executed.
	 */
	createCommand(offset, selectedController) {
		// -1- get corresponding feedback

		const createSetLineShapePointsCommand = (selController, feedback) => {
			const view = selController.getView();
			const item = selController.getModel();
			const points = feedback.getPoints();
			// translate down to item parent...
			points.forEach((point) => {
				GraphUtils.traverseDown(view.getGraphView(), view.getParent(), (v) => {
					v.translateFromParent(point);
					return true;
				});
			});
			return new SetLineShapePointsCommand(item, points);
		};

		const view = selectedController.getView();
		const fbContext = this._fbStructures.get(view.getId());
		if (fbContext) {
			if (fbContext.feedback instanceof EdgeFeedback) {
				return createSetLineShapePointsCommand(selectedController, fbContext.feedback);
			}
			const bbox = fbContext.feedback.getBoundingBox(JSG.boxCache.get());

			// translate topleft to meet parent coordinatesystem:
			const parent = view.getParent();
			const topleft = bbox.getTopLeft();
			const rootView = selectedController.getViewer().rootController.getView();
			GraphUtils.traverseDown(rootView, parent, (v) => {
				// angle -= v.getAngle();
				v.translateFromParent(topleft);
				return true;
			});
			bbox.setTopLeftTo(topleft);
			bbox.setAngle(view.getAngle());
			const cmd = new ResizeItemCommand(view._item, bbox);
			JSG.boxCache.release(bbox);
			return cmd;
		}

		return undefined;
	}
}



export default ResizeInteraction;
