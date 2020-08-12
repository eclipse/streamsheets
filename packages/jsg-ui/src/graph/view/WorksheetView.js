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
/* global document window */

import {
	default as JSG,
	GraphUtils,
	FormatAttributes,
	CellRange,
	PasteCellsFromClipboardCommand,
	DeleteCellsCommand,
	InsertCellsCommand,
	SetCellsCommand,
	CellAttributesCommand,
	WorksheetNode,
	CellAttributes,
	DeleteCellContentCommand,
	SetCellLevelsCommand,
	SetHeaderSectionLevelCommand,
	CreateHeaderLevelsFromRangeCommand,
	SetAttributeAtPathCommand,
	ExpressionHelper,
	SetSelectionCommand,
	NotificationCenter,
	Notification,
	Expression,
	Point,
	AttributeUtils,
	Numbers,
	Dictionary,
	JSONWriter,
	JSONReader,
	RowHeaderNode,
	ColumnHeaderNode,
	TextFormatAttributes,
	PasteItemsCommand
} from '@cedalo/jsg-core';
import { FuncTerm, Locale } from '@cedalo/parser';
import { NumberFormatter } from '@cedalo/number-format';
import CellSelectionFeedbackView from '../feedback/CellSelectionFeedbackView';
import CellEditor from './CellEditor';
import ContentNodeView from './ContentNodeView';
import ScrollBar from '../../ui/scrollview/ScrollBar';
import Cursor from '../../ui/Cursor';

const SHEET_ACTION_NOTIFICATION = 'sheet_action_notification';
const SHEET_MESSAGE_NOTIFICATION = 'sheet_message_notification';

const HitCode = {
	NONE: 0,
	SHEET: 1,
	COLUMN: 2,
	ROW: 3,
	COLUMNSIZE: 4,
	ROWSIZE: 5,
	CORNER: 6,
	SELECTIONMOVE: 7,
	REFERENCEMOVE: 8,
	REFERENCERESIZE: 9,
	SELECTIONEXTEND: 10,
	ROWSIZEHIDDEN: 11,
	COLUMNSIZEHIDDEN: 12,
	COLUMNOUTLINE: 13,
	ROWOUTLINE: 14
};

/**
 * This view is for a {{#crossLink "WorkbookNode"}}{{/crossLink}} model.
 * Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class WorksheetView
 * @extends ContentNodeView
 * @constructor
 */
export default class WorksheetView extends ContentNodeView {
	constructor(item) {
		super(item);

		const scrollview = this.getScrollView();
		const solid = FormatAttributes.LineStyle.SOLID;

		scrollview
			.getHorizontalScrollbar()
			.getFormat()
			.setLineStyle(solid);
		scrollview
			.getHorizontalScrollbar()
			.getFormat()
			.setLineColor('#AAAAAA');
		scrollview
			.getVerticalScrollbar()
			.getFormat()
			.setLineStyle(solid);
		scrollview
			.getVerticalScrollbar()
			.getFormat()
			.setLineColor('#AAAAAA');
	}

	getWorksheetView() {
		return this;
	}

	draw(graphics) {
		super.draw(graphics);
	}

	notifySelectionChange(viewer) {
		const cmd = new SetSelectionCommand(
			this.getItem(),
			this.getItem().getSelectionId(),
			this.getOwnSelection().toStringMulti()
		);
		cmd._noDraw = true;
		viewer.getInteractionHandler().execute(cmd);

		this.activateLayerSelection();
	}

	activateLayerSelection() {
		const view = this.getGraphView();
		const layer = view.getLayer('cellselection');
		if (layer.length) {
			layer[0].setView(this);
		} else {
			layer.push(new CellSelectionFeedbackView(this));
		}
	}

	notify(updateFinal = true) {
		NotificationCenter.getInstance().send(
			new Notification(WorksheetNode.SELECTION_CHANGED_NOTIFICATION, {
				item: this.getItem(),
				updateFinal
			})
		);
	}

	notifyAction(action) {
		NotificationCenter.getInstance().send(
			new Notification(WorksheetView.SHEET_ACTION_NOTIFICATION, {
				view: this,
				action
			})
		);
	}

	notifyMessage(message) {
		NotificationCenter.getInstance().send(
			new Notification(WorksheetView.SHEET_MESSAGE_NOTIFICATION, {
				view: this,
				message
			})
		);
	}

	getOwnSelection() {
		return this._item.getOwnSelection();
	}

	hasSelection() {
		return this.getOwnSelection().getSize() && this.getOwnSelection().getActiveCell() !== undefined;
	}

	getColumnHeaderView() {
		return this.getContentPane()._subviews[1];
	}

	getRowHeaderView() {
		return this.getContentPane()._subviews[2];
	}

	getCellsView() {
		return this.getContentPane()._subviews[0];
	}

	getCellInside(event, viewer) {
		const bounds = this.getScrollView().getBounds();
		let point = new Point(0, 0);
		const hScrollSize =
			this.getItem().getHorizontalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;
		const vScrollSize = this.getItem().getVerticalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;

		point.setTo(event.location);
		point = this.translateToSheet(point, viewer);

		if (point.x > bounds.width - vScrollSize || point.y > bounds.height - hScrollSize) {
			return undefined;
		}

		return this.getCell(point);
	}

	getCell(point, cellOnly = false, anyCell = false) {
		const item = this.getItem();
		const cell = new Point(0, 0);
		const rowWidth = item.getRows().getInternalWidth();
		const colHeight = item.getColumns().getInternalHeight();

		if (point.x < rowWidth) {
			cell.x = anyCell ? 0 : -1;
		}

		if (point.y < colHeight) {
			cell.y = anyCell ? 0 : -1;
		}

		const sheetPoint = this.getScrollOffset();

		sheetPoint.x = point.x - sheetPoint.x - rowWidth;
		sheetPoint.y = point.y - sheetPoint.y - colHeight;

		if (cell.x !== -1) {
			cell.x = item.getColumns().getSection(sheetPoint.x);
		}

		if (cell.y !== -1) {
			cell.y = item.getRows().getSection(sheetPoint.y);
		}

		// outside sheet ?
		if (cell.x >= item.getColumnCount() || cell.y >= item.getRowCount()) {
			if (anyCell) {
				cell.x = cell.x >= item.getColumnCount() ? item.getColumnCount() - 1 : cell.x;
				cell.y = cell.y >= item.getRowCount() ? item.getRowCount() - 1 : cell.y;
			} else {
				return undefined;
			}
		}

		if (item.isCellProtected(cell.x, cell.y)) {
			return undefined;
		}

		return cell;
	}

