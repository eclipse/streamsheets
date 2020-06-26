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
import { default as JSG, GraphItem, Event, EventListener } from '@cedalo/jsg-core';
import NodeController from './NodeController';
import GroupView from '../view/GroupView';

/**
 * An <code>EventListener</code> subclass used by {{#crossLink "GroupController"}}{{/crossLink}}
 * to react on changes of group items.
 *
 * @class GroupListener
 * @extends EventListener
 * @constructor
 */
class GroupListener extends EventListener {
	constructor(groupcontroller) {
		super();
		this._group = groupcontroller.getModel();
	}

	handlePostEvent(event) {
		this._group.adaptBoundingBoxFromChildren();
	}
}


/**
 * A <code>GraphItemController</code> subclass used to implement behavior of {{#crossLink
 * "Group"}}{{/crossLink}}s.</br> The bounding-box of a group is determined by the bounding-boxes of
 * its inner items. Therefore a <code>GroupController</code> adds a listener to each group item in order to be notified
 * about any move, resize or rotate events.
 *
 * @class GroupController
 * @extends GraphItemController
 * @param {Group} group The group model associated with this controller.
 * @constructor
 */
class GroupController extends NodeController {
	constructor(group) {
		super(group);
		this._groupListener = new GroupListener(this);
		// register listener to all items currently in group...
		this._registerListenerToItems(group.getItems());
	}

	_registerListenerToItems(items) {
		items.forEach((item) => {
			this._registerGroupListener(item);
		});
	}

	createView(model) {
		return new GroupView(model);
	}

	// overwritten to set BoundingBox of inner feedback item...
	createFeedback() {
		const feedback = super.createFeedback();
		const groupbox = this.getModel().getTranslatedBoundingBox(this.getModel().getGraph(), JSG.boxCache.get());
		feedback.getItem().setBoundingBoxTo(groupbox);
		JSG.boxCache.release(groupbox);
		return feedback;
	}

	createFeedbackItem(detailed) {
		// TODO deep will copy everything... might not be wanted... -> introduce a level??
		return super.createFeedbackItem(true);
	}

	createFeedbackView(fbItem, detailed) {
		return super.createFeedbackView(fbItem, true);
	}

	containsPoint(location, findFlag) {
		// we contains point only if one of our children contains point...
		const position = JSG.ptCache.get().setTo(location);
		let contained = false;
		let i;
		let n;
		const kids = this.children;

		this.getModel().translateFromParent(position);

		for (i = 0, n = kids.length; i < n && !contained; i += 1) {
			contained = kids[i].containsPoint(position, findFlag);
		}
		JSG.ptCache.release(position);
		return contained;
	}

	handlePostEvent(event) {
		// check for add/remove events...
		switch (event.id) {
			case Event.ITEMREMOVE:
				this._unregisterGroupListener(event.value);
				this.getModel().adaptBoundingBoxFromChildren();
				break;
			case Event.ITEMADD:
				this._registerGroupListener(event.value);
				break;
		}
		super.handlePostEvent(event);
	}

	/**
	 * Unregisters our <code>EventListener</code> from given graph-item.
	 *
	 * @method _unregisterGroupListener
	 * @param {GraphItem} item The graph-item to unregister internal listener from.
	 * @private
	 */
	_unregisterGroupListener(item) {
		if (item && item instanceof GraphItem) {
			item.removeEventListener(Event.PIN, this._groupListener);
			item.removeEventListener(Event.BBOX, this._groupListener);
			item.removeEventListener(Event.ANGLE, this._groupListener);
		}
	}

	/**
	 * Registers our <code>EventListener</code> to given graph-item.
	 *
	 * @method _registerGroupListener
	 * @param {GraphItem} item The graph-item to register internal listener to.
	 * @private
	 */
	_registerGroupListener(item) {
		if (item && item instanceof GraphItem) {
			item.addEventListener(Event.PIN, this._groupListener);
			item.addEventListener(Event.BBOX, this._groupListener);
			item.addEventListener(Event.ANGLE, this._groupListener);
		}
	}
}

export default GroupController;
