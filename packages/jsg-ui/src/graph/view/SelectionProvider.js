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
import { Arrays, Notification, NotificationCenter, default as JSG, StableDictionary } from '@cedalo/jsg-core';

/**
 * The SelectionProvider maintains a map of currently selected {{#crossLink
 * "GraphItemController"}}{{/crossLink}}s.</br> There is only one SelectionProvider per
 * {{#crossLink "GraphView"}}{{/crossLink}} which can be obtained by calling {{#crossLink
 * "GraphViewer/getSelectionProvider:method"}}{{/crossLink}}.</br> To get informed about any selection
 * changes it is possible to either register a listener directly or to register to the {{#crossLink
 * "NotificationCenter"}}{{/crossLink}} for
 * {{#crossLink "SelectionProvider/SELECTION_CHANGED_NOTIFICATION:property"}}{{/crossLink}}
 * notifications.</br>
 *
 * A SelectionProvider sends following notification: </br>
 * <ul>
 *    <li>{{#crossLink "SelectionProvider/SELECTION_CHANGED_NOTIFICATION:property"}}{{/crossLink}}</li>
 * </ul>
 *
 * @class SelectionProvider
 * @constructor
 */
class SelectionProvider {
	constructor() {
		this.listeners = [];
		this._selection = new StableDictionary();
		this._selcontext = undefined;
	}

	/**
	 * Adds given listener to the list of listeners which will be notified when a selection changed event occurs.
	 *
	 * @method addSelectionChangedListener
	 * @param {Object} listener The listener object on which <code>onSelectionChanged()</code> is called.
	 */
	addSelectionChangedListener(listener) {
		this.listeners.push(listener);
	}

	/**
	 * Removes given listener from the list of listeners which will be notified when a selection changed event occurs.
	 *
	 * @method removeSelectionChangedListener
	 * @param {Object} listener The listener object to remove.
	 */
	removeSelectionChangedListener(listener) {
		Arrays.remove(this.listeners, listener);
	}

	/**
	 * Calls <code>onSelectionChanged()</code> on all registered listeners and sends a
	 * <code>SelectionChangedNotification</code> notification to the
	 * {{#crossLink "NotificationCenter"}}{{/crossLink}}.
	 *
	 * @method _notifySelectionChanged
	 * @private
	 */
	_notifySelectionChanged() {
		this.listeners.forEach((listener, index, array) => {
			listener.onSelectionChanged();
		});
		NotificationCenter.getInstance().send(new Notification(SelectionProvider.SELECTION_CHANGED_NOTIFICATION, this));
	}

	/**
	 * Returns the application or API dependent selection context. This might be <code>undefined</code>
	 * if it was not set or cleared.
	 *
	 * @method getSelectionContext
	 * @param {type} param_name param_description.
	 * @return {Object} The current selection context object or <code>undefined</code>
	 */
	getSelectionContext() {
		return this._selcontext;
	}

	/**
	 * Marks given controller as selected.</br>
	 * The optional <code>selcontext</code> parameter can be used to store additional API or application
	 * dependent information for this selection. Note: in each case calling this method overwrites an earlier
	 * <code>selcontext</code> object! Either with a new object or with <code>undefined</code> if no new
	 * <code>selcontext</code> object is provided.
	 *
	 * @method select
	 * @param {ModelController} controller The controller to select.
	 * @param {Object} [selcontext] An optional arbitrary selection context object. This overwrites current
	 * selection context object.
	 */
	select(controller, selcontext) {
		this._selcontext = selcontext;
		if (this._doSelect(controller)) {
			// JSG.debug.log(`SELECT: ${controller.getModel().getId()}`, JSG.debug.DUMP_ITEM_ID);
			this._notifySelectionChanged();
		}
	}

	/**
	 * Selects given controller.</br>
	 * This method does not send an event or notification.
	 *
	 * @method _doSelect
	 * @param {ModelController} controller The controller to select.
	 * @return {Boolean} <code>true</code> if given controller was selected, </code>false</code> otherwise.
	 * @private
	 */
	_doSelect(controller) {
		const model = controller.getModel();
		if (model.isProtected()) {
			return false;
		}
		const itemId = model.getId();
		if (!this._selection.contains(itemId)) {
			// first add item to map!!! otherwise we might come here via controller.setSelected() twice...
			this._selection.put(itemId, controller);
			controller.setSelected(true, true);
			return true;
		}
		return false;
	}