	getMergedRange(cell) {
		const mergedCells = this.getItem()
			.getCells()
			.getMergedCells();
		let i;
		let range;

		for (i = 0; i < mergedCells.length; i += 1) {
			range = mergedCells[i];
			if (range.contains(cell)) {
				return range;
			}
		}

		return undefined;
	}

	onMouseDoubleClick(event, viewer, sourceInteraction) {}

	onKeyDown(event, viewer, sourceInteraction) {
		const item = this.getItem();
		const selection = this.getOwnSelection();
		let currentCell;

		const invalidate = () => {
			viewer.getGraph().markDirty();
			event.doRepaint = true;
		};

		const getCurrentActiveCell = () => selection.getActiveCell();

		const select = (cell) => {
			selection.removeAll();
			selection.add(item.getRangeFromPositions(cell));
			selection.getActiveCell().setTo(cell);
			this.showCell(cell);
			this.notifySelectionChange(viewer);
		};

		const doDefault = () => {
			if (event.event.keyCode > 47) {
				if (sourceInteraction === undefined) {
					return;
				}
				sourceInteraction._startEditCellInteraction(event, viewer);
			}
		};

		const doDownArrow = (sel) => {
			// down
			currentCell = getCurrentActiveCell();
			if (currentCell) {
				currentCell.y += 1;
				select(currentCell);
				event.consume();
			}
		};

		switch (event.event.key) {
			case 'j':
				if (event.event.ctrlKey) {
					if (event.event.altKey) {
						this.setPayloadRange(viewer, false);
					} else {
						if (selection.getSize() === 1) {
							const range = selection.getAt(0);
							if (range.getWidth() === 2 && !range.isColumnRange()) {
								this.setPayloadRange(viewer, true);
								event.consume();
								return true;
							}
						}
						this.notifyMessage({ id: 'SheetMessage.jsonRangeInvalid' });
					}
					// message
					event.consume();
					return true;
				}
				doDefault();
				break;
			case 'q':
				// scribble to create png from range
				if (event.event.ctrlKey) {
					const canvas = document.createElement('canvas');
					const graph = item.getGraph();
					let rect;

					canvas.id = 'canvaspng';

					const editor = new JSG.GraphEditor(canvas);
					const tmpViewer = editor.getGraphViewer();
					const graphics = tmpViewer.getGraphicSystem().getGraphics();
					const cs = graphics.getCoordinateSystem();

					tmpViewer.setControllerFactory(JSG.GraphControllerFactory.getInstance());
					tmpViewer.getScrollPanel().getViewPanel().setBoundsMargin(0);
					tmpViewer.getScrollPanel().setScrollBarsMode(JSG.ScrollBarMode.HIDDEN);
					editor.setGraph(graph);

					const currentSelection = viewer.getSelectionProvider().getFirstSelection();
					if (currentSelection) {
						rect = currentSelection.getModel().getBoundingBox().getBoundingRectangle();
					} else {
						rect = this.getRangeRect(this.getOwnSelection().getAt(0));
						const p = new Point(rect.x, rect.y);
						this.translateFromSheet(p, viewer);
						rect.x = p.x;
						rect.y = p.y;
					}

					canvas.width = cs.logToDeviceX(rect.width + 30);
					canvas.height = cs.logToDeviceX(rect.height + 30);
					editor.setZoom(1);

					graphics._context2D.fillStyle = '#FFFFFF';
					graphics._context2D.fillRect(0, 0, canvas.width, canvas.height);

					if (currentSelection) {
						currentSelection.getView().drawFill(
							graphics,
							currentSelection.getModel().getFormat(),
							new JSG.Rectangle(0, 0, rect.width, rect.height)
						);
						currentSelection.getView().drawSubViews(
							graphics,
							new JSG.Rectangle(0, 0, rect.width, rect.height)
						);
					} else {
						graphics.translate(-rect.x, -rect.y);
						tmpViewer.getGraphView().drawSubViews(
							graphics,
							new JSG.Rectangle(rect.x, rect.y, rect.width, rect.height)
						);
					}

					const image = canvas.toDataURL();

					editor.destroy();

					const w = window.open('about:blank','image from canvas');
					w.document.write(`<img src='${image}' alt='from canvas'/>`);
					event.consume();
					return true;
				}
				doDefault();
				break;
			case 'z':
				if (event.event.ctrlKey) {
					viewer.getInteractionHandler().undo();
					return true;
				}
				doDefault();
				break;
			case 'o':
				if (event.event.altKey) {
					const cmd = new CreateHeaderLevelsFromRangeCommand(this.getItem().getRows(),
						this.getOwnSelection().getRanges());
					viewer.getInteractionHandler().execute(cmd);
					return true;
				}
				doDefault();
				break;
			case 'g':
				if (event.event.altKey) {
					const header = event.event.ctrlKey ? item.getRows() : item.getColumns();
					const old = header.getHeaderAttributes().getOutlineDirection().getValue();
					const path = AttributeUtils.createPath(JSG.HeaderAttributes.NAME,
						JSG.HeaderAttributes.OUTLINEDIRECTION);
					const cmd = new SetAttributeAtPathCommand(header, path, old === 'above' ? 'below' : 'above');
					viewer.getInteractionHandler().execute(cmd);
					return true;
				}
				doDefault();
				break;
			case '#':
				if (event.event.ctrlKey) {
					item.setShowFormulas(!item.isShowFormulas());
					event.consume();
					invalidate();
					return true;
				}
				doDefault();
				break;
			case '+':
				if (event.event.ctrlKey) {
					if (this.getOwnSelection().areRowsSelected()) {
						this.insertCells(viewer, 'rows');
					} else if (this.getOwnSelection().areColumnsSelected()) {
						this.insertCells(viewer, 'columns');
					} else {
						this.insertCells(viewer);
					}
					event.consume();
					return true;
				}
				doDefault();
				break;
			case '-':
				if (event.event.ctrlKey) {
					if (this.getOwnSelection().areRowsSelected()) {
						this.deleteCells(viewer, 'rows');
					} else if (this.getOwnSelection().areColumnsSelected()) {
						this.deleteCells(viewer, 'columns');
					} else {
						this.deleteCells(viewer);
					}
					event.consume();
					return true;
				}
				doDefault();
				break;
			case 'Delete':
			case 'Backspace':
				// delete, backspace
				if (this.getOwnSelection().hasSelection()) {
					this.deleteCellContent(viewer, 'values');
					return true;
				}
				break;
			case 'Tab':
				currentCell = getCurrentActiveCell();
				if (currentCell) {
					const attr = item.getCellAttributesAt(currentCell);
					if (attr.getKey().getValue()) {
						this.changeLevel(viewer, event.event.shiftKey);
						return true;
					}
					this.updateSelectionFromEvent(
						event.event.shiftKey ? 'ArrowLeft' : 'ArrowRight',
						false,
						false,
						selection
					);
					this.notifySelectionChange(viewer);
				}
				return true;
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'ArrowDown':
			case 'ArrowUp':
				currentCell = getCurrentActiveCell();
				if (currentCell) {
					if (event.event.altKey) {
						this.changeHeaderLevel(viewer, event.event.key);
						return true;
					}
					this.updateSelectionFromEvent(
						event.event.key,
						event.event.shiftKey,
						event.event.ctrlKey,
						selection
					);
					this.notifySelectionChange(viewer);
					return true;
				}
				break;
			case 'Enter':
				// enter
				if (JSG.clipSheet && JSG.clipSheet.range) {
					this.pasteFromClipboard(viewer, selection.getAt(0).copy(), JSG.clipSheet.data, 'all', false);
					event.consume();
					return true;
				}
				doDownArrow(selection);
				return true;
			case 'Escape':
				// Esc
				if (JSG.clipSheet) {
					JSG.clipSheet.range = undefined;
					invalidate();
					return true;
				}
				return true;
			case 'v':
			case 'V':
				// v -> paste or paste format
				if (event.event.ctrlKey || event.event.metaKey) {
					return false;
				}
				doDefault();
				break;
			case 'x':
			case 'X':
			// x -> cut
			/* eslint-disable-next-line no-fallthrough */
			case 'c':
			case 'C':
				// c -> copy
				if (event.event.ctrlKey || event.event.metaKey) {
					this.copyCells(event.event.keyCode === 88);
					event.consume();
					invalidate();
					return true;
				}
				doDefault();
				break;
			case 'Meta':
			case 'F1':
			case 'F3':
			case 'F4':
			case 'F5':
			case 'F6':
			case 'F7':
			case 'F8':
			case 'F9':
			case 'F10':
			case 'F11':
			case 'F12':
				break;
			default:
				if (!event.event.ctrlKey && !event.event.metaKey) {
					doDefault();
				}
				break;
		}

		return false;
	}

