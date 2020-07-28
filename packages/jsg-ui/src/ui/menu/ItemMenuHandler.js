import { default as JSG, GraphUtils, NotificationCenter } from '@cedalo/jsg-core';

import SelectionProvider from '../../graph/view/SelectionProvider';
import GraphItemController from '../../graph/controller/GraphItemController';
import InteractionHandler from '../../graph/interaction/InteractionHandler';

/**
 * An <code>ItemMenuHandler</code> is used to display custom elements next to a {{#crossLink
 * "JSG.graph.view.GraphItemView"}} of a corresponding selected {{/crossLink}}{{#crossLink
 * "JSG.graph.model.GraphItem"}}{{/crossLink}}.
 * @class ItemMenuHandler
 * @constructor
 * @since 2.0.20.1
 */
export default class ItemMenuHandler {
	constructor() {
		this.editor = undefined;
		this.provider = undefined;
		this.menuHandle = undefined;
	}

	// pass undefined to unregister editor
	registerEditor(editor) {
		const nc = NotificationCenter.getInstance();
		nc.unregister(this);
		if (editor) {
			nc.register(this, [
				SelectionProvider.SELECTION_CHANGED_NOTIFICATION,
				// GraphItemController.ITEM_CHANGED_NOTIFICATION,
				InteractionHandler.ACTIVE_INTERACTION_NOTIFICATION,
				NotificationCenter.SCROLL_NOTIFICATION,
				NotificationCenter.ZOOM_NOTIFICATION,
				NotificationCenter.DISPLAY_MODE_NOTIFICATION
			]);
		}
		this.hideMenu();
		this.editor = editor;
	}

	onNotification(notification) {
		const item = !this.hideMenuOnNotification(notification) && this._getSelectedItem(notification);
		if (item) {
			if (this.isVisible(item)) {
				this.placeMenu();
				this.updateMenu();
			} else {
				// remove any previous menu and create new one
				this.hideMenu();
				this.showMenu(item);
			}
		} else {
			this.hideMenu();
		}
	}

	hideMenuOnNotification(notification) {
		let hide = false;
		// hide if we scroll by panning...
		if (notification.name === NotificationCenter.SCROLL_NOTIFICATION) {
			const scrollpanel = notification.object;
			const scrollhandler = scrollpanel && scrollpanel._viewer && scrollpanel._viewer._scrollhandler;
			hide = scrollhandler && !!scrollhandler.isPanning;
		}
		return hide;
	}

	_getSelectedItem(notification) {
		const selprovider = this._isDefaultInteraction(notification) ? this.editor.getSelectionProvider() : undefined;
		const selection = selprovider && selprovider.hasSingleSelection() ? selprovider.getFirstSelection() : undefined;
		return selection && selection.getModel();
	}

	_isDefaultInteraction(notification) {
		const interactionhandler = notification.object instanceof InteractionHandler ? notification.object : undefined;
		return interactionhandler
			? interactionhandler.getActiveInteraction() === interactionhandler.getDefaultInteraction()
			: true;
	}

	hideMenu() {
		if (this.menuHandle && this.menuHandle.menu) {
			const canvas = this.getCanvas();
			canvas.parentNode.removeChild(this.menuHandle.menu);
			this.provider.removedMenu(this.menuHandle.menu);
		}
		this.menuHandle = undefined;
	}

	showMenu(item) {
		if (this.createMenu(item)) {
			this.placeMenu();
		}
	}

	createMenu(item) {
		this.menuHandle = this.createMenuHandle(item);
		if (this.menuHandle) {
			const menu = this.menuHandle.menu;
			this.getCanvas().parentNode.appendChild(menu);
		}
		return this.menuHandle;
	}

	createMenuHandle(item) {
		const menuEl = this.provider && this.provider.createMenu(item, this.editor);
		return menuEl && { menu: menuEl, item };
	}

	placeMenu() {
		const cs = this.getCS();
		const el = this.menuHandle.menu;
		const item = this.menuHandle.item;
		const pos = JSG.ptCache.get();
		const viewer = this.editor.getGraphViewer();
		const canvas = viewer.getCanvas();
		const itembox = item.getBoundingBox(JSG.boxCache.get());
		const itemrect = JSG.rectCache.get();
		GraphUtils.translateBoundingBoxUp(itembox, item.getParent(), item.getGraph());
		// pos.set(itembox.getRight(), itembox.getTop());
		// itembox.rotatePoint(pos);
		itembox.getBoundingRectangle(itemrect);
		pos.set(itemrect.getRight(), itemrect.y);
		viewer._translateToParent(pos);
		pos.x = cs.logToDeviceX(pos.x, false) + canvas.offsetLeft;
		pos.y = cs.logToDeviceY(pos.y, false) + canvas.offsetTop;
		el.style.top = `${pos.y}px`;
		el.style.left = `${pos.x + 5}px`;
		JSG.ptCache.release(pos);
		JSG.boxCache.release(itembox);
		JSG.rectCache.release(itemrect);
		// TODO resize/scale(!!) menu...
		// this.resizeMenu();
	}

	resizeMenu() {
		const cs = this.getCS();
		const el = this.menuHandle.menu;
		const item = this.menuHandle.item;
		// var settings =  item.getGraph().getSettings();
		// if(settings.isPageMode()) {
		//
		// }
		el.style.width = `${cs.logToDeviceX(cs.deviceToLogX(el.offsetWidth))}px`;
		el.style.height = `${cs.logToDeviceY(cs.deviceToLogY(el.offsetHeight))}px`;
		// console.log(`element size: ${el.style.width}, ${el.style.height}`);
	}

	isVisible(item) {
		return this.menuHandle && this.menuHandle.item === item;
	}

	// provider should fulfill ItemMenuProvider class...
	// last added provider will overwrite a previously added provider which handles same item....
	setMenuProvider(provider) {
		this.provider = provider;
	}

	getMenuProvider() {
		return this.provider;
	}

	// called on menu update, i.e. menu is already shown...
	updateMenu() {
		this.provider.updateMenu(this.menuHandle.menu, this.menuHandle.item, this.editor);
	}

	getCanvas() {
		return this.editor.getGraphicSystem().getCanvas();
	}

	getCS() {
		return this.editor.getGraphicSystem().getCoordinateSystem();
	}
}
