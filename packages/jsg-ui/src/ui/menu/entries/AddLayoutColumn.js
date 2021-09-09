/* global document image */

import {
	LayoutNode,
	AddLayoutSectionCommand
} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';


export default class AddLayoutColumn extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'addlayoutcolumn';
		this.group = 'layoutcolumn1';
		this.element = new Image();
		this.element.src = `lib/res/svg/add.svg`
		this.element.style.cursor = 'pointer';
		this.position = 'tri';
	}

	isVisible(item) {
		return (item instanceof LayoutNode) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			const cmd = new AddLayoutSectionCommand(item, 30, 'relative', false);
			editor.getInteractionHandler().execute(cmd);
		}
		return handled;
	}


};