	updateSelectionFromEvent(key, shiftKey, ctrlKey, selection) {
		const currentCell = selection.getActiveCell();
		let index = selection.getActiveRangeIndex();
		const range = selection.getAt(index);
		const item = this.getItem();

		if (currentCell === undefined) {
			return;
		}

		switch (key) {
			case 'ArrowRight':
				if (shiftKey && range) {
					const endCell = new Point(0, 0);
					if (currentCell.x > range.getX1()) {
						if (ctrlKey) {
							endCell.x = item
								.getDataProvider()
								.getNextOrLastUsedCell({ x: range.getX1(), y: range.getY1() }, 'right');
						} else {
							endCell.x = item.getNextSelectableColumn(range.getX1(), range.getY1());
						}
					} else if (ctrlKey) {
						endCell.x = item
							.getDataProvider()
							.getNextOrLastUsedCell({ x: range.getX2(), y: range.getY2() }, 'right');
					} else {
						endCell.x = item.getNextSelectableColumn(range.getX2(), range.getY2());
					}
					if (currentCell.y > range.getY1()) {
						endCell.y = range.getY1();
					} else {
						endCell.y = range.getY2();
					}
					selection.update(index, item.getRangeFromPositions(currentCell, endCell));
					this.showCell(endCell);
				} else {
					if (ctrlKey) {
						currentCell.x = item.getDataProvider().getNextOrLastUsedCell(currentCell, 'right');
					} else {
						currentCell.x = item.getNextSelectableColumn(currentCell.x, currentCell.y);
					}
					index = selection.getActiveRange();
					if (index === undefined) {
						selection.removeAll();
						selection.add(item.getRangeFromPositions(currentCell));
						selection.getActiveCell().setTo(currentCell);
					} else {
						selection.update(index, item.getRangeFromPositions(currentCell));
					}
					this.showCell(currentCell);
				}
				break;
			case 'ArrowLeft':
				if (shiftKey && range) {
					const endCell = new Point(0, 0);
					if (currentCell.x > range.getX1()) {
						if (ctrlKey) {
							endCell.x = item
								.getDataProvider()
								.getNextOrLastUsedCell({ x: range.getX1(), y: range.getY1() }, 'left');
						} else {
							endCell.x = item.getPreviousSelectableColumn(range.getX1(), range.getY1());
						}
					} else if (ctrlKey) {
						endCell.x = item
							.getDataProvider()
							.getNextOrLastUsedCell({ x: range.getX2(), y: range.getY2() }, 'left');
					} else {
						endCell.x = item.getPreviousSelectableColumn(range.getX2(), range.getY2());
					}
					if (currentCell.y > range.getY1()) {
						endCell.y = range.getY1();
					} else {
						endCell.y = range.getY2();
					}
					selection.update(index, item.getRangeFromPositions(currentCell, endCell));
					this.showCell(endCell);
				} else if (currentCell.x > 0) {
					if (ctrlKey) {
						currentCell.x = item.getDataProvider().getNextOrLastUsedCell(currentCell, 'left');
					} else {
						currentCell.x = item.getPreviousSelectableColumn(currentCell.x, currentCell.y);
					}
					index = selection.getActiveRange();
					if (index === undefined) {
						selection.removeAll();
						selection.add(item.getRangeFromPositions(currentCell));
						selection.getActiveCell().setTo(currentCell);
					} else {
						selection.update(index, item.getRangeFromPositions(currentCell));
					}
					this.showCell(currentCell);
				}
				break;
			case 'ArrowDown':
				if (shiftKey && range) {
					const endCell = new Point(0, 0);
					if (currentCell.x > range.getX1()) {
						endCell.x = range.getX1();
					} else {
						endCell.x = range.getX2();
					}
					if (currentCell.y > range.getY1()) {
						if (ctrlKey) {
							endCell.y = item
								.getDataProvider()
								.getNextOrLastUsedCell({ x: range.getX1(), y: range.getY1() }, 'down');
						} else {
							endCell.y = item.getNextSelectableRow(range.getY1(), range.getX1());
						}
					} else if (ctrlKey) {
						endCell.y = item
							.getDataProvider()
							.getNextOrLastUsedCell({ x: range.getX2(), y: range.getY2() }, 'down');
					} else {
						endCell.y = item.getNextSelectableRow(range.getY2(), range.getX1());
					}
					selection.update(index, item.getRangeFromPositions(currentCell, endCell));
					this.showCell(endCell);
				} else if (currentCell.y < item.getRows().getSections() - 1) {
					if (ctrlKey) {
						currentCell.y = item.getDataProvider().getNextOrLastUsedCell(currentCell, 'down');
					} else {
						currentCell.y = item.getNextSelectableRow(currentCell.y, currentCell.x);
					}
					index = selection.getActiveRange();
					if (index === undefined) {
						selection.removeAll();
						selection.add(item.getRangeFromPositions(currentCell));
						selection.getActiveCell().setTo(currentCell);
					} else {
						selection.update(index, item.getRangeFromPositions(currentCell));
					}
					this.showCell(currentCell);
				}
				break;
			case 'ArrowUp':
				if (shiftKey && range) {
					const endCell = new Point(0, 0);
					if (currentCell.x > range.getX1()) {
						endCell.x = range.getX1();
					} else {
						endCell.x = range.getX2();
					}
					if (currentCell.y > range.getY1()) {
						if (ctrlKey) {
							endCell.y = item
								.getDataProvider()
								.getNextOrLastUsedCell({ x: range.getX1(), y: range.getY1() }, 'up');
						} else {
							endCell.y = item.getPreviousSelectableRow(range.getY1(), range.getX1());
						}
					} else if (ctrlKey) {
						endCell.y = item
							.getDataProvider()
							.getNextOrLastUsedCell({ x: range.getX2(), y: range.getY2() }, 'up');
					} else {
						endCell.y = item.getPreviousSelectableRow(range.getY2(), range.getX2());
					}
					selection.update(index, item.getRangeFromPositions(currentCell, endCell));
					this.showCell(endCell);
				} else if (currentCell.y > 0) {
					if (ctrlKey) {
						currentCell.y = item.getDataProvider().getNextOrLastUsedCell(currentCell, 'up');
					} else {
						currentCell.y = item.getPreviousSelectableRow(currentCell.y, currentCell.x);
					}
					index = selection.getActiveRange();
					if (index === undefined) {
						selection.removeAll();
						selection.add(item.getRangeFromPositions(currentCell));
						selection.getActiveCell().setTo(currentCell);
					} else {
						selection.update(index, item.getRangeFromPositions(currentCell));
					}
					this.showCell(currentCell);
				}
				break;
		}
	}

