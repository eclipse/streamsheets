/* global document */

import ItemMenuProvider from './ItemMenuProvider';
import StreamChartSeries from './entries/StreamChartSeries';

const MENU_STYLE = 'jsg-item-menu';
const MENU_ROW_STYLE = 'jsg-item-menu-row';

/**
 * Used to create a default menu for general {{#crossLink "GraphItem"}}{{/crossLink}}s. The menu is
 * represented by a simple <code>div</code> element with a CSS style defined by
 * <code>JSGDefaultMenuProvider.STYLE</code>.
 * @class DefaultMenuProvider
 * @extends ItemMenuProvider
 * @constructor
 * @since 2.0.20.2
 */
export default class DefaultMenuProvider extends ItemMenuProvider {
	constructor() {
		super();
		this.entries = [];
		// add our default entries...
		this.addDefaultEntries();
	}

	static get MENU_STYLE() {
		return MENU_STYLE;
	}

	static get MENU_ROW_STYLE() {
		return MENU_ROW_STYLE;
	}

	addDefaultEntries() {
		// this.addEntry(new MenuDelete());
		this.addEntry(new StreamChartSeries());
	}

	// adds a MenuEntry to this provider
	addEntry(entry, menu) {
		entry.element.setAttribute('entry-id', entry.id);
		const group = this._getGroup(entry.group);
		group.push(entry);
	}

	_getGroup(name) {
		const _group = (lname, allgroups) => {
			let gr;
			for (let i = 0; i < allgroups.length && !gr; i += 1) {
				gr = allgroups[i]._id === lname ? allgroups[i] : undefined;
			}
			return gr;
		};

		name = name || 'common';
		let group = _group(name, this.entries);
		if (!group) {
			group = [];
			group._id = name;
			this.entries.push(group);
		}
		return group;
	}

	// called by framework to create an html-element which represents a menu for given item. return
	// <code>undefined</code> if item is not handled... creates a div-element with default style
	// ItemMenuProvider.STYLE_SELECTOR
	createMenu(item, editor) {
		let menu;
		const entries = this._filterEntries(item);

		if (entries.length) {
			menu = document.createElement('div');
			menu.className = DefaultMenuProvider.MENU_STYLE;
			this.addMouseListener(menu, item, editor);
			this.updateMenu(menu, item, editor, entries);
		}
		return menu;
	}

	_filterEntries(item) {
		const filtered = [];
		for (let i = 0; i < this.entries.length; i += 1) {
			const row = this._filteredRow(this.entries[i], item);
			if (row.length) {
				filtered.push(row);
			}
		}
		return filtered;
	}

	_filteredRow(row, item) {
		const filtered = [];
		for (let i = 0; i < row.length; i += 1) {
			if (row[i].isVisible(item)) {
				filtered.push(row[i]);
			}
		}
		return filtered;
	}

	updateMenu(menu, item, editor, entries) {
		entries = entries || this._filterEntries(item);
		this.clearMenu(menu);
		for (let i = 0; i < entries.length; i += 1) {
			this._addMenuRow(entries[i], menu, item);
		}
	}

	_addMenuRow(group, menu, item) {
		if (group.length) {
			// add entries
			const menurow = document.createElement('div');
			menurow.className = 'jsg-item-menu-row';
			for (let i = 0; i < group.length; i += 1) {
				menurow.appendChild(group[i].element);
			}
			menu.appendChild(menurow);
		}
	}

	handle(event, item, editor) {
		const entry = this.getEntry(event);
		return entry && entry.onEvent(event, item, editor);
	}

	getEntry(event) {
		let entry;
		const id = this._getEntryId(event.target);

		if (id) {
			const { entries } = this;
			for (let i = 0; i < entries.length && !entry; i += 1) {
				entry = this._getEntryFromGroup(id, entries[i]);
			}
		}
		return entry;
	}

	_getEntryId(el) {
		// TODO maybe we should traverse up until we found suitable attribute...
		return (el && el.getAttribute('entry-id')) || (el ? this._getEntryId(el.parentElement) : undefined);
	}

	_getEntryFromGroup(id, group) {
		let entry;
		for (let i = 0; i < group.length && !entry; i += 1) {
			entry = group[i];
			entry = entry.id === id ? entry : undefined;
		}
		return entry;
	}
}
