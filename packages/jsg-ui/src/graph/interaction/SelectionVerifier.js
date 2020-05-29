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
import { GraphUtils, TextNode, Graph, default as JSG } from '@cedalo/jsg-core';

/**
 * A simple helper class which is used by {{#crossLink "Interaction"}}{{/crossLink}}s or
 * {{#crossLink "InteractionActivator"}}{{/crossLink}}s to verify instances of
 * {{#crossLink "ModelController"}}{{/crossLink}} before they get selected.<br/>
 * The default implementation can be received via {{#crossLink
 * "SelectionVerifier/getDefault:method"}}{{/crossLink}}. Applications may replace this method to
 * return a custom verifier object. The returned object must provide at least the methods defined by the default
 * <code>SelectionVerifier</code> implementation. Although currently is not used.
 *
 * @class SelectionVerifier
 * @since 1.6.18
 */
const SelectionVerifier = {};

SelectionVerifier.prototype = (() => {
	// private methods:
	/**
	 * Checks if given controller represents a {{#crossLink "TextNode"}}{{/crossLink}} and might
	 * returns
	 * its parent controller which should be selected first.
	 *
	 * @method _checkTextSelection
	 * @param {ModelController} controller The controller to be selected.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happened.
	 * @return {ModelController} The passed controller or a different one which should be selected
	 *     instead.
	 * @private
	 */
	function checkTextSelection(controller, viewer) {
		let parentctrlr;
		let pbox;
		let mbox;
		const model = controller.getModel();
		const parent = model.getParent();

		// for labels we ensure parent first selection...
		if (model instanceof TextNode && model.isAssociated() && parent.isSelectable() && !(parent instanceof Graph)) {
			parentctrlr = controller.getParent();
			if (!parentctrlr.isSelected()) {
				// selection is ok, if a sibling is already selected...
				const prevsel = viewer.getSelectionProvider().getFirstSelection();
				if (!prevsel || prevsel.getParent() !== parentctrlr) {
					pbox = parent.getBoundingBox(JSG.boxCache.get());
					mbox = model.getTranslatedBoundingBox(parent.getParent(), JSG.boxCache.get());
					if (pbox.doesIntersectWith(mbox)) {
						controller = parentctrlr;
					}
					JSG.boxCache.release(pbox, mbox);
				}
			}
		}
		return controller;
	}

	/**
	 * Checks given controller if it has a group parent which might be selected first.
	 *
	 * @method _checkGroupSelection
	 * @param {ModelController} controller The controller to be selected.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happened.
	 * @return {ModelController} The passed controller or a {{#crossLink
	 *     "GroupController"}}{{/crossLink}} to select.
	 * @private
	 */
	function checkGroupSelection(controller, viewer) {
		const groupcontroller = GraphUtils.getGroupController(controller);
		const selectionProvider = viewer.getSelectionProvider();
		if (selectionProvider.hasSingleSelection() && groupcontroller) {
			// check if current selection belongs to same group:
			const grpcontroller = GraphUtils.getGroupController(selectionProvider.getFirstSelection());
			return groupcontroller !== grpcontroller ? groupcontroller : controller;
		}
		return groupcontroller || controller;
	}

	// public API:
	return {
		// check selected controller:
		/**
		 * Checks if given controller is a valid selection. If it is not another controller is returned which should be
		 * selected instead.
		 *
		 * @method checkSingle
		 * @param {ModelController} selection The controller to be selected.
		 * @param {ControllerViewer} viewer The currently active controller viewer.
		 * @return {ModelController} Either the passed controller if it is valid or another
		 *     controller which should be selected instead.
		 */
		checkSingle(selection, viewer) {
			selection = checkGroupSelection.call(this, selection, viewer);
			return checkTextSelection(selection, viewer);
		},
		/**
		 * Checks a list of controllers. The given list might be adjusted depending on the contained controllers.<br/>
		 * This method is currently not used within this API. Might change in future versions. Default implementation
		 * does nothing and simply returns given list.
		 *
		 * @method checkMulti
		 * @param {Array} selection A list of controllers to check.
		 * @param {ControllerViewer} viewer The currently active controller viewer.
		 * @return {Array} A possible adjusted list of controllers to select.
		 */
		checkMulti(selection, viewer) {
			return selection;
		}
	};
})();

/**
 * Returns the default <code>SelectionVerifier</code> implementation used within various interactions. Currently only
 * <code>Group</code> or <code>TextNode</code> selections are verified and possibly adjusted.<br/>
 * Custom applications can simply replace this method to return a customized <code>SelectionVerifier</code>.
 *
 * @method getDefault
 * @return {SelectionVerifier} The default <code>SelectionVerifier</code> to use.
 * @static
 */
SelectionVerifier.getDefault = (() => {
	const instance = Object.create(SelectionVerifier.prototype);
	return () => instance;
})();

export default SelectionVerifier;