	getRangeRect(range) {
		const item = this.getItem();
		const rect = item.getCellRect(range);
		const offset = this.getScrollOffset();
		const viewport = this.getViewPort();

		if (!viewport) {
			return undefined;
		}

		const colSize = item.getColumns().getInternalHeight();
		const rowSize = item.getRows().getInternalWidth();

		rect.translate(rowSize + offset.x, colSize + offset.y);

		return rect;
	}

	/**
	 *
	 * @method getCellRect
	 * @param {Point} cell position.
	 * @returns {Rect} Cell rect in logical units.
	 */
	getCellRect(cell) {
		return this.getRangeRect(new CellRange(this.getItem(), cell.x, cell.y));
	}

	showActiveCell() {
		return this.showCell(this.getOwnSelection().getActiveCell());
	}

	scroll(x, y) {
		const viewport = this.getViewPort();
		let model;

		if (!viewport) {
			return;
		}

		if (x) {
			model = viewport.getHorizontalRangeModel();
			viewport.getHorizontalRangeModel().setValue(model._value + x);
		}

		if (y) {
			model = viewport.getVerticalRangeModel();
			viewport.getVerticalRangeModel().setValue(model._value + y);
		}
	}

	scrollToRange(range) {
		if (range === undefined) {
			return;
		}

		const rect = this.getItem().getCellRect(range);
		const viewport = this.getViewPort();

		const colSize = this.getItem()
			.getColumns()
			.getInternalHeight();
		const rowSize = this.getItem()
			.getRows()
			.getInternalWidth();

		rect.translate(rowSize, colSize);

		let model = viewport.getHorizontalRangeModel();
		viewport.getHorizontalRangeModel().setValue(model._min + rect.x - rowSize);
		model = viewport.getVerticalRangeModel();
		viewport.getVerticalRangeModel().setValue(model._min + rect.y - colSize);
	}

	showCell(cell) {
		if (cell === undefined) {
			return false;
		}

		const item = this.getItem();
		const rect = item.getCellRect(new CellRange(item, cell.x, cell.y));
		const offset = this.getScrollOffset();
		const viewport = this.getViewPort();

		if (!viewport) {
			return false;
		}

		const bounds = viewport.getBounds();
		const colSize = item.getColumns().getInternalHeight();
		const rowSize = item.getRows().getInternalWidth();
		let changed = false;
		let model;

		rect.translate(rowSize, colSize);

		if (rect.x + offset.x < rowSize) {
			model = viewport.getHorizontalRangeModel();
			viewport.getHorizontalRangeModel().setValue(model._min + rect.x - rowSize);
			changed = true;
		}

		if (rect.y + offset.y < colSize) {
			model = viewport.getVerticalRangeModel();
			viewport.getVerticalRangeModel().setValue(model._min + rect.y - colSize);
			changed = true;
		}

		if (rect.getRight() + offset.x > bounds.width - rowSize) {
			model = viewport.getHorizontalRangeModel();
			viewport.getHorizontalRangeModel().setValue(model._min + rect.getRight() - bounds.width);
			changed = true;
		}

		if (rect.getBottom() + offset.y - 1 > bounds.height - colSize) {
			model = viewport.getVerticalRangeModel();
			viewport.getVerticalRangeModel().setValue(model._min + rect.getBottom() - bounds.height);
			changed = true;
		}

		return changed;
	}

