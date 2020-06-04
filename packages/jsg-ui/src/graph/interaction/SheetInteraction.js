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
/* global document */

import {
	default as JSG,
	Shape,
	Notification,
	NotificationCenter,
	Point,
	MathUtils,
	GraphUtils,
	BoundingBox,
	CellsNode,
	HeaderNode,
	SheetHeaderNode,
	CellRange,
	Expression,
	WorksheetNode,
	ExecuteFunctionCommand,
	TreeItemsNode,
	StreamSheet,
	DeleteCellContentCommand
} from '@cedalo/jsg-core';
import { FuncTerm, Term } from '@cedalo/parser';
import CellFeedbackView from '../feedback/CellFeedbackView';
import WorksheetView from '../view/WorksheetView';
import TreeItemsView from '../view/TreeItemsView';
import EditCellInteraction from './EditCellInteraction';
import CellEditor from '../view/CellEditor';
import Interaction from './Interaction';
import KeyEvent from '../../ui/events/KeyEvent';
import ClientEvent from '../../ui/events/ClientEvent';
import ScrollBar from '../../ui/scrollview/ScrollBar';
import Cursor from '../../ui/Cursor';

const SHEET_SHOW_CONTEXT_MENU_NOTIFICATION = 'sheet_show_context_menu_notification';

/**
 * @class SheetInteraction
 *
 * @constructor
 */
export default class SheetInteraction extends Interaction {
	constructor() {
		super();

		this._controller = undefined;
		this._startCell = undefined;
		this._currentRange = undefined;
		this._section = undefined;
		this._startSize = undefined;
		this._dragTimer = undefined;
	}

	isUsingPan(event, viewer) {
		if (!this._controller) {
			return undefined;
		}
		if (this._controller.getModel().isProtected()) {
			return true;
		}

		const view = this._controller.getView();
		const cell = this.getCell(view, event.location, viewer);
		return cell && cell.x !== -1 && cell.y !== -1;
	}

	deactivate(viewer) {
		super.deactivate(viewer);

		viewer.clearInteractionFeedback();
		this._feedback = undefined;
	}

	onKeyDown(event, viewer) {
		if (!this._controller) {
			return undefined;
		}

		const view = this._controller.getView();

		if (view && view.onKeyDown(event, viewer, this)) {
			// viewer.getGraph().markDirty();
			// event.doRepaint = true;
			event.event.preventDefault();
			event.event.stopPropagation();
			return true;
		}

		return undefined;
	}

	onMouseDown(event, viewer) {
		const view = this._controller.getView();
		const showTooltip = (levent, size) => {
			JSG.toolTip.savePosition(levent);
			JSG.toolTip.translate(-20, -60);
			JSG.toolTip.updateContent();
			JSG.toolTip.startTooltip(levent, `${String(MathUtils.roundTo(size / 100, 1))} mm`, 0);
		};

		JSG.lastClick = this._controller;
		viewer.getGraphView().setFocus(this._controller);

		if (!this.isInside(viewer, event.location, true)) {
			this.setCursor(Cursor.Style.AUTO);
			this.cancelInteraction(event, viewer);
			return;
		}

		this._hitCode = view.getHitCode(event.location, viewer);

		view.activateLayerSelection();
		view.getParent().moveSheetToTop(viewer);

		const cellEditor = CellEditor.getActiveCellEditor();
		if (cellEditor) {
			if (
				this._hitCode === WorksheetView.HitCode.REFERENCEMOVE &&
				cellEditor &&
				cellEditor.rangeIndex !== undefined
			) {
				cellEditor.selectedRangeByIndex(cellEditor.rangeIndex);
				const range = cellEditor.getEditRanges().getAt(cellEditor.rangeIndex);

				switch (cellEditor.rangeResize) {
					case 0:
						cellEditor.startCell = new Point(range.getX2(), range.getY2());
						break;
					case 1:
						cellEditor.startCell = new Point(range.getX1(), range.getY2());
						break;
					case 2:
						cellEditor.startCell = new Point(range.getX1(), range.getY1());
						break;
					case 3:
						cellEditor.startCell = new Point(range.getX2(), range.getY1());
						break;
					default:
						cellEditor.startCell = undefined;
						break;
				}
				event.keepFocus = true;
				return;
			}

			let index = cellEditor.getActiveRangeIndex();
			if ((cellEditor.isReferenceMode() && index !== undefined) || cellEditor.isReferencePointingAllowed(view)) {
				if (!cellEditor.isReferenceMode()) {
					index = cellEditor.getSelectedRangeIndex(view);
				}
				cellEditor.activateReferenceMode(true);
				if (index !== undefined) {
					cellEditor.setActiveRangeIndex(index);
				}
				cellEditor.startCell = undefined;
				cellEditor.updateReferenceFromMouse(event, view);
				index = cellEditor.getActiveRangeIndex();
				cellEditor.updateEditRangesView(view);
				if (index !== undefined) {
					cellEditor.setActiveRangeIndex(index);
				}
				event.keepFocus = true;
				return;
			}
			cellEditor.deActivateReferenceMode();
			if (cellEditor.div.id === 'sheet-ref') {
				event.keepFocus = true;
				return;
			}
			CellEditor.deActivateCellEditor();
			viewer.getGraph().markDirty();
		}

		viewer.getCanvas().focus();
		viewer.clearSelection();

		switch (this._hitCode) {
			case WorksheetView.HitCode.ROWOUTLINE: {
				const cell = this.getCell(view, event.location, viewer);
				view.getRowHeaderView().handleOutlineMouseDown(cell.y, viewer);
				break;
			}
			case WorksheetView.HitCode.COLUMNOUTLINE: {
				const cell = this.getCell(view, event.location, viewer);
				view.getColumnHeaderView().handleOutlineMouseDown(cell.x, viewer);
				break;
			}
			case WorksheetView.HitCode.COLUMNSIZE:
			case WorksheetView.HitCode.COLUMNSIZEHIDDEN:
				this._section = view.getSection(this._hitCode, event.location, viewer);
				if (this._section === undefined) {
					return;
				}
				this._startSize = view
					.getColumnHeaderView()
					.getItem()
					.getSectionSize(this._section);
				showTooltip(event, this._startSize);
				break;
			case WorksheetView.HitCode.ROWSIZE:
			case WorksheetView.HitCode.ROWSIZEHIDDEN:
				this._section = view.getSection(this._hitCode, event.location, viewer);
				if (this._section === undefined) {
					return;
				}
				this._startSize = view
					.getRowHeaderView()
					.getItem()
					.getSectionSize(this._section);
				showTooltip(event, this._startSize);
				break;
			case WorksheetView.HitCode.CORNER:
				this._startCell = this.getCell(view, event.location, viewer);
				this._endCell = this._startCell.copy();
				this._doSelect(event, viewer, false, true);
				break;
			case WorksheetView.HitCode.SHEET:
			case WorksheetView.HitCode.ROW:
			case WorksheetView.HitCode.COLUMN: {
				const sheet = view.getItem();
				if (event.event.shiftKey) {
					this._startCell = view.getOwnSelection().getActiveCell();
					this._endCell = this.getCell(view, event.location, viewer);
					if (!this._endCell || !this._startCell) {
						return;
					}
				} else {
					this._startCell = this.getCell(view, event.location, viewer);
					this._endCell = undefined;
					if (!this._startCell) {
						return;
					}
				}
				this.handleUIFunction(sheet, event, viewer);
				this._doSelect(event, viewer, false, false);
				break;
			}
			default:
				break;
		}
	}

