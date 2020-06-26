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
export default class DefaultTreeDataHandler {
	constructor(config) {
		if (config) {
			this.listener = config.listener;
			this.id = config.id;
		}
	}

	notify(eventType, treeitem, ...args) {
		if (
			this.listener &&
			typeof this.listener.onTreeChanged === 'function'
		) {
			this.listener.onTreeChanged(eventType, this.id, treeitem, args);
		}
	}

	onGet(treeitem, element, key) {
		this.notify('onGet', treeitem, element, key);
	}

	onSet(treeitem) {
		this.notify('onSet', treeitem);
	}

	onInit(treeitem) {
		this.notify('onInit', treeitem);
	}

	onAdd(treeitem) {
		this.notify('onAdd', treeitem);
	}

	onUpdate(treeitem) {
		if(typeof this.listener.onValidate === 'function') {
			treeitem = this.listener.onValidate(this.id, treeitem);
		}
		this.notify('onUpdate', treeitem);
	}

	onSelect(treeitem) {
		if(typeof this.listener.onSelect === 'function') {
			this.listener.onSelect(this.id, treeitem);
		}
	}
}

export const defaultTreeDataHandler = new DefaultTreeDataHandler();
