/* global document image */

import {LayoutNode, AddLayoutSectionCommand} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';

export default class RowMenu extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'columnmenu';
		this.group = 'columnmenu';
		this.element = new Image();
		this.element.src = `lib/res/svg/columnmenu.svg`
		this.element.style.cursor = 'pointer';
		this.position = 'tri';
	}

	isVisible(item) {
		return (item.getParent() instanceof LayoutNode) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			const cmd = new AddLayoutSectionCommand(item, 4000, 'auto', true);
			editor.getInteractionHandler().execute(cmd);
		}
		return handled;
	}


};
