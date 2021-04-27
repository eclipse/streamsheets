import { default as JSG, GraphUtils, NotificationCenter } from '@cedalo/jsg-core';

import SelectionProvider from '../../graph/view/SelectionProvider';
import InteractionHandler from '../../graph/interaction/InteractionHandler';
import WorksheetView from "../../graph/view/WorksheetView";

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
		this.menuHandleBL = undefined;
		this.menuHandleTR = undefined;
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
				WorksheetView.SHEET_SCROLL_NOTIFICATION,
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
		const hide = handle => {
			if (handle && handle.menu) {
				const canvas = this.getCanvas();
				canvas.parentNode.removeChild(handle.menu);
				this.provider.removedMenu(handle.menu);
			}
		}
		hide(this.menuHandleBL);
		hide(this.menuHandleTR);
		this.menuHandleBL = undefined;
		this.menuHandleTR = undefined;
	}

	showMenu(item) {
		if (this.createMenu(item)) {
			this.placeMenu();
		}
	}

	createMenu(item) {
		this.menuHandleBL = this.createMenuHandle(item, 'bl');
		if (this.menuHandleBL) {
			this.getCanvas().parentNode.appendChild(this.menuHandleBL.menu);
		}
		this.menuHandleTR = this.createMenuHandle(item, 'tr');
		if (this.menuHandleTR) {
			this.getCanvas().parentNode.appendChild(this.menuHandleTR.menu);
		}
		return this.menuHandleBL || this.menuHandleTR;
	}

	createMenuHandle(item, position) {
		const menuEl = this.provider && this.provider.createMenu(item, this.editor, position);
		return menuEl && { menu: menuEl, item, position };
	}

	placeMenu() {
		const cs = this.getCS();
		const pos = JSG.ptCache.get();
		const viewer = this.editor.getGraphViewer();
		const canvas = viewer.getCanvas();
		const itemrect = JSG.rectCache.get();

		const place = menuHandle => {
			if (menuHandle) {
				const el = menuHandle.menu;
				const item = menuHandle.item;
				const itembox = item.getBoundingBox(JSG.boxCache.get());

				GraphUtils.translateBoundingBoxUp(itembox, item.getParent(), item.getGraph());
				itembox.getBoundingRectangle(itemrect);

				if (menuHandle.position === 'tr') {
					pos.set(itemrect.getRight(), itemrect.y);
				} else {
					pos.set(itemrect.x, itemrect.getBottom());
				}

				viewer._translateToParent(pos);
				pos.x = cs.logToDeviceX(pos.x, false) + canvas.offsetLeft;
				pos.y = cs.logToDeviceY(pos.y, false) + canvas.offsetTop;

				el.style.top = `${pos.y}px`;
				el.style.left = `${pos.x + 5}px`;

				JSG.boxCache.release(itembox);
			}
		}

		place(this.menuHandleTR);
		place(this.menuHandleBL);

		JSG.ptCache.release(pos);
		JSG.rectCache.release(itemrect);
	}

	resizeMenu() {
		const cs = this.getCS();

		const resize = menuHandle => {
			if (menuHandle) {
				const el = menuHandle.menu;

				el.style.width = `${cs.logToDeviceX(cs.deviceToLogX(el.offsetWidth))}px`;
				el.style.height = `${cs.logToDeviceY(cs.deviceToLogY(el.offsetHeight))}px`;
			}
		}

		resize(this.menuHandleTR);
		resize(this.menuHandleBL);
	}

	isVisible(item) {
		return ((this.menuHandleBL && this.menuHandleBL.item === item) ||
			(this.menuHandleTR && this.menuHandleTR.item === item));
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
		if (this.menuHandleBL) {
			this.provider.updateMenu(this.menuHandleBL.menu, this.menuHandleBL.item, this.editor);
		}
		if (this.menuHandleTR) {
			this.provider.updateMenu(this.menuHandleTR.menu, this.menuHandleTR.item, this.editor);
		}
	}

	getCanvas() {
		return this.editor.getGraphicSystem().getCanvas();
	}

	getCS() {
		return this.editor.getGraphicSystem().getCoordinateSystem();
	}
}