	getHitCode(location, viewer, checkSelectedRange = false) {
		const bounds = this.getScrollView().getBounds();
		let point = location.copy();
		const hScrollSize =
			this.getItem().getHorizontalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;
		const vScrollSize = this.getItem().getVerticalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;

		point = this.translateToSheet(point, viewer);

		if (point.x > bounds.width - vScrollSize || point.y > bounds.height - hScrollSize) {
			return WorksheetView.HitCode.NONE;
		}

		if (checkSelectedRange) {
			const ranges = this.getOwnSelection().getRanges();
			return ranges.some((range) => {
				const selRect = this.getRangeRect(range);
				if (range.isRowRange()) {
					selRect.x = 0;
				}
				if (range.isColumnRange()) {
					selRect.y = 0;
				}
				return selRect.containsPoint(point);
			})
				? WorksheetView.HitCode.NONE
				: WorksheetView.HitCode.SHEET;
		}

		if (this.getItem().isProtected() === false) {
			const colHeight = this.getItem()
				.getColumns()
				.getInternalHeight();
			const rowWidth = this.getItem()
				.getRows()
				.getInternalWidth();
			let cv;

			if (point.x < rowWidth && point.y < colHeight) {
				return WorksheetView.HitCode.CORNER;
			}

			if (colHeight && point.y < colHeight) {
				cv = this.getColumnHeaderView();
				if (cv) {
					const size = cv.getItem().getSizeAsPoint()
					if (point.x - rowWidth < cv.getItem().getWidth() + JSG.findRadius / 2) {
						if (point.y < size.y - ColumnHeaderNode.HEIGHT) {
							return WorksheetView.HitCode.COLUMNOUTLINE;
						}
						const section = cv.getSectionSplit(point.x);
						if (section !== undefined) {
							return cv.getItem().getSectionSize(section) ?
								WorksheetView.HitCode.COLUMNSIZE :
								WorksheetView.HitCode.COLUMNSIZEHIDDEN;
						}
						return WorksheetView.HitCode.COLUMN;
					}
				}
			}

			if (rowWidth && point.x < rowWidth) {
				cv = this.getRowHeaderView();
				if (cv) {
					const size = cv.getItem().getSizeAsPoint()
					if (point.y - colHeight < size.y + JSG.findRadius / 2) {
						if (point.x < size.x - RowHeaderNode.WIDTH) {
							return WorksheetView.HitCode.ROWOUTLINE;
						}
						const section = cv.getSectionSplit(point.y);
						if (section !== undefined) {
							return cv.getItem().getSectionSize(section) ?
								WorksheetView.HitCode.ROWSIZE :
								WorksheetView.HitCode.ROWSIZEHIDDEN;
						}
						return WorksheetView.HitCode.ROW;
					}
				}
			}
		}

		const cellEditor = CellEditor.getActiveCellEditor();
		if (cellEditor) {
			const editRanges = cellEditor.getEditRanges();
			if (editRanges) {
				cellEditor.rangeIndex = undefined;
				cellEditor.rangeResize = undefined;
				if (
					editRanges.getRanges().some((range, index) => {
						const selRect = this.getRangeRect(range);
						selRect.expandBy(150);
						if (selRect.containsPoint(point)) {
							const sizeRect = selRect.copy();
							sizeRect.width = 300;
							sizeRect.height = 300;
							selRect.reduceBy(250);
							if (!selRect.containsPoint(point)) {
								selRect.expandBy(100);
								sizeRect.x = selRect.x - 150;
								sizeRect.y = selRect.y - 150;
								if (sizeRect.containsPoint(point)) {
									cellEditor.rangeResize = 0;
								}
								sizeRect.x += selRect.width;
								if (sizeRect.containsPoint(point)) {
									cellEditor.rangeResize = 1;
								}
								sizeRect.y += selRect.height;
								if (sizeRect.containsPoint(point)) {
									cellEditor.rangeResize = 2;
								}
								sizeRect.x -= selRect.width;
								if (sizeRect.containsPoint(point)) {
									cellEditor.rangeResize = 3;
								}
								cellEditor.rangeIndex = index;
								return true;
							}
						}
						return false;
					})
				) {
					return WorksheetView.HitCode.REFERENCEMOVE;
				}
			}
		}

		if (this.getOwnSelection().getSize() === 1) {
			const selRect = this.getRangeRect(this.getOwnSelection().getAt(0));
			selRect.expandBy(150);
			if (selRect.containsPoint(point)) {
				selRect.reduceBy(250);
				if (!selRect.containsPoint(point)) {
					if (point.x > selRect.getRight() && point.y > selRect.getBottom()) {
						return WorksheetView.HitCode.SELECTIONEXTEND;
					}
					return WorksheetView.HitCode.SELECTIONMOVE;
				}
			}
		}

		const cell = this.getCell(point);
		if (cell === undefined) {
			return WorksheetView.HitCode.NONE;
		}

		return WorksheetView.HitCode.SHEET;
	}

	getSection(hitCode, location, viewer) {
		const bounds = this.getScrollView().getBounds();
		let point = location.copy();
		let cv;
		const hScrollSize =
			this.getItem().getHorizontalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;
		const vScrollSize = this.getItem().getVerticalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;

		point = this.translateToSheet(point, viewer);

		if (point.x > bounds.width - vScrollSize || point.y > bounds.height - hScrollSize) {
			return undefined;
		}

		switch (hitCode) {
			case WorksheetView.HitCode.COLUMNSIZE:
			case WorksheetView.HitCode.COLUMNSIZEHIDDEN:
				cv = this.getColumnHeaderView();
				if (cv) {
					return cv.getSectionSplit(point.x);
				}
				break;
			case WorksheetView.HitCode.ROWSIZE:
			case WorksheetView.HitCode.ROWSIZEHIDDEN:
				cv = this.getRowHeaderView();
				if (cv) {
					return cv.getSectionSplit(point.y);
				}
				break;
			default:
				break;
		}

		return undefined;
	}

	translateToSheet(point, viewer) {
		viewer.translateFromParent(point);

		GraphUtils.traverseDown(this.getGraphView(), this, (v) => {
			v.translateFromParent(point);
			return true;
		});

		return point;
	}

	translateFromSheet(point, viewer) {
		GraphUtils.traverseUp(this, viewer.getRootView(), (v) => {
			v.translateToParent(point);
			return true;
		});

		return point;
	}

	setCursor(hitCode, interaction) {
		switch (hitCode) {
			case WorksheetView.HitCode.SHEET:
			case WorksheetView.HitCode.CORNER:
				interaction.setCursor(Cursor.Style.SHEET);
				break;
			case WorksheetView.HitCode.ROW:
				interaction.setCursor(Cursor.Style.SHEETROW);
				break;
			case WorksheetView.HitCode.COLUMN:
				interaction.setCursor(Cursor.Style.SHEETCOLUMN);
				break;
			case WorksheetView.HitCode.COLUMNSIZE:
				interaction.setCursor(Cursor.Style.SHEETCOLUMNSIZE);
				break;
			case WorksheetView.HitCode.COLUMNSIZEHIDDEN:
				interaction.setCursor(Cursor.Style.SPLITH);
				break;
			case WorksheetView.HitCode.ROWSIZE:
				interaction.setCursor(Cursor.Style.SHEETROWSIZE);
				break;
			case WorksheetView.HitCode.ROWSIZEHIDDEN:
				interaction.setCursor(Cursor.Style.SPLITV);
				break;
			case WorksheetView.HitCode.SELECTIONMOVE:
				interaction.setCursor(Cursor.Style.MOVE);
				break;
			case WorksheetView.HitCode.SELECTIONEXTEND:
				interaction.setCursor(Cursor.Style.CROSSHAIR);
				break;
			case WorksheetView.HitCode.REFERENCEMOVE: {
				const cellEditor = CellEditor.getActiveCellEditor();
				let rangeResize;
				if (cellEditor) {
					rangeResize = cellEditor.rangeResize;
				}
				switch (rangeResize) {
					case 0:
						interaction.setCursor(Cursor.Style.RESIZE_NW);
						break;
					case 1:
						interaction.setCursor(Cursor.Style.RESIZE_NE);
						break;
					case 2:
						interaction.setCursor(Cursor.Style.RESIZE_SE);
						break;
					case 3:
						interaction.setCursor(Cursor.Style.RESIZE_SW);
						break;
					default:
						interaction.setCursor(Cursor.Style.MOVE);
						break;
				}
				break;
			}
			default:
				interaction.setCursor(Cursor.Style.AUTO);
				break;
		}
	}

