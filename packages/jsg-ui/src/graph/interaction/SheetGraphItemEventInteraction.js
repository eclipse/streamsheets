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
import {
	default as JSG,
	Notification,
	NotificationCenter,
	ExecuteFunctionCommand,
	StreamSheet,
	SheetReference,
} from '@cedalo/jsg-core';

import Interaction from './Interaction';
import SelectionProvider from '../view/SelectionProvider';
import StreamSheetView from '../view/StreamSheetView';

export default class SheetGraphItemEventInteraction extends Interaction {
	constructor() {
		super();

		this._controller = undefined;
		this._feedback = undefined;
	}

	deactivate(viewer) {
		viewer.removeInteractionFeedback(this._feedback);

		this._feedback = undefined;

		super.deactivate(viewer);
	}

	onMouseDown(event, viewer) {
		this.handleEvent(event, viewer, 'ONMOUSEDOWN');
		this.handleControlEvent(event, viewer, 'ONMOUSEDOWN');
	}

	onMouseDrag(event, viewer) {
		this.handleControlEvent(event, viewer, 'ONMOUSEDRAG');
	}

	onMouseDoubleClick(event, viewer) {
		this.handleEvent(event, viewer, 'ONDOUBLECLICK');
	}

	onMouseUp(event, viewer) {
		this.handleEvent(event, viewer, 'ONMOUSEUP');
		this.handleEvent(event, viewer, 'ONCLICK');
		this.handleControlEvent(event, viewer, 'ONMOUSEUP');
		this.handleControlEvent(event, viewer, 'ONCLICK');

		super.onMouseUp(event, viewer);
	}

	setRepaintOnDrag(event) {
		event.doRepaint = false;
	}

	willFinish(event, viewer) {
		super.willFinish(event, viewer);
	}

	cancelInteraction(event, viewer) {
		if (event !== undefined) {
			event.doRepaint = true;
		}
		this._controller = undefined;

		super.cancelInteraction(event, viewer);
	}

	handleEvent(event, viewer, name) {
		const events = this._controller.getModel()._sheetEvents;
		if (events && events instanceof Array) {
			events.forEach((sheetEvent) => {
				if (sheetEvent.event === name) {
					const sheet = this.getSheet();
					if (sheet) {
						if (sheetEvent.func.indexOf('SHOWVALUES') !== -1) {
							try {
								const term = JSG.FormulaParser.parse(sheetEvent.func, sheet.getGraph(), sheet);
								const view = this.getView();
								if (view && term && term.params.length > 1) {
									const { operand } = term.params[0];
									if (operand instanceof SheetReference && operand._range) {
										const range = operand._range.copy();
										range.shiftFromSheet();
										const cell = range._worksheet.getDataProvider().getRC(range._x1, range._y1);
										if (cell && cell.values) {
											const operandTarget = term.params[1].operand;
											if (operandTarget instanceof SheetReference && operandTarget._range) {
												const rangeTarget = operandTarget._range.copy();
												rangeTarget.shiftFromSheet();
												view.handleDataView(range._worksheet, {x: range._x1, y: range._y1}, rangeTarget, viewer);
											}
										}
									}
								}
								// eslint-disable-next-line no-empty
							} catch (e) {

							}
							event.isConsumed = true;
							event.hasActivated = true;
						} else if (sheetEvent.func.indexOf('SHOWDIALOG') !== -1) {
							const funcsparams = sheetEvent.funcsparams || {};
							const showParams = funcsparams.SHOWDIALOG;
							if (showParams) {
								const [type, ...params] = showParams;
								const showDialog = `showDialog:${type || 'File'}`;
								// wrap params in object for future enhancements
								NotificationCenter.getInstance().send(new Notification(showDialog, { params }));
								// first params is dialog-type
								// all others are dialog params
							} else {
								// NotificationCenter.getInstance().send(new Notification('showFileDialog', this));
								NotificationCenter.getInstance().send(new Notification('showDialog:File', this));
							}
							event.isConsumed = true;
							event.hasActivated = true;
						} else if (sheetEvent.func.indexOf('OPEN.URL') !== -1) {
							try {
								const term = JSG.FormulaParser.parse(sheetEvent.func, sheet.getGraph(), sheet)
								if (term && term.params.length) {
									const url = term.params[0].value;
									const sameTab = term.params.length > 1 && term.params[1].value === false;
									if (sameTab) {
										window.location.href = url;
									} else {
										window.open(url, '_blank');
									}
								}
								// eslint-disable-next-line no-empty
							} catch (e) {

							}
							event.isConsumed = true;
							event.hasActivated = true;
						} else {
							const cmd = new ExecuteFunctionCommand(sheet, sheetEvent.func);
							viewer.getInteractionHandler().execute(cmd);
							if (
								sheet
									.getGraph()
									.getMachineContainer()
									.getMachineState()
									.getValue() === 0
							) {
								event.isConsumed = true;
								event.hasActivated = true;
							}
						}
					}
				}
			});
		}
	}

	handleControlEvent(event, viewer, name) {
		const item = this._controller.getModel();
		const sheet = this.getSheet(this._controller);
		if (sheet) {
			if (
				sheet
					.getGraph()
					.getMachineContainer()
					.getMachineState()
					.getValue() === 0 &&
				this._controller.getView().handleEvent
			) {
				this._controller.getView().handleEvent(viewer, event, sheet, name);
				event.isConsumed = true;
				event.hasActivated = true;
				NotificationCenter.getInstance().send(
					new Notification(SelectionProvider.SELECTION_CHANGED_NOTIFICATION, {
						item,
						updateFinal: true
					})
				);
			}
		}
	}

	getSheet() {
		let sheet = this._controller.getModel().getParent();
		while (sheet && !(sheet instanceof StreamSheet)) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	getView() {
		let sheet = this._controller.getView().getParent();
		while (sheet && !(sheet instanceof StreamSheetView)) {
			sheet = sheet.getParent();
		}

		return sheet;
	}
}
