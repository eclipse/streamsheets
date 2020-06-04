
const STYLE_SELECTOR = 'jsg-item-menu';

/**
 * Used to create a default menu, i.e. an empty <code>div</code> element with a CSS style defined by
 * <code>ItemMenuProvider.STYLE_SELECTOR</code>.
 * @class ItemMenuProvider
 * @constructor
 * @since 2.0.20.1
 */
export default class ItemMenuProvider {
	// called by framework to create an html-element which represents a menu for given item. return <code>undefined</code>
	// if item is not handled... creates a div-element with default style class ItemMenuProvider.STYLE_SELECTOR
	createMenu(item, editor) {
		return undefined;
	}

	static get STYLE_SELECTOR() {
		return STYLE_SELECTOR;
	}

	// called by framework to update currently visible menu...
	updateMenu(item, editor) {}

	// called by framework when menu was removed
	removedMenu() {}

	// helper method to add mouse listener to given menu. please refer to handle() too.
	addMouseListener(menu, item, editor) {
		/* eslint-disable func-names */
		const eventListener = function(event) {
			this._on(event, item, editor);
		}.bind(this);
		/* eslint-enable func-names */
		menu.addEventListener('click', eventListener);
		menu.addEventListener('dragstart', eventListener);
		menu.addEventListener('mousedown', eventListener);
	}

	_on(event, item, editor) {
		if (this.handle(event, item, editor)) {
			event.stopPropagation();
		}
		event.preventDefault();
	}

	// called by framework to handle mouse events
	handle(event, item, editor) {}

	clearMenu(menu) {
		while (menu.hasChildNodes()) {
			menu.removeChild(menu.lastChild);
		}
	}
}