	setPayloadRange(viewer, flag) {
		const attributesMap = new Dictionary();
		attributesMap.put(CellAttributes.KEY, flag);
		if (flag === false) {
			attributesMap.put(CellAttributes.LEVEL, 0);
		}

		const cmd = new CellAttributesCommand(this.getOwnSelection().getRanges(), attributesMap);

		viewer.getInteractionHandler().execute(cmd);
	}

	deleteCells(viewer, type) {
		const selection = this.getOwnSelection();

		if (selection.getSize() > 1) {
			this.notifyMessage({ id: 'SheetMessage.singleSelection' });
			return;
		}

		const range = selection.getAt(0);

		if (selection.areColumnsSelected() && (range.getX1() < 2 || range.getX2() < 2)) {
			this.notifyMessage({ id: 'SheetMessage.nodeletebefore' });
			return;
		}

		if (type === undefined) {
			if (selection.areRowsSelected()) {
				type = 'rows';
			} else if (selection.areColumnsSelected()) {
				type = 'columns';
			} else {
				this.notifyAction('deletecells');
				return;
			}
		}

		viewer.getInteractionHandler().execute(new DeleteCellsCommand(range, type));
		this.notify();
	}

	insertCells(viewer, type) {
		const selection = this.getOwnSelection();

		if (selection.getSize() !== 1) {
			this.notifyMessage({ id: 'SheetMessage.singleSelection' });
			return;
		}

		if (type === undefined) {
			if (selection.areRowsSelected()) {
				type = 'rows';
			} else if (selection.areColumnsSelected()) {
				type = 'columns';
			} else {
				this.notifyAction('insertcells');
				return;
			}
		}

		const range = selection.getAt(0);

		const used = this.getItem()
			.getDataProvider()
			.getUsedRange();
		switch (type) {
			case 'rows':
			case 'cellsvertical':
				if (used.getY2() + range.getHeight() >= this.getItem().getRowCount()) {
					this.notifyMessage({ id: 'SheetMessage.space' });
					return;
				}
				break;
			case 'columns':
				if (range.getX1() < 2 || range.getX2() < 2) {
					this.notifyMessage({ id: 'SheetMessage.noinsertbefore' });
					return;
				}
				if (used.getX2() + range.getWidth() >= this.getItem().getColumnCount()) {
					this.notifyMessage({ id: 'SheetMessage.space' });
					return;
				}
				break;
			case 'cellshorizontal':
				if (used.getX2() + range.getWidth() >= this.getItem().getColumnCount()) {
					this.notifyMessage({ id: 'SheetMessage.space' });
					return;
				}
				break;
		}

		viewer.getInteractionHandler().execute(new InsertCellsCommand(range, type));
		this.notify();
	}

	changeHeaderLevel(viewer, key) {
		const cmd = new SetHeaderSectionLevelCommand(key === 'ArrowRight' || key === 'ArrowLeft' ?
			this.getItem().getRows() :
			this.getItem().getColumns(), this.getOwnSelection().getRanges(), key);

		viewer.getInteractionHandler().execute(cmd);
	}

	changeLevel(viewer, down) {
		const cmd = new SetCellLevelsCommand(this.getItem(), this.getOwnSelection().getRanges(), down);

		viewer.getInteractionHandler().execute(cmd);
	}

	deleteCellContent(viewer, type) {
		if (!this.getOwnSelection().hasSelection()) {
			return;
		}

		const ref = this.getOwnSelection().toStringMulti();

		viewer.getInteractionHandler().execute(new DeleteCellContentCommand(this.getItem(), ref, type));
		this.notify();
	}

	getCopyData(cut) {
		const id = this.getItem()
			.getGraph()
			.newUniqueId();
		const writer = new JSONWriter();

		writer.writeStartDocument();
		this.getOwnSelection().save(writer, cut, id);
		writer.writeEndDocument();

		return writer.flush();
	}

	copyCells(cut) {
		if (this.getOwnSelection().getSize() !== 1) {
			this.notifyMessage({ id: 'SheetMessage.singleSelection' });
			return;
		}

		// we copy twice, one for the system clipboard and one for internal usage. An id is assigned to the copy data
		// to find out whether the internal data is in sync with the system clipboard. This way we can initiate a
		// paste using internal commands

		JSG.clipSheet = {
			data: this.getCopyData(cut),
			range: this.getOwnSelection()
				.getAt(0)
				.copy()
		};

		this.copyToClipboard(JSG.clipSheet.data);

		this.notify();
	}

	copyText() {
		if (this.getOwnSelection().getSize() !== 1) {
			this.notifyMessage({ id: 'SheetMessage.singleSelection' });
			return;
		}

		const text = this.getOwnSelection().saveText();

		this.copyToClipboard(text);
		this.notify();
	}


	copyToClipboard(data) {
		if (this.getOwnSelection().getSize() !== 1) {
			this.notifyMessage({ id: 'SheetMessage.singleSelection' });
			return;
		}

		const focus = document.activeElement;
		const textarea = document.createElement('textarea');

		// Place in top-left corner of screen regardless of scroll position.
		textarea.style.position = 'fixed';
		textarea.style.top = 0;
		textarea.style.left = 0;

		// Ensure it has a small width and height. Setting to 1px / 1em
		// doesn't work as this gives a negative w/h on some browsers.
		textarea.style.width = '1px';
		textarea.style.height = '1px';
		textarea.style.padding = 0;
		textarea.style.border = 'none';
		textarea.style.outline = 'none';
		textarea.style.boxShadow = 'none';
		textarea.style.background = 'transparent';

		document.body.appendChild(textarea);

		/* Copy the text inside the text field */
		textarea.value = data;
		textarea.select();

		JSG.cutMarker = false;

		document.execCommand('Copy');
		document.body.removeChild(textarea);
		focus.focus();
	}