	handleUIFunction(sheet, event, viewer) {
		if (this._startCell === undefined) {
			return;
		}

		const data = sheet.getDataProvider();
		const cell = data.get(this._startCell);

		if (cell !== undefined) {
			let expr = cell.getExpression();
			if (expr !== undefined) {
				const termFunc = expr.getTerm();

				if (termFunc && termFunc instanceof FuncTerm && termFunc.getFuncId() === 'SELECT') {
					let selectList = document.createElement('select');
					const cs = viewer.getCoordinateSystem();
					const canvas = viewer.getCanvas();
					const view = this._controller.getView();
					const cellRect = view.getCellRect(this._startCell);
					const center = new Point(
						cellRect.x + cellRect.width / 2,
						cellRect.y + cellRect.height + cellRect.height / 2
					);
					const size = new Point(cellRect.width, cellRect.height);
					let targetRange = new CellRange(
						sheet,
						this._startCell.x,
						this._startCell.y,
						this._startCell.x,
						this._startCell.y
					);
					targetRange.shiftToSheet();

					GraphUtils.traverseUp(this._controller.getView(), viewer.getRootView(), (v) => {
						v.translateToParent(center);
						return true;
					});

					selectList.style.left = `${(
						cs.logToDeviceX(center.x, false) -
						cs.logToDeviceX(size.x / 2, false) +
						canvas.offsetLeft
					).toFixed()}px`;
					selectList.style.top = `${(
						cs.logToDeviceY(center.y, false) -
						cs.logToDeviceY(size.y / 2, false) +
						canvas.offsetTop
					).toFixed()}px`;

					selectList.id = 'sheetselect';
					selectList.style.minWidth = `${cs.logToDeviceY(cellRect.width, false)}px`;
					selectList.style.overflow = '';
					selectList.style.position = 'absolute';
					selectList.style.fontSize = '8pt';
					selectList.style.minHeight = '24px';

					const zoom = Math.max(1, cs.getZoom());
					selectList.style.transform = `scale(${zoom},${zoom})`;
					selectList.style.transformOrigin = 'left top';
					selectList.required = false;

					let optionsCnt = 0;

					let option = document.createElement('option');
					option.value = '';
					option.hidden = true;
					option.disabled = true;
					option.text = 'selectanoption';
					option.selected = true;
					option.style.paddingTop = '5px';
					option.style.paddingBottom = '5px';
					selectList.appendChild(option);

					if (termFunc.params.length) {
						if (termFunc.params[0].operand && termFunc.params[0].operand._range) {
							const options = termFunc.params[0].operand._range;

							options.enumerateShifted((optCell) => {
								if (optCell) {
									const value = optCell.getValue();
									if (value !== undefined) {
										option = document.createElement('option');
										optionsCnt += 1;
										option.value = value;
										option.text = value;
										// option.selected = cell.getValue() === value;
										option.style.paddingTop = '5px';
										option.style.paddingBottom = '5px';
										selectList.appendChild(option);
									}
								}
							});
						}
					}

					event.keepFocus = true;
					selectList.size = Math.max(optionsCnt, 2);

					const blurListener = () => {
						canvas.parentNode.removeChild(selectList);
						selectList = undefined;
					};

					selectList.addEventListener(
						'change',
						(ev) => {
							if (termFunc.params[0].operand && termFunc.params[0].operand._range) {
								let targetSheet = sheet;
								if (termFunc.params.length > 2 && termFunc.params[2].operand._range) {
									targetRange = termFunc.params[2].operand._range;
									expr = new Expression(String(ev.target.value));
									targetSheet = targetRange.getSheet();
								} else {
									termFunc.params[1] = Term.fromString(String(ev.target.value));
									expr.correctFormula(sheet);
								}
								const cmd = new JSG.SetCellDataCommand(
									targetSheet,
									targetRange.toString(),
									expr,
									false
								);
								viewer.getInteractionHandler().execute(cmd);
							}
							if (selectList) {
								// remove child triggers a blur event
								selectList.removeEventListener('blur', blurListener);
								canvas.parentNode.removeChild(selectList);
								selectList = undefined;
							}
							return false;
						},
						false
					);

					canvas.parentNode.appendChild(selectList);
					selectList.focus();
					event.keepFocus = true;

					selectList.addEventListener('blur', blurListener, false);
				}
			}
		}
	}

