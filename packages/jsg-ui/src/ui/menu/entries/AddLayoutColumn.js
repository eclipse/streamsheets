/* global document */

import {default as JSG, ImagePool, Notification, NotificationCenter, LayoutNode, LayoutSection} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';


export default class AddLayoutColumn extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'addlayoutcolumn';
		this.group = 'layoutcolumn';
		this.element = new Image();
		this.element.src = `lib/res/svg/add.svg`
		this.element.style.cursor = 'pointer';
	}

	isVisible(item) {
		return (item instanceof LayoutNode) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			alert('add column');
			// this.createSelection(event, editor, item);
		}
		return handled;
	}


};
