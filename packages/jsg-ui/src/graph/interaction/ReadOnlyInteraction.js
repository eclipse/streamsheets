/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
/* eslint-disable no-fallthrough */

import GraphInteraction from './GraphInteraction';
import EditTextActivator from './EditTextActivator';
import LinkActivator from './LinkActivator';
import TooltipActivator from './TooltipActivator';
import MarqueeActivator from './MarqueeActivator';
import Styles from '../view/selection/Styles';
import Cursor from '../../ui/Cursor';

/**
 * Default read-only mode interaction based on GraphInteraction.<br/>
 * In this view mode only selection is possible. To give a visual feedback for this mode the grid is hidden and the
 * selection style of registered {{#crossLink "SelectionView"}}{{/crossLink}} is adjusted.
 * Both is done in {{#crossLink "ReadOnlyInteraction/initAsDefault:method"}}{{/crossLink}} and
 * reverted in {{#crossLink "ReadOnlyInteraction/disposeAsDefault:method"}}{{/crossLink}}.
 *
 * @class ReadOnlyInteraction
 * @extends GraphInteraction
 * @constructor
 */
class ReadOnlyInteraction extends GraphInteraction {
	constructor() {
		super();
		this._oldGraphSettings = undefined;
	}

	registerActivators() {
		// allow selection:
		this.addActivator(MarqueeActivator.KEY, new MarqueeActivator());
		this.addActivator(EditTextActivator.KEY, new EditTextActivator());
		this.addActivator(TooltipActivator.KEY, new TooltipActivator());
		this.addActivator(LinkActivator.KEY, new LinkActivator());
	}

	initAsDefault(viewer) {
		super.initAsDefault(viewer);
		const selectionView = viewer.getSelectionView();
		if (selectionView) {
			const style = this.createSelectionStyle();
			style.orgstyle = selectionView.getStyle();
			selectionView.setStyle(style);
		}
		const graph = viewer.getGraph();
		const settings = graph ? graph.getSettings() : undefined;
		if (settings) {
			this._oldGraphSettings = settings.copy();
			settings.setGridVisible(false);
		}
	}

	disposeAsDefault(viewer) {
		super.disposeAsDefault(viewer);
		const graph = viewer.getGraph();
		const settings = graph ? graph.getSettings() : undefined;
		if (settings && this._oldGraphSettings) {
			settings.setTo(this._oldGraphSettings);
		}
		const selectionView = viewer.getSelectionView();
		if (selectionView) {
			const style = selectionView.getStyle();
			if (style.orgstyle) {
				selectionView.setStyle(style.orgstyle);
			}
		}
	}

	setCursor(cursor) {
		// allow only auto cursor...
		if (cursor === Cursor.Style.AUTO || cursor === Cursor.Style.EXECUTE) {
			super.setCursor(cursor);
		}
	}

	getActiveHandle() {
		return undefined;
	}

	_updateCursor(event, viewer) {
		if (!event.isConsumed && !event.hasActivated) {
			this._setActiveHandle(undefined);
		}
	}

	onKeyDown(event, viewer) {
		// allow only following key events:
		switch (event.key) {
			case 9:
			// tab selection...
			case 27:
			// ESC
			case 65:
			// ctrl a -> select all
			case 107:
			// + -> zoom
			case 109:
				// + -> zoomy
				super.onKeyDown(event, viewer);
				break;
		}
	}

	onKeyUp(event, viewer) {}

	/**
	 * Returns the <code>SelectionStyle</code> object to use for {{#crossLink
	 * "SelectionView"}}{{/crossLink}}.
	 *
	 * @method createSelectionStyle
	 * @return {SelectionHandlerFactory} The selection style to use for this interaction.
	 * @since 1.6.40
	 */
	createSelectionStyle() {
		return Styles.READ_ONLY;
	}
}

export default ReadOnlyInteraction;