	_doExceedThreshold(event, viewer) {
		const threshold = viewer.getCoordinateSystem().metricToLogXNoZoom(200);
		const location = JSG.ptCache
			.get()
			.setTo(this.currentLocation)
			.subtract(this.startLocation);
		const ext = location.length();
		JSG.ptCache.release(location);
		return ext > threshold;
	}

	_getTargetView(event, viewer) {
		let controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => true);
		if (!controller) {
			return this._controller.getView();
		}

		if (controller.getModel() instanceof TreeItemsNode) {
			return controller.getView();
		}

		if (
			!(controller.getModel() instanceof CellsNode) &&
			!(controller.getModel() instanceof HeaderNode) &&
			!(controller.getModel() instanceof SheetHeaderNode)
		) {
			return this._controller.getView();
			// return undefined;
		}

		controller = controller.getParent().getParent();

		if (controller === undefined) {
			return undefined;
		}

		const view = controller.getView();
		const item = view.getItem();
		const bounds = item.getTranslatedBoundingBox(item.getGraph());
		const hScrollSize =
			item.getHorizontalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;
		const vScrollSize =
			item.getVerticalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;

		bounds.setWidth(bounds.getWidth() - vScrollSize);
		bounds.setHeight(bounds.getHeight() - hScrollSize);

		const point = this.getViewer().translateFromParent(event.location.copy());

