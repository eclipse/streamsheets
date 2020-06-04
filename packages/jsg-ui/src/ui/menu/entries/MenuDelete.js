import { default as JSG, ImagePool, DeleteItemCommand } from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';


export default class MenuDelete extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'del';
		this.element = JSG.imagePool.get(ImagePool.SVG_DELETE);
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			const cmd = new DeleteItemCommand(item);
			editor.getInteractionHandler().execute(cmd);
		}
		return handled;
	}
};