	pasteFromClipboard(viewer, target, json, action, fill, overwrite) {
		if (json === undefined) {
			this.notifyMessage({ id: 'SheetMessage.noClip' });
			return false;
		}

		if (!this.getOwnSelection().hasSelection()) {
			this.notifyMessage({ id: 'SheetMessage.noTarget' });
			return false;
		}

		const item = this.getItem();

		const internalPaste = () => {
			try {
				const reader = new JSONReader(json);
				const data = target.getSheet().readFromClipboard(reader);

				if (data === undefined) {
					const root = reader.getRoot();
					const graphClip = reader.getObject(root, 'clip');
					if (graphClip !== undefined) {
						const cmd = new PasteItemsCommand(json, viewer, item.getCells());
						viewer.getInteractionHandler().execute(cmd);
						return true;
					}
					return false;
				}

				const graph = item.getGraph();
				const sourceSheet = graph.getItemById(Number(data.sheetId));

				if (
					data.range.isRowRange() !== target.isRowRange() ||
					data.range.isColumnRange() !== target.isColumnRange()
				) {
					this.notifyMessage({ id: 'SheetMessage.sourceTarget' });
					return true;
				}

				const cmd = new PasteCellsFromClipboardCommand(target, data, json, action, fill);

				const targetRange = cmd.getCompleteTargetRange();
				const targetSheet = targetRange.getSheet();
				if (
					targetRange.getX2() >= targetSheet.getColumnCount() ||
					targetRange.getY2() >= targetSheet.getRowCount()
				) {
					this.notifyMessage({ id: 'SheetMessage.destRange' });
					return true;
				}

				if (targetRange.containsValues(data.range) && overwrite !== true && data.cut) {
					this._clipTarget = target;
					this.notifyAction('pastecells');
					return true;
				}

				if (data.cut && !JSG.cutMarker) {
					const range = new CellRange(sourceSheet);
					range.set(data.range.getX1(), data.range.getY1());
					range.shiftToSheet();
					const ref = `${data.rangeString};${range.toString()}`;
					cmd.addCut(new DeleteCellContentCommand(sourceSheet, ref, 'all'));
				}

				if (fill) {
					const seriesData = item
						.getDataProvider()
						.getCellValueSeries(item.getOwnSelection().getAt(0), target);
					if (seriesData && seriesData.length) {
						cmd.addSeries(new SetCellsCommand(item, seriesData, true));
					}
				}

				const selection = target.getSheet().getOwnSelection();
				if (fill) {
					const old = selection.getAt(0);
					if (old) {
						old.sort();
						targetRange.sort();
						targetRange.setX1(Math.min(targetRange.getX1(), old.getX1()));
						targetRange.setX2(Math.max(targetRange.getX2(), old.getX2()));
						targetRange.setY1(Math.min(targetRange.getY1(), old.getY1()));
						targetRange.setY2(Math.max(targetRange.getY2(), old.getY2()));
					}
				}
				selection.selectRange(targetRange);

				viewer.getInteractionHandler().execute(cmd);
				if (data.cut) {
					JSG.cutMarker = true;
				}
			} catch (e) {
				return false;
			}

			return true;
		};

		const textMeasure = () => {
			let rowCount = 0;
			let columnCount = 0;
			try {
				const rows = json.split('\n');

				if (rows.length && rows[rows.length - 1] === '') {
					rows.pop();
				}

				rowCount = rows.length;

				rows.forEach((row) => {
					const columns = row.split('\t');
					columnCount = Math.max(columnCount, columns.length);
				});
			} catch (e) {
				return false;
			}

			return { rows: rowCount, columns: columnCount };
		};

		const textPaste = () => {
			// experimental -> need to create command
			try {
				const cellData = [];
				const rows = json.split('\n');
				let currentRow = target.getY1();

				if (rows.length && rows[rows.length - 1] === '') {
					rows.pop();
				}

				rows.forEach((row) => {
					const columns = row.split('\t');
					let currentColumn = target.getX1();
					columns.forEach((column) => {
						const isFormula = column.charAt(0) === '=';
						let formula = column;

						if (isFormula) {
							formula = formula.substring(1);
						}

						JSG.FormulaParser.context.separators = JSG.getParserLocaleSettings().separators;
						const term = isFormula
							? JSG.FormulaParser.parse(formula, item.getGraph(), item)
							: JSG.FormulaParser.parseValue(formula, item.getGraph(), item);
						JSG.FormulaParser.context.separators = Locale.EN.separators;

						formula = term ? term.toLocaleString('en', { item, useName: true }) : '';
						const data = isFormula
							? new Expression(0, formula)
							: ExpressionHelper.createExpressionFromValueTerm(term);

						data.evaluate(item);

						const cell = {};
						cell.reference = this.getOwnSelection().cellToString(currentColumn, currentRow);
						cell.value = data.getValue();
						cell.formula = isFormula ? data.getFormula() : undefined;

						cellData.push(cell);
						currentColumn += 1;
					});
					currentRow += 1;
				});

				viewer.getInteractionHandler().execute(new SetCellsCommand(this.getItem(), cellData, true));
			} catch (e) {
				return false;
			}

			return true;
		};

		const attributesMap = new Dictionary();
		attributesMap.put(CellAttributes.LEVEL, 0);

		const jsonMeasure = (model, rows) => {
			Object.keys(model).forEach((key) => {
				if (model[key] instanceof Object) {
					rows += 1;
					rows = jsonMeasure(model[key], rows);
				} else {
					rows += 1;
				}
			});

			return rows;
		};

		const jsonPaste = (model, cellData, state, limit) => {
			const setValue = (value, lstate, key) => {
				const cell = {};

				cell.reference = this.getOwnSelection().cellToString(lstate.column + (key ? 0 : 1), lstate.row);
				if (key) {
					cell.level = lstate.level;
				}
				cell.value = value;

				cellData.push(cell);
			};

			Object.keys(model).forEach((key) => {
				if (model[key] instanceof Object) {
					setValue(key, state, true);
					setValue(undefined, state, false);
					state.row += 1;
					if (state.row < limit) {
						state.level += 1;
						jsonPaste(model[key], cellData, state, limit);
						state.level -= 1;
					}
				} else if (state.row < limit) {
					setValue(key, state, true);
					setValue(model[key], state, false);
					state.row += 1;
				}
			});

			return true;
		};

		if (internalPaste()) {
			this.notifySelectionChange(viewer);
			return true;
		}

		if (json[0] === '{') {
			try {
				const jsonModel = JSON.parse(json);
				let rows = target.getHeight();
				if (target.getWidth() === 1 && target.getHeight() === 1) {
					rows = jsonMeasure(jsonModel, 0);
					if (target.getY1() + rows > item.getRowCount() || target.getX1() + 1 > item.getColumnCount()) {
						this.notifyMessage({ id: 'SheetMessage.destRange' });
						return false;
					}
				}
				const cellData = [];
				jsonPaste(
					jsonModel,
					cellData,
					{ row: target.getY1(), column: target.getX1(), level: 0 },
					rows + target.getY1()
				);
				const selection = target.getSheet().getOwnSelection();
				const selectRange = target.copy();
				selectRange.setX2(selectRange.getX1() + 1);
				selectRange.setY2(selectRange.getY1() + rows - 1);
				selection.selectRange(selectRange);
				attributesMap.remove(CellAttributes.LEVEL);
				attributesMap.put(CellAttributes.KEY, true);

				viewer.getInteractionHandler().execute(new SetCellsCommand(this.getItem(), cellData, true));

				const cmd = new CellAttributesCommand([selectRange], attributesMap);

				viewer.getInteractionHandler().execute(cmd);
				this.notifySelectionChange(viewer);
				return true;
				// eslint-disable-next-line no-empty
			} catch (e) {
			}
		}

		const size = textMeasure(json);
		if (size !== false) {
			if (
				target.getY1() + size.rows > item.getRowCount() ||
				target.getX1() + size.columns > item.getColumnCount()
			) {
				this.notifyMessage({ id: 'SheetMessage.destRange' });
				return false;
			}
		}

		if (textPaste()) {
			const selection = target.getSheet().getOwnSelection();
			const selectRange = target.copy();
			selectRange.setX2(selectRange.getX1() + size.columns - 1);
			selectRange.setY2(selectRange.getY1() + size.rows - 1);
			selection.selectRange(selectRange);
			this.notifySelectionChange(viewer);
			return true;
		}

		this.notifyMessage({ id: 'SheetMessage.noClip' });

		return false;
	}

