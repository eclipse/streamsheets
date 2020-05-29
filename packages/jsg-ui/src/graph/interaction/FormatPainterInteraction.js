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
	TextNode,
	FormatAttributes,
	SetAttributesMapCommand,
	CompoundCommand,
	TextFormatAttributes,
	Dictionary,
	Shape
} from '@cedalo/jsg-core';
import Interaction from './Interaction';
import GraphController from '../controller/GraphController';

/**
 * An interaction which copies the format of given <code>GraphItem</code> and applies it to one or several other
 * <code>GraphItem</code>s on selection.
 *
 * @class FormatPainterInteraction
 * @extends Interaction
 * @param {GraphItem} pivot The <code>GraphItem</code> which provides the format attributes to apply.
 * @param {Boolean} [multi] An optional flag which indicates if the format should be applied to several
 *     <code>GraphItem</code>s. If not specified or set to <code>false</code> this interaction finishes directly after
 *     first was applied.
 * @constructor
 * @since 2.0.21.0
 */
class FormatPainterInteraction extends Interaction {
	constructor(pivot, multi) {
		super();
		this.isSingle = !multi;
		// take parent settings too! -> we have to set all formats!!
		this.format = pivot.getFormat().toMap(true);
		this.textformat = pivot.getTextFormat().toMap(true);
	}

	activate(viewer) {
		super.activate(viewer);
		// this.setCursor(Cursor.Style.FORMATPAINT);
		this.setCursor('copy');
	}

	deactivate(viewer) {
		super.deactivate(viewer);
		this.setCursor('auto');
	}

	onMouseUp(event, viewer) {}

	onMouseDown(event, viewer) {
		const target = this._getTargetItem(event, viewer);
		this._applyFormats(target, viewer);
		if (!target || this.isSingle) {
			this.finishInteraction(event, viewer);
		}
	}

	/**
	 * Tries to find a suited <code>GraphItem</code> on selection.
	 * @method _getTargetItem
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {GraphItem} The selected <code>GraphItem</code> or <code>undefined</code>.
	 * @private
	 */
	_getTargetItem(event, viewer) {
		const loc = JSG.ptCache.get().setTo(event.location);
		const controller = viewer.findControllerAt(loc, Shape.FindFlags.AUTOMATIC, this.findCondition.bind(this));
		JSG.ptCache.release(loc);
		return controller && controller.getModel();
	}

	/**
	 * A condition function which is called to determine a possible target item to apply formats to.
	 * @method findCondition
	 * @param {GraphItemController} controller The controller to check.
	 * @param {Point} location The location to look at.
	 * @return {Boolean} <code>true</code> if passed controller matches condition function, <code>false</code>
	 *     otherwise.
	 */
	findCondition(controller, location) {
		let valid = !(controller instanceof GraphController);
		if (valid) {
			// TODO review: strategy to find suited model... -> no itempart, must be selectable,
			const model = controller.getModel();
			valid =
				valid &&
				!model
					.getItemAttributes()
					.getItemPart()
					.getValue();
			valid = valid && !model.isSelectParentFirst();
			valid = valid && !(model instanceof TextNode && model.isAssociated());
			valid = valid && model.isSelectable();
		}
		return valid;
	}

	/**
	 * Applies formats to given <code>GraphItem</code>.
	 * @method _applyFormats
	 * @param {GraphItem} target The <code>GraphItem</code> to apply formats to.
	 * @param {ControllerViewer} viewer The currently used ControllerViewer.
	 * @private
	 */
	_applyFormats(target, viewer) {
		if (target) {
			const cmd = this.createApplyFormatsCmd(target);
			const inthandler = viewer.getInteractionHandler();
			inthandler.execute(cmd);
		}
	}

	/**
	 * Creates a new <code>Command</code> which applies formats to given <code>GraphItem</code>.
	 * @method createApplyFormatsCmd
	 * @param {GraphItem} target The <code>GraphItem</code> to apply formats to.
	 * @return {Command} A new <code>Command</code> which applies formats to given
	 *     <code>GraphItem</code>.
	 */
	createApplyFormatsCmd(target) {
		const cmd = new CompoundCommand();
		cmd.add(
			new SetAttributesMapCommand(
				target,
				this._filterMap(target.getFormat().toMap(true), this.format),
				FormatAttributes.NAME
			)
		);
		cmd.add(
			new SetAttributesMapCommand(
				target,
				this._filterMap(target.getTextFormat().toMap(true), this.textformat),
				TextFormatAttributes.NAME
			)
		);
		return cmd;
	}

	/**
	 * Filters given map and returns a new one which contains only those entries from given <code>frommap</code> which
	 * differs from entries contained in <code>map</code>.
	 * @method _filterMap
	 * @param {Dictionary} map The map to filter.
	 * @param {Dictionary} frommap The map which provides to entries to check against.
	 * @return {Dictionary} A new map which contains only those entries from given <code>frommap</code> which
	 *     differs from entries contained in <code>map</code>.
	 * @private
	 */
	_filterMap(map, frommap) {
		const _map = new Dictionary();
		frommap.iterate((key, el) => {
			const expr = map.get(key);
			if (expr && !expr.isEqualTo(el)) {
				_map.put(key, el);
			}
		});
		return _map;
	}
}

export default FormatPainterInteraction;
