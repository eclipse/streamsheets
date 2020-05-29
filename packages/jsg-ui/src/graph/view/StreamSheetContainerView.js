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
import { default as JSG, NotificationCenter, ChangeItemOrderCommand } from '@cedalo/jsg-core';
import NodeView from './NodeView';

/**
 * This view is for a {{#crossLink "StreamSheet"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class StreamSheetView
 * @extends WorksheetView
 * @param {WorkbookNode} item The corresponding WorkbookNode model.
 * @constructor
 */
export default class StreamSheetContainerView extends NodeView {
	constructor(item) {
		super(item);

		const nc = NotificationCenter.getInstance();
		nc.register(this, JSG.LOCALE_CHANGED_NOTIFICATION, 'onLocaleChanged');
	}

	dispose() {
		super.dispose();

		// unregister from NotificationCenter:
		const nc = NotificationCenter.getInstance();
		nc.unregister(this, JSG.LOCALE_CHANGED_NOTIFICATION);
	}

	moveSheetToTop(viewer) {
		const views = this.getParent()._subviews.length;
		if (views !== this.getParent()._subviews.indexOf(this) + 1) {
			viewer
				.getInteractionHandler()
				.execute(new ChangeItemOrderCommand(this.getItem(), ChangeItemOrderCommand.Action.TOTOP, viewer));
		}
	}

	onLocaleChanged() {
		const item = this.getItem();
		const graph = item.getGraph();

		const source = item
			.getStreamSheetContainerAttributes()
			.getStream()
			.getValue();
		item.getInboxCaption().setName(`${JSG.getLocalizedString('Inbox')} - ${source}`);
		item.getInboxContainer()
			.getMessageCaption()
			.setName(JSG.getLocalizedString('DataObject'));

		const outbox = graph.getOutboxContainer();
		outbox._outboxCaption.setName(JSG.getLocalizedString('Outbox'));
		outbox.getMessageCaption().setName(JSG.getLocalizedString('DataObject'));

		const index = item
			.getStreamSheetContainerAttributes()
			.getStep()
			.getValue();
		item.getSheetCaption().setName(
			`${item
				.getStreamSheet()
				.getName()
				.getValue()} - ${JSG.getLocalizedString('Step')} ${index}`
		);
	}
}