	isTopView() {}

	getMaxColumnWidth(columnIndex, viewer) {
		const item = this.getItem();
		const rows = item.getRows();
		const graphics = viewer.getGraphicSystem().getGraphics();
		const data = item.getDataProvider();
		let width = 0;

		rows.enumerateSections((rowSection, rowIndex) => {
			const height = rows.getSectionSize(rowIndex);
			if (height) {
				const cell = data.getRC(columnIndex, rowIndex);
				if (cell && cell.hasContent()) {
					const textFormat = item.getTextFormatAtRC(columnIndex, rowIndex);
					const attributes = item.getCellAttributesAtRC(columnIndex, rowIndex);
					graphics.setFontName(textFormat.getAttribute(TextFormatAttributes.FONTNAME).getValue());
					graphics.setFontSize(textFormat.getAttribute(TextFormatAttributes.FONTSIZE).getValue());
					graphics.setFontStyle(textFormat.getAttribute(TextFormatAttributes.FONTSTYLE).getValue());

					const expr = cell.getExpression();
					let value = cell.getValue();
					let extraSpace = 0;
					if (expr) {
						const termFunc = expr.getTerm();
						if (cell.displayFunctionName && termFunc && termFunc instanceof FuncTerm) {
							const fnName = termFunc.getFuncId();
							if (fnName !== 'READ' && fnName !== 'WRITE' && fnName !== 'SELECT') {
								value = fnName;
							}
							if (fnName !== 'SELECT') {
								graphics.setFontStyle(TextFormatAttributes.FontStyle.BOLD);
							}
							if (fnName === 'SELECT') {
								extraSpace = 500;
							}
						}
					}

					graphics.setFont();

					const formattingResult = item.getFormattedValue(
						expr,
						value,
						textFormat,
						false
					);
					if (formattingResult.formattedValue !== undefined && formattingResult.formattedValue !== '') {
						let textWidth =
							graphics
								.getCoordinateSystem()
								.deviceToLogX(graphics.measureText(formattingResult.formattedValue).width, true) + 210;
						textWidth += attributes.getLevel().getValue() * 150;
						width = Math.max(textWidth, width) + extraSpace;
					}
				}
			}
		});

		if (width === 0) {
			width = item.getColumns().getDefaultSectionSize();
		}

		return width;
	}

	getMaxRowHeight(rowIndex, viewer) {
		const item = this.getItem();
		const columns = item.getColumns();
		const data = item.getDataProvider();
		let height = item.getRows().getDefaultSectionSize();

		columns.enumerateSections((columnSection, columnIndex) => {
			const width = columns.getSectionSize(rowIndex);
			if (width) {
				const cell = data.getRC(columnIndex, rowIndex);
				if (cell && cell.hasContent()) {
					const textFormat = item.getTextFormatAtRC(columnIndex, rowIndex);

					const formattingResult = item.getFormattedValue(
						cell.getExpression(),
						cell.getValue(),
						textFormat,
						false
					);
					if (formattingResult.formattedValue !== undefined) {
						const metrics = GraphUtils.getFontMetrics(textFormat);
						const textHeight = metrics.lineheight + 100;
						height = Math.max(textHeight, height);
					}
				}
			}
		});

		return height;
	}

	getNumberFormatCommand(viewer, pos, numberFormat, localCulture) {
		const attributesMap = new Dictionary();

		attributesMap.put(JSG.TextFormatAttributes.NUMBERFORMAT, numberFormat);
		attributesMap.put(JSG.TextFormatAttributes.LOCALCULTURE, localCulture);

		const current = this.getItem()
			.getTextFormatAt(pos)
			.getLocalCulture()
			.getValue()
			.split(';');
		if (current.length && (current[0] === 'date' || current[0] === 'time')) {
			return undefined;
		}

		const range = new CellRange(this.getItem(), pos.x, pos.y);

		return new JSG.TextFormatCellsCommand([range], attributesMap);
	}

	getEditString(pos) {
		const item = this.getItem();
		const cell = item
			.getCells()
			.getDataProvider()
			.get(pos);
		let value = '<br>';

		if (cell) {
			const expr = cell.getExpression();
			if (expr && !expr.hasFormula()) {
				const tf = item.getTextFormatAt(pos);
				const current = tf
					.getLocalCulture()
					.getValue()
					.split(';');
				if (current.length && (current[0] === 'date' || current[0] === 'time')) {
					const cellValue = cell.getActualValue();
					if (Numbers.isNumber(cellValue) && cellValue !== undefined) {
						const numberFormat = tf.getNumberFormat();
						if (numberFormat !== undefined) {
							let formattingResult;
							const fmt = numberFormat.getValue();
							try {
								formattingResult = NumberFormatter.formatNumber(fmt, cellValue, current[0]);
							} catch (e) {
								// Ignore error
							}
							if (formattingResult.formattedValue !== undefined) {
								return formattingResult.formattedValue;
							}
						}
					}
				}
			}

			cell.evaluate(item);
			value = cell.toLocaleString(item, true);
			if (value === '') {
				value = '<br>';
			}
		}

		return value;
	}

	static get SHEET_ACTION_NOTIFICATION() {
		return SHEET_ACTION_NOTIFICATION;
	}

	static get SHEET_MESSAGE_NOTIFICATION() {
		return SHEET_MESSAGE_NOTIFICATION;
	}

	// TODO: extract as class
	static get HitCode() {
		return HitCode;
	}
}