		return bounds.containsPoint(point) ? view : undefined;
	}

	_getTargetRange(view, event, viewer) {
		const item = view.getItem();
		const cellEditor = CellEditor.getActiveCellEditor();
		let selRange;

		if (this._hitCode === WorksheetView.HitCode.REFERENCEMOVE) {
			if (cellEditor) {
				const index = cellEditor.rangeIndex;
				selRange = cellEditor.getEditRanges().getAt(index);
			} else {
				return undefined;
			}
		} else {
			selRange = this._controller
				.getModel()
				.getOwnSelection()
				.getAt(0);
		}

		if (selRange === undefined) {
			return undefined;
		}

		const cell = this.getCell(view, event.location, viewer);
		if (cell === undefined) {
			return undefined;
		}

		if (this._hitCode === WorksheetView.HitCode.SELECTIONEXTEND) {
			const target = selRange.copy();

			const horizontal =
				Math.abs(this.currentLocation.x - this.startLocation.x) >
				Math.abs(this.currentLocation.y - this.startLocation.y);
			if (horizontal) {
				if (cell.x >= selRange.getX1()) {
					target.setX2(cell.x);
				} else {
					target.setX1(cell.x);
				}
			} else if (cell.y >= selRange.getY1()) {
				target.setY2(cell.y);
			} else {
				target.setY1(cell.y);
			}
			return target;
		}

		if (cellEditor && cellEditor.rangeResize !== undefined) {
			const target = selRange.copy();
			switch (cellEditor.rangeResize) {
				case 0:
				case 1:
				case 2:
				case 3:
					target.setX1(cellEditor.startCell.x);
					target.setY1(cellEditor.startCell.y);
					target.setX2(cell.x);
					target.setY2(cell.y);
					break;
				default:
					break;
			}

			return target;
		}

		const selRect = this._controller.getView().getRangeRect(selRange);
		const point = new Point(0, 0);

		point.x = selRect.x + this.currentLocation.x - this.startLocation.x;
		point.y = selRect.y + this.currentLocation.y - this.startLocation.y;

		if (this._feedback === undefined) {
			cell.x = Math.max(cell.x, selRange._x1);
			cell.x = Math.min(cell.x, selRange._x2);
			cell.y = Math.max(cell.y, selRange._y1);
			cell.y = Math.min(cell.y, selRange._y2);
			this._feedOffsetX = cell.x - selRange._x1;
			this._feedOffsetY = cell.y - selRange._y1;
		}
		if (this._feedOffsetX) {
			cell.x -= this._feedOffsetX;
		}
		if (this._feedOffsetY) {
			cell.y -= this._feedOffsetY;
		}

		cell.x = Math.max(0, cell.x);
		cell.y = Math.max(0, cell.y);
		cell.x = Math.min(cell.x, item.getColumnCount() - selRange.getWidth());
		cell.y = Math.min(cell.y, item.getRowCount() - selRange.getHeight());

		return new CellRange(
			view.getItem(),
			cell.x,
			cell.y,
			cell.x + selRange.getWidth() - 1,
			cell.y + selRange.getHeight() - 1
		);
	}
	/**
	 * Update cell drag feedback.
	 * @param {MouseEvent} event Mouse event
	 * @param {GraphViewer} viewer Current viewer
	 * @private
	 */
	_updateFeedback(view, event, viewer) {
		const target = this._getTargetRange(view, event, viewer);
		if (target === undefined) {
			return undefined;
		}
		const rect = view.getRangeRect(target);
		const cellEditor = CellEditor.getActiveCellEditor();

		if (cellEditor && this._hitCode === WorksheetView.HitCode.REFERENCEMOVE) {
			const index = cellEditor.rangeIndex;
			cellEditor.setActiveRangeIndex(index);
		}

		if (this._feedback === undefined) {
			this._feedback = new CellFeedbackView();
			if (cellEditor && this._hitCode === WorksheetView.HitCode.REFERENCEMOVE) {
				const index = cellEditor.rangeIndex;
				this._feedback.setReference(true);
				this._feedback.setCellBorderColor(cellEditor.getEditRanges().getAt(index)._color);
			}
		}

		const box = new BoundingBox(rect.width, rect.height);
		const cellPoint = view.translateFromSheet(new Point(rect.x, rect.y), viewer);
		box.setTopLeftTo(cellPoint);
		this._feedback.setBoundingBox(box);

		if (this._hitCode === WorksheetView.HitCode.SELECTIONEXTEND) {
			// add rect to visualize range to delete
			const selRange = this._controller
				.getModel()
				.getOwnSelection()
				.getAt(0);

			const selRect = this._controller.getView().getRangeRect(selRange);
			this._feedback.setDeleteWidth(selRect.width > rect.width ? selRect.width - rect.width : undefined);
			this._feedback.setDeleteHeight(selRect.height > rect.height ? selRect.height - rect.height : undefined);
		}

		viewer.clearInteractionFeedback();
		viewer.addInteractionFeedback(this._feedback);

		return target;
	}

	activateTimer(event, viewer) {
		this._dragLocation = event.location.copy();
		if (this._dragTimer) {
			return;
		}

		this._dragTimer = setInterval(() => {
			if (this._controller === undefined) {
				return;
			}
			const view = this._controller.getView();
			const cell = this.getCell(view, this._dragLocation, viewer, true, true);
			if (cell) {
				switch (this._hitCode) {
					case WorksheetView.HitCode.SELECTIONEXTEND:
					case WorksheetView.HitCode.SELECTIONMOVE:
					case WorksheetView.HitCode.REFERENCEMOVE:
						view.showCell(cell);
						this._updateFeedback(view, event, viewer);
						break;
					case WorksheetView.HitCode.ROW:
					case WorksheetView.HitCode.COLUMN:
					case WorksheetView.HitCode.SHEET:
						this._endCell = cell;
						this._doSelect(event, viewer, true, false);
						break;
				}
				viewer.getGraph().markDirty();
				viewer.getGraphicSystem().paint();
			}
		}, 300);
	}

	deActivateTimer() {
		if (this._dragTimer) {
			clearInterval(this._dragTimer);
			this._dragTimer = undefined;
		}
	}

	onMouseDrag(event, viewer) {
		const view = this._controller.getView();
		const cellEditor = CellEditor.getActiveCellEditor();

		if (this._hitCode !== WorksheetView.HitCode.REFERENCEMOVE && cellEditor) {
			if (cellEditor.startCell) {
				cellEditor.updateReferenceFromMouse(event, view);
				event.isConsumed = true;
				event.hasActivated = true;
				return;
			}
		}

		switch (this._hitCode) {
			case WorksheetView.HitCode.REFERENCEMOVE: {
				const target = this._updateFeedback(view, event, viewer);
				const cell = this.getCell(view, event.location, viewer, true);
				if (cell) {
					this.deActivateTimer();
					view.showCell(cell);
					if (cellEditor) {
						cellEditor.updateReferenceFromDrag(event, view, target);
					}
				} else {
					this.activateTimer(event, viewer);
				}
				break;
			}
			case WorksheetView.HitCode.SELECTIONEXTEND:
			case WorksheetView.HitCode.SELECTIONMOVE: {
				if (!this._doExceedThreshold(event, viewer)) {
					return;
				}
				if (this.isFarOut(event.location, viewer)) {
					this.deActivateTimer();
					const targetView = this._getTargetView(event, viewer);
					if (targetView === undefined) {
						return;
					}
					if (targetView instanceof WorksheetView) {
						this._updateFeedback(targetView, event, viewer);
					} else {
						const feedback = targetView.getFeedback(
							this.currentLocation,
							this.startLocation,
							'Cells',
							view,
							false,
							event,
							viewer
						);
						viewer.clearInteractionFeedback();
						viewer.addInteractionFeedback(feedback);
						this._feedback = undefined;
					}
				} else {
					this._updateFeedback(view, event, viewer);
					const cell = this.getCell(view, event.location, viewer, true);
					if (cell) {
						this.deActivateTimer();
						view.showCell(cell);
					} else {
						this.activateTimer(event, viewer);
					}
				}
				this.setCursor(event.event.ctrlKey ? Cursor.Style.COPY : Cursor.Style.AUTO);
				break;
			}
			case WorksheetView.HitCode.COLUMNSIZE:
			case WorksheetView.HitCode.COLUMNSIZEHIDDEN:
				if (this._section === undefined) {
					return;
				}
				view.getColumnHeaderView()
					.getItem()
					.setSectionSize(this._section, this._startSize + this.currentLocation.x - this.startLocation.x);
				viewer.getGraph().markDirty();
				JSG.toolTip.updateContent(
					`${String(
						Math.max(
							0,
							MathUtils.roundTo(
								(this._startSize + this.currentLocation.x - this.startLocation.x) / 100,
								1
							)
						)
					)} mm`
				);
				break;
			case WorksheetView.HitCode.ROWSIZE:
			case WorksheetView.HitCode.ROWSIZEHIDDEN: {
				if (this._section === undefined) {
					return;
				}
				const header = this._controller.getModel().getRows();
				header.setSectionSize(this._section, this._startSize + this.currentLocation.y - this.startLocation.y);
				viewer.getGraph().markDirty();
				JSG.toolTip.updateContent(
					`${String(
						Math.max(
							0,
							MathUtils.roundTo(
								(this._startSize + this.currentLocation.y - this.startLocation.y) / 100,
								1
							)
						)
					)} mm`
				);
				break;
			}
			case WorksheetView.HitCode.COLUMN:
			case WorksheetView.HitCode.ROW:
			case WorksheetView.HitCode.SHEET: {
				this._endCell = this.getCell(
					view,
					event.location,
					viewer,
					true,
					false,
					this._hitCode !== WorksheetView.HitCode.SHEET
				);
				if (this._endCell) {
					this.deActivateTimer();
					this._doSelect(event, viewer, true, false);
				} else {
					this.activateTimer(event, viewer);
				}
				break;
			}
			default:
				break;
		}
	}

	onMouseDoubleClick(event, viewer) {
		if (this._controller !== undefined) {
			const view = this._controller.getView();
			this._hitCode = view.getHitCode(event.location, viewer);
			switch (this._hitCode) {
				case WorksheetView.HitCode.COLUMNSIZE:
				case WorksheetView.HitCode.COLUMNSIZEHIDDEN: {
					if (this._section === undefined) {
						return;
					}
					const ranges = view.getOwnSelection().getRanges();
					let rangeToSet;
					ranges.forEach((range) => {
						if (range.isColumnRange() && range.getX1() <= this._section && range.getX2() >= this._section) {
							rangeToSet = range;
						}
					});
					if (rangeToSet === undefined) {
						rangeToSet = new CellRange(view.getItem(), this._section, 0);
					}
					for (let i = rangeToSet.getX1(); i <= rangeToSet.getX2(); i += 1) {
						const size = view.getMaxColumnWidth(i, viewer);
						const rangeCol = new CellRange(view.getItem(), i, 0);
						viewer.getInteractionHandler().execute(
							new JSG.SetHeaderSectionSizeCommand(
								view.getItem().getColumns(),
								i,
								[rangeCol],
								size,
								true,
								false,
								view
									.getItem()
									.getColumns()
									.getSectionSize(i)
							)
						);
					}
					break;
				}
				case WorksheetView.HitCode.ROWSIZE:
				case WorksheetView.HitCode.ROWSIZEHIDDEN: {
					if (this._section === undefined) {
						return;
					}
					const ranges = view.getOwnSelection().getRanges();
					let rangeToSet;
					ranges.forEach((range) => {
						if (range.isRowRange() && range.getY1() <= this._section && range.getY2() >= this._section) {
							rangeToSet = range;
						}
					});
					if (rangeToSet === undefined) {
						rangeToSet = new CellRange(view.getItem(), 0, this._section);
					}
					for (let i = rangeToSet.getY1(); i <= rangeToSet.getY2(); i += 1) {
						const size = view.getMaxRowHeight(i, viewer);
						const rangeRow = new CellRange(view.getItem(), 0, i);
						viewer.getInteractionHandler().execute(
							new JSG.SetHeaderSectionSizeCommand(
								view.getItem().getRows(),
								i,
								[rangeRow],
								size,
								true,
								true,
								view
									.getItem()
									.getRows()
									.getSectionSize(i)
							)
						);
					}
					break;
				}
				case WorksheetView.HitCode.SHEET: {
					this._startEditCellInteraction(event, viewer);
					break;
				}
			}
		}
	}

	doCancelInteraction(event) {
		if (event instanceof KeyEvent) {
			return false;
		}
		return false;
	}

	isInside(viewer, location, scrollIncluded) {
		if (this._controller === undefined) {
			return false;
		}
		let controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => true);

		if (!controller) {
			return false;
		}

		if (
			!(controller.getModel() instanceof CellsNode) &&
			!(controller.getModel() instanceof HeaderNode) &&
			!(controller.getModel() instanceof StreamSheet) &&
			!(controller.getModel() instanceof SheetHeaderNode)
		) {
			let cont = controller;
			while (cont && !(cont.getModel() instanceof StreamSheet)) {
				cont = cont.getParent();
			}
			if (cont) {
				const cell = this.getCell(cont.getView(), location, viewer);
				if (cell && (cell.x === -1 || cell.y === -1)) {
					controller = cont;
				} else {
					cont = undefined;
				}
			}
			if (cont === undefined) {
				return false;
			}
		}

		if (!(controller.getView() instanceof WorksheetView)) {
			controller = controller.getParent().getParent();
		}

		if (this._controller !== controller || controller === undefined) {
			return false;
		}

		const view = this._controller.getView();
		const item = view.getItem();
		const bounds = item.getTranslatedBoundingBox(item.getGraph());
		const hScrollSize =
			item.getHorizontalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;
		const vScrollSize =
			item.getVerticalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;

		if (scrollIncluded !== true) {
			bounds.setWidth(bounds.getWidth() - vScrollSize);
			bounds.setHeight(bounds.getHeight() - hScrollSize);
		}

		const point = this.getViewer().translateFromParent(location.copy());

		return bounds.containsPoint(point);
	}

	onMouseUp(event, viewer) {
		// cannot ignore onMouseUp, which is fired document wide!! => need it to get mouse click outside GraphEditor
		// if not handled inner div simply lose focus...!!
		this.deActivateTimer();

		const view = this._controller.getView();
		const cellEditor = CellEditor.getActiveCellEditor();

		if (cellEditor && cellEditor.isReferenceMode()) {
			event.isConsumed = true;
			event.hasActivated = true;
			return;
		}

		switch (this._hitCode) {
			case WorksheetView.HitCode.SELECTIONEXTEND:
			case WorksheetView.HitCode.SELECTIONMOVE: {
				if (!this._doExceedThreshold(event, viewer)) {
					break;
				}
				const targetView = this._getTargetView(event, viewer);
				if (targetView === undefined) {
					return;
				}
				if (targetView instanceof TreeItemsView) {
					const json = view.getOwnSelection().toJson();
					targetView.getItem().pasteJson(json);
				} else {
					const source = this._controller
						.getModel()
						.getOwnSelection()
						.getAt(0);
					const target = this._getTargetRange(targetView, event, viewer);
					if (target === undefined || source.isEqualTo(target)) {
						break;
					}
					if (this._hitCode === WorksheetView.HitCode.SELECTIONEXTEND) {
						// handle delete case (target smaller selection)
						if (target.getWidth() < source.getWidth() || target.getHeight() < source.getHeight()) {
							const delRange = source.copy();
							if (target.getWidth() < source.getWidth()) {
								delRange.setX1(target.getX2() + 1);
							} else {
								delRange.setY1(target.getY2() + 1);
							}
							delRange.shiftToSheet();
							const ref = `${delRange.toString()};`;
							viewer
								.getInteractionHandler()
								.execute(new DeleteCellContentCommand(view.getItem(), ref, 'values'));
							const selection = view.getOwnSelection();
							selection.selectRange(target);
							view.notify();
							viewer.clearInteractionFeedback();
							this._feedback = undefined;
							return;
						}

						const horizontal =
							Math.abs(this.currentLocation.x - this.startLocation.x) >
							Math.abs(this.currentLocation.y - this.startLocation.y);
						if (horizontal) {
							if (target.getX2() > source.getX2()) {
								target.setX1(source.getX2() + 1);
							} else {
								target.setX2(source.getX1() - 1);
							}
						} else if (target.getY2() > source.getY2()) {
							target.setY1(source.getY2() + 1);
						} else {
							target.setY2(source.getY1() - 1);
						}
					}
					view.copyCells(!event.event.ctrlKey && this._hitCode !== WorksheetView.HitCode.SELECTIONEXTEND);
					view.pasteFromClipboard(
						viewer,
						target,
						JSG.clipSheet.data,
						'all',
						this._hitCode === WorksheetView.HitCode.SELECTIONEXTEND
					);
					JSG.clipSheet = undefined;
				}
				viewer.getGraph().markDirty();
				break;
			}
			case WorksheetView.HitCode.COLUMNSIZE:
			case WorksheetView.HitCode.COLUMNSIZEHIDDEN: {
				JSG.toolTip.removeTooltip();
				if (this._section === undefined) {
					return;
				}
				const ranges = view.getOwnSelection().getRanges();
				let rangeToSet;
				ranges.forEach((range) => {
					if (range.isColumnRange() && range.getX1() <= this._section && range.getX2() >= this._section) {
						rangeToSet = range;
					}
				});
				if (rangeToSet === undefined) {
					rangeToSet = [new CellRange(view.getItem(), this._section, 0)];
				} else {
					rangeToSet = view.getOwnSelection().getRanges();
				}
				viewer
					.getInteractionHandler()
					.execute(
						new JSG.SetHeaderSectionSizeCommand(
							this._controller.getModel().getColumns(),
							this._section,
							rangeToSet,
							this._startSize + this.currentLocation.x - this.startLocation.x,
							true,
							false,
							this._startSize
						)
					);
				break;
			}
			case WorksheetView.HitCode.ROWSIZE:
			case WorksheetView.HitCode.ROWSIZEHIDDEN: {
				JSG.toolTip.removeTooltip();
				if (this._section === undefined) {
					return;
				}
				const ranges = view.getOwnSelection().getRanges();
				let rangeToSet;
				ranges.forEach((range) => {
					if (range.isRowRange() && range.getY1() <= this._section && range.getY2() >= this._section) {
						rangeToSet = range;
					}
				});
				if (rangeToSet === undefined) {
					rangeToSet = [new CellRange(view.getItem(), 0, this._section)];
				} else {
					rangeToSet = view.getOwnSelection().getRanges();
				}
				viewer
					.getInteractionHandler()
					.execute(
						new JSG.SetHeaderSectionSizeCommand(
							this._controller.getModel().getRows(),
							this._section,
							rangeToSet,
							this._startSize + this.currentLocation.y - this.startLocation.y,
							true,
							true,
							this._startSize
						)
					);
				break;
			}
			case WorksheetView.HitCode.SHEET:
			case WorksheetView.HitCode.ROW:
			case WorksheetView.HitCode.COLUMN: {
				const sheet = view.getItem();
				view.notifySelectionChange(viewer);
				this.handleUIFunction(sheet, event, viewer);
				break;
			}
			default:
				break;
		}

		viewer.clearInteractionFeedback();
		this._feedback = undefined;

		if (this.isInside(viewer, event.location)) {
			event.isConsumed = true;
			event.hasActivated = true;
		} else {
			this.finishInteraction(event, viewer);
		}
	}

	onMouseMove(event, viewer) {
		viewer.getDefaultInteraction().onMouseMove(event, viewer);

		if (viewer.isResizeHandle(event)) {
			this.finishInteraction(event, viewer);
			return;
		}

		if (this.isInside(viewer, event.location, false)) {
			const view = this._controller.getView();
			this._hitCode = view.getHitCode(event.location, viewer);
			view.setCursor(this._hitCode, this);
		} else {
			this.setCursor(Cursor.Style.AUTO);
			this.cancelInteraction(event, viewer);
		}
	}

	isFarOut(location, viewer) {
		const view = this._controller.getView();
		const bounds = view.getScrollView().getBounds();

		let point = location.copy();
		point = view.translateToSheet(point, viewer);

		if (point.x > bounds.width + 1500 || point.y > bounds.height + 1500) {
			return true;
		}
		return point.x < -1000 || point.y < -1000;
	}

	getViewInfo(view) {
		return {
			bounds: view.getScrollView().getBounds(),
			hScrollSize:
				view.getItem().getHorizontalScrollbarMode() === JSG.ScrollBarMode.HIDDEN
					? 0
					: ScrollBar.SIZE,
			vScrollSize:
				view.getItem().getVerticalScrollbarMode() === JSG.ScrollBarMode.HIDDEN
					? 0
					: ScrollBar.SIZE
		};
	}

	hasDrawingEvent(drawItem, event) {
		if (drawItem.func === undefined || drawItem.event === undefined) {
			return false;
		}

		return drawItem.event === event || event === 'ANY';
	}

	handleDrawingEvent(viewer, drawing, event, sheet) {
		if (drawing) {
			if (drawing.event === event) {
				const cmd = new ExecuteFunctionCommand(sheet, drawing.func);
				viewer.getInteractionHandler().execute(cmd);
			}
			return true;
		}
		return false;
	}

	/**
	 * Retrieve cell from the given event infos
	 * @param point Mouse Event Coordinate
	 * @param viewer GraphViewer to use.
	 * @param cellOnly
	 * @returns {Cell} Cell at current location.
	 */
	getCell(view, location, viewer, cellOnly = false, anyCell = false, header = false) {
		const info = this.getViewInfo(view);

		let point = location.copy();
		point = view.translateToSheet(point, viewer);

		if (cellOnly === true && anyCell === false) {
			if (point.x > info.bounds.width - info.vScrollSize || point.y > info.bounds.height - info.hScrollSize) {
				return undefined;
			}
			const rowWidth = header
				? 0
				: view
						.getItem()
						.getRows()
						.getInternalWidth();
			const colHeight = header
				? 0
				: view
						.getItem()
						.getColumns()
						.getInternalHeight();

			if (point.x < rowWidth || point.y < colHeight) {
				return undefined;
			}
		}

		return view.getCell(point, cellOnly, anyCell);
	}

	_doSelect(event, viewer, update, updateFinal) {
		const view = this._controller.getView();
		const selection = view.getOwnSelection();

		if (!update && !event.isPressed(ClientEvent.KeyType.CTRL)) {
			selection.removeAll();
		}
		if (this._startCell) {
			if (update) {
				const range = view.getItem().getRangeFromPositions(this._startCell, this._endCell);
				const rangeOld = selection.getAt(this._currentRange);
				if (rangeOld) {
					if (range.isEqualTo(rangeOld)) {
						return;
					}
				}
				selection.setAt(this._currentRange, range);
				view.showCell(this._endCell);
			} else {
				this._currentRange = selection.getSize();
				selection.setActiveCell(this._startCell);
				selection.add(view.getItem().getRangeFromPositions(this._startCell, this._endCell));
			}
			view.notify(updateFinal);
		}
	}

	onMouseExit(event, viewer) {
		this.cancelInteraction(event, viewer);
	}

	handleContextMenu(event, viewer) {
		if (this._controller === undefined) {
			return;
		}

		const view = this._controller.getView();

		if (view.getHitCode(event.location, viewer, true) !== WorksheetView.HitCode.NONE) {
			this.onMouseDown(event, viewer);
			this.onMouseUp(event, viewer);
		}

		NotificationCenter.getInstance().send(
			new Notification(SheetInteraction.SHEET_SHOW_CONTEXT_MENU_NOTIFICATION, {
				event,
				viewer,
				controller: this._controller
			})
		);
	}

	cancelInteraction(event, viewer) {
		if (event !== undefined) {
			event.doRepaint = true;
		}
		this._controller = undefined;
		this.setCursor(Cursor.Style.AUTO);

		super.cancelInteraction(event, viewer);
	}

	_startEditCellInteraction(event, viewer) {
		if (this._isEditable(this._controller) === false) {
			return undefined;
		}

		if (JSG.clipSheet) {
			event.doRepaint = JSG.clipSheet.range !== undefined;
			JSG.clipSheet.range = undefined;
			viewer.getGraph().markDirty();
		}

		const view = this._controller.getView();
		const activeCell = view.getOwnSelection().getActiveCell();

		if (activeCell === undefined) {
			return undefined;
		}
		if (view.showActiveCell()) {
			const interactionHandler = this.getInteractionHandler();
			interactionHandler.repaint();
		}

		const interaction = this.activateInteraction(new EditCellInteraction(), this);
		interaction.setController(this._controller);
		interaction.startEdit(this._controller, event, viewer);
		interaction._interaction = new SheetInteraction();
		interaction._interaction.setInteractionHandler(this.getInteractionHandler());
		event.hasActivated = true;

		return interaction;
	}

	activateInteraction(interaction, oldInteraction) {
		const interactionHandler = oldInteraction.getInteractionHandler();
		if (interactionHandler !== undefined) {
			interaction.setStartLocation(oldInteraction.startLocation);
			interaction.setCurrentLocation(oldInteraction.currentLocation);
			interactionHandler.setActiveInteraction(interaction);
		}
		return interaction;
	}

	_isEditable(/* controller */) {
		return true;
	}

	/**
	 * Called to handle mouse wheel in interaction specifically.</br>
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseWheel(event, viewer) {
		if (event.event.ctrlKey) {
			viewer.setWheelZoom(event);
		} else {
			const zDelta = event.getWheelDelta() < 0 ? 1 : -1;
			const view = this._controller.getView();
			const scrollView = view.getScrollView();
			const pt = scrollView.getScrollPosition();

			if (event.event.shiftKey) {
				pt.x += zDelta * 2000;
			} else {
				pt.y += zDelta * 1500;
			}
			scrollView.setScrollPositionTo(pt);

			this.getInteractionHandler().repaint();
		}
	}

	static get SHEET_SHOW_CONTEXT_MENU_NOTIFICATION() {
		return SHEET_SHOW_CONTEXT_MENU_NOTIFICATION;
	}

	onPanEnd(event, viewer) {
		this._ptPanStart = undefined;
	}

	onPinch(event, viewer) {
		if (!this._pinStartZoom) {
			this._pinStartZoom = viewer.getZoom();
		}
		viewer.setZoom(this._pinStartZoom + event.event.scale);
	}

	onPan(event, viewer) {
		const view = this._controller.getView();
		const scrollView = view.getScrollView();
		const cs = viewer.getCoordinateSystem();
		const pt = new Point(0, 0);

		if (!this._ptPanStart) {
			this._ptPanStart = view.getScrollView().getScrollPosition();
		}

		pt.x = this._ptPanStart.x - cs.deviceToLogXNoZoom(event.event.deltaX);
		pt.y = this._ptPanStart.y - cs.deviceToLogYNoZoom(event.event.deltaY);

		scrollView.setScrollPositionTo(pt);
	}

	onPaste(event, viewer) {
		if (JSG.lastClick && JSG.lastClick.getModel() instanceof WorksheetNode) {
			const { items } = event.event.clipboardData || event.event.originalEvent.clipboardData;
			let i;
			for (i = 0; i < items.length; i += 1) {
				if (items[i].type.indexOf('plain') !== -1) {
					items[i].getAsString((json) => {
						const selection = this._controller.getModel().getOwnSelection();
						if (selection.hasSelection()) {
							this._controller
								.getView()
								.pasteFromClipboard(viewer, selection.getAt(0).copy(), json, 'all', false, true);
						}
					});
				}
			}
		}
	}

	isContentEditable(div) {
		return div && (div.contentEditable === 'true' || div.tagName === 'INPUT');
	}
}