	/**
	 * Selects all controllers within given Array.</br>
	 * Note: this will not change or replace currently selection. Use
	 * {{#crossLink "SelectionProvider/setSelection:method"}}{{/crossLink}} to do this.</br>
	 * The optional <code>selcontext</code> parameter can be used to store additional API or application
	 * dependent information for this selection. Note: in each case calling this method overwrites an earlier
	 * <code>selcontext</code> object! Either with a new object or with <code>undefined</code> if no new
	 * <code>selcontext</code> object is provided.</br>
	 * This method sends a
	 * {{#crossLink "SelectionProvider/SELECTION_CHANGED_NOTIFICATION:property"}}{{/crossLink}}
	 * notification if at least one of the controller within given array was not selected before and
	 * is therefore added to inner selection list.
	 *
	 * @method selectAll
	 * @param {Array} controllers An array of controllers to select.
	 * @param {Object} [selcontext] An optional arbitrary selection context object. This overwrites current
	 * selection context object.
	 */
	selectAll(controllers, selcontext) {
		let notify = false;

		JSG.setDrawingDisabled(true);
		this._selcontext = selcontext;

		controllers.forEach((controller) => {
			if (!controller.isSelected() && this._doSelect(controller)) {
				notify = true;
			}
		});

		JSG.setDrawingDisabled(false);
		if (notify === true) {
			this._notifySelectionChanged();
		}
	}

	/**
	 * Sets current selection to the list of given controllers.</br>
	 * The optional <code>selcontext</code> parameter can be used to store additional API or application
	 * dependent information for this selection. Note: in each case calling this method overwrites an earlier
	 * <code>selcontext</code> object! Either with a new object or with <code>undefined</code> if no new
	 * <code>selcontext</code> object is provided.
	 *
	 * @method setSelection
	 * @param {Array} controllers An array of controllers to select.
	 * @param {Object} [selcontext] An optional arbitrary selection context object. This overwrites current
	 * selection context object.
	 */
	setSelection(controllers, selcontext) {
		// deselect current selection
		// deselect current selection
		this._deselectAll(this._selection.elements());
		this._selection.clear();
		this.selectAll(controllers, selcontext);
	}

	/**
	 * Deselects given controller if it was selected before and therefore is known to this SelectionProvider.
	 *
	 * @method deselect
	 * @param {ModelController} controller The controller to deselect.
	 */
	deselect(controller) {
		const itemId = controller.getModel().getId();
		if (this._selection.remove(itemId)) {
			controller.setSelected(false);
			this._notifySelectionChanged();
		}
	}

	_deselectAll(controllers) {
		for (let i = controllers.length - 1; i >= 0; i -= 1) {
			controllers[i].setSelected(false, true);
		}
	}

	/**
	 * Checks if there currently are any selected controllers.
	 *
	 * @method hasSelection
	 * @return {Boolean} <code>true</code> if selected controllers exists, <code>false</code> otherwise.
	 */
	hasSelection() {
		return !this._selection.isEmpty();
	}

	/**
	 * Checks if there is currently only one selected controller.
	 *
	 * @method hasSingleSelection
	 * @return {Boolean} <code>true</code> if only one controller is selected, <code>false</code> otherwise.
	 */
	hasSingleSelection() {
		return this._selection.size() === 1;
	}

	/**
	 * Checks if given item is selected, i.e. its corresponding controller is selected.
	 *
	 * @method isSelected
	 * @param {GraphItem} item The item to check selection for.
	 * @return {Boolean} <code>true</code> item's controller is selected, <code>false</code> otherwise.
	 */
	isSelected(item) {
		return this._selection.contains(item.getId());
	}

	/**
	 * Returns all currently selected Controllers.
	 *
	 * @method getSelection
	 * @return {Array} A list of all selected controllers.
	 */
	getSelection() {
		return this._selection.elements();
	}

	getSelectedItems() {
		const items = [];

		this._selection.iterate((key, value) => {
			items.push(value.getModel());
		});

		return items;
	}

	/**
	 * Gets first selected controller from current selection or <code>undefined</code> if no selection exists.<br/>
	 * See {{#crossLink "SelectionProvider/getLastSelection:method"}}{{/crossLink}} too.
	 *
	 * @method getFirstSelection
	 * @param {ModelController} controller The first selected controller from current selection or
	 *     <code>undefined</code>.
	 */
	getFirstSelection() {
		return this._selection.getFirst();
	}

	/**
	 * Gets last selected controller from current selection or <code>undefined</code> if no selection exists.<br/>
	 * See {{#crossLink "SelectionProvider/getFirstSelection:method"}}{{/crossLink}} too.
	 *
	 * @method getLastSelection
	 * @param {ModelController} controller The last selected controller from current selection or
	 *     <code>undefined</code>.
	 * @since 1.6.0
	 */
	getLastSelection() {
		return this._selection.getLast();
	}

	/**
	 * Deselects all currently selected controllers.</br>
	 * Note: this clears an optional selection context too.
	 *
	 * @method clearSelection
	 * @param {boolean} [notify=true] Send notification message. This might not be necessary, if another item is
	 *     selected directly after the selection is cleared.
	 */
	clearSelection(notify) {
		this._selcontext = undefined;
		if (!this._selection.isEmpty()) {
			this._deselectAll(this._selection.elements());
			this._selection.clear();

			if (notify === undefined || notify === true) {
				this._notifySelectionChanged();
			}
		}
	}

	/**
	 * Notification name which qualifies the notification send on selection changes.
	 *
	 * @property SELECTION_CHANGED_NOTIFICATION
	 * @type {String}
	 * @static
	 */
	static get SELECTION_CHANGED_NOTIFICATION() {
		return 'selectionprovider.selection.changed.notification';
	}
}

export default SelectionProvider;
