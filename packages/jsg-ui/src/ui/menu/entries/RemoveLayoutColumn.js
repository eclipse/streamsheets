/* global document image */

import {
	LayoutNode,
	DeleteLayoutSectionCommand
} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';


export default class RemoveLayoutColumn extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'removelayoutcolumn';
		this.group = 'layoutcolumn2';
		this.element = new Image();
		this.element.src = `lib/res/svg/delete.svg`
		this.element.style.cursor = 'pointer';
		this.position = 'tri';
	}

	isVisible(item) {
		return (item instanceof LayoutNode) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			const cmd = new DeleteLayoutSectionCommand(item, item._columnData.length - 1, false);
			editor.getInteractionHandler().execute(cmd);
		}
		return handled;
	}


};
