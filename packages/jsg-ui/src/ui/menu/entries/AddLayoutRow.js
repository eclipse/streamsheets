/* global document */

import {LayoutNode, AddLayoutSectionCommand} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';

export default class AddLayoutRow extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'addlayoutrow';
		this.group = 'layoutrow';
		this.element = new Image();
		this.element.src = `lib/res/svg/add.svg`
		this.element.style.cursor = 'pointer';
		this.position = 'bl';
	}

	isVisible(item) {
		return (item instanceof LayoutNode) && !item.isProtected();
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
