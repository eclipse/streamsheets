/* global document image */

import {
	LayoutNode,
	AddLayoutSectionCommand,
	NotificationCenter,
	Notification, default as JSG
} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';

export default class RowMenu extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'rowmenu';
		this.group = 'rowmenu';
		this.element = new Image();
		this.element.src = `lib/res/svg/rowmenu.svg`
		this.element.style.cursor = 'pointer';
		this.position = 'tri';
	}

	isVisible(item) {
		return (item.getParent() instanceof LayoutNode) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			if (!item.isProtected()) {
				NotificationCenter.getInstance().send(
					new Notification(JSG.LAYOUT_SHOW_CONTEXT_MENU_NOTIFICATION_ROW, {event, open: true})
				);
			}
		}
		return handled;
	}


};
