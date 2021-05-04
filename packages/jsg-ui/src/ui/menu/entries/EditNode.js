/* global document */

import {
	StreamSheetContainerWrapper,
	SetAttributeAtPathCommand,
	ItemAttributes,
	CompoundCommand,
	AttributeUtils, ChangeItemOrderCommand
} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';

export default class EditNode extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'editnode';
		this.group = 'editnode';
		this.element = new Image();
		this.element.src = `lib/res/svg/edit.svg`
		this.element.style.cursor = 'pointer';
		this.position = 'tr';
	}

	isVisible(item) {
		return (item instanceof StreamSheetContainerWrapper) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			const sheet = item.streamsheet;
			if (sheet) {
				const path = AttributeUtils.createPath(ItemAttributes.NAME, 'visible');
				editor.getGraphViewer().clearSelection();
				const cmd = new CompoundCommand();
				cmd.add(new SetAttributeAtPathCommand(sheet, path, true));
				cmd.add(new ChangeItemOrderCommand(sheet, ChangeItemOrderCommand.Action.TOTOP, editor.getGraphViewer(), true));

				editor.getInteractionHandler().execute(cmd);
			}
		}
		return handled;
	}
};
