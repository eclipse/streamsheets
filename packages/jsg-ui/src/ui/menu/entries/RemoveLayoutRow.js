/* global document image */

import {LayoutNode, DeleteLayoutSectionCommand} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';

export default class RemoveLayoutRow extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'removelayoutrow';
		this.group = 'layoutrow';
		this.element = new Image();
		this.element.src = `lib/res/svg/delete.svg`
		this.element.style.cursor = 'pointer';
		this.position = 'bli';
	}

	isVisible(item) {
		return (item instanceof LayoutNode) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			const cmd = new DeleteLayoutSectionCommand(item, item._rowData.length - 1, true);
			editor.getInteractionHandler().execute(cmd);
		}
		return handled;
	}


};
