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
	CellRange,
	TreeItemsNode,
	InboxContainer,
	OutboxContainer,
	StreamSheet,
	SetCellsCommand,
	Point,
	BoundingBox
} from '@cedalo/jsg-core';
import CellFeedbackView from '../feedback/CellFeedbackView';
import WorksheetView from './WorksheetView';
import ClientEvent from '../../ui/events/ClientEvent';
import ScrollBar from '../../ui/scrollview/ScrollBar';

const SHEET_DROP_FROM_OUTBOX = 'sheet_drop_from_outbox';

/**
 * This view is for a {{#crossLink "StreamSheet"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class StreamSheetView
 * @extends WorksheetView
 * @param {StreamSheet} item The corresponding StreamSheet model.
 * @constructor
 */
export default class StreamSheetView extends WorksheetView {
	// to allow scrolling while formula editing
	handleMouseEvent(ev, viewer) {
		// content hidden -> ignore
		if (!this.getItem().isVisible()) {
			return;
		}

		this._scrollview.handleMouseEvent(ev);
		if (ev.isConsumed) {
			const node = this.getItem();
			ev.keepFocus = true;

			node.getGraph().markDirty();

			if (viewer !== undefined) {
				this.getParent().moveSheetToTop(viewer);
			}
		}
	}

	getFeedback(location, startLocation, title, sourceView, key, event, viewer) {
		if (sourceView === undefined) {
			return undefined;
		}

		const bounds = this.getScrollView().getBounds();
		let point = new Point(0, 0);
		const hScrollSize =
			this.getItem().getHorizontalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;
		const vScrollSize = this.getItem().getVerticalScrollbarMode() === JSG.ScrollBarMode.HIDDEN ? 0 : ScrollBar.SIZE;

		point.setTo(location);
		point = this.translateToSheet(point, viewer);

		if (point.x > bounds.width - vScrollSize || point.y > bounds.height - hScrollSize) {
			return undefined;
		}

		const cell = this.getCell(point);
		if (cell === undefined || cell.x === -1 || cell.y === -1) {
			return undefined;
		}

		let range;
		let color = '#FFFFFF';
		let label = '';

		if (this.isMessageBox(sourceView, event)) {
			return undefined;
		}
		const inBox = this.isInbox(sourceView, event);
		if (inBox === undefined) {
			return undefined;
		}

		const selectedItem = sourceView.getSelectedItem();
		const vertical = event.isPressed(ClientEvent.KeyType.CTRL);
		const altKey = event.isPressed(ClientEvent.KeyType.ALT);

		const treeItems = sourceView.getItem().getSubTreeForItem(selectedItem);
		treeItems.unshift(selectedItem);

		let skipDepth;
		const rows = key ? treeItems.length : 1;
		let displayRows = 0;

		for (let i = 0; i < rows; i += 1) {
			if (skipDepth !== undefined && skipDepth === treeItems[i].depth) {
				while (treeItems[i] && treeItems[i].depth >= skipDepth) {
					i += 1;
					if (treeItems[i] === undefined) {
						break;
					}
				}
				if (i >= rows) {
					break;
				}
				skipDepth = undefined;
			}
			const itemPath = sourceView.getItem().getItemPath(treeItems[i]);
			const path = TreeItemsNode.splitPath(itemPath);
			const activeItem = sourceView
				.getItem()
				.getTreeItemAttributes()
				.getActiveElement()
				.getValue();
			let activePath;

			if (activeItem && activeItem.length && itemPath.startsWith(`${activeItem}`)) {
				activePath = TreeItemsNode.splitPath(activeItem);
			}

			let pos = inBox ? 1 : 0;

			if (inBox) {
				if (activePath && activePath.length !== path.length) {
					for (; pos < activePath.length; pos += 1) {
						if (activePath[pos] !== path[pos]) {
							break;
						}
					}
					if (pos === activePath.length) {
						pos += 1;
						if (skipDepth === undefined) {
							skipDepth = treeItems[i].depth;
						}
					} else {
						pos = 0;
					}
				} else {
					pos = 1;
				}
			}
			displayRows += 1;
		}

		if (altKey) {
			if (vertical) {
				range = new CellRange(this.getItem(), cell.x, cell.y - (key ? 1 : 0), cell.x + displayRows - 1, cell.y);
			} else {
				range = new CellRange(this.getItem(), cell.x - (key ? 1 : 0), cell.y, cell.x, cell.y + displayRows - 1);
			}
		} else if (vertical) {
			range = new CellRange(this.getItem(), cell.x, cell.y, cell.x + displayRows - 1, cell.y + (key ? 1 : 0));
		} else {
			range = new CellRange(this.getItem(), cell.x, cell.y, cell.x + (key ? 1 : 0), cell.y + displayRows - 1);
		}

		label = selectedItem.key;
		({ color } = selectedItem);

		const rect = this.getRangeRect(range);
		let cellPoint = this.translateFromSheet(new Point(rect.x, rect.y), viewer);
		const feedback = new CellFeedbackView(cell, label, !altKey || vertical, !altKey || !vertical);

		const box = new BoundingBox(rect.width, rect.height);
		box.setTopLeftTo(cellPoint);

		feedback._key = key;
		feedback.setBoundingBox(box);

		if (!altKey || vertical) {
			range._x2 = range._x1;
		} else {
			range._x1 = range._x2;
		}

		if (!altKey || !vertical) {
			range._y2 = range._y1;
		} else {
			range._y1 = range._y2;
		}
		const rectColor = this.getRangeRect(range);
		cellPoint = this.translateFromSheet(new Point(rectColor.x, rectColor.y), viewer);
		rectColor.x = cellPoint.x;
		rectColor.y = cellPoint.y;
		feedback.setColorRect(rectColor, color);

		return feedback;
	}

	isMessageBox(sourceView) {
		return (
			sourceView
				.getItem()
				.getParent()
				.getParent()
				.getType()
				.getValue() === 'ml'
		);
	}

	getSourceProcessSheet(sourceView) {
		const sourceParent = sourceView
			.getItem()
			.getParent()
			.getParent()
			.getParent();
		if (sourceParent) {
			return sourceParent.getStreamSheet();
		}

		return undefined;
	}

	isOutbox(sourceView) {
		return !!this.getOutbox(sourceView);
	}

	isInbox(sourceView, event) {
		const sourceParent = sourceView
			.getItem()
			.getParent()
			.getParent()
			.getParent();

		if (sourceParent instanceof InboxContainer) {
			return 1;
			// return event.event.altKey ? 0 : 1;
		}
		if (sourceParent instanceof OutboxContainer) {
			return 0;
		}

		return undefined;
	}

	getOutbox(sourceView) {
		const sourceParent = sourceView
			.getItem()
			.getParent()
			.getParent()
			.getParent();

		if (sourceParent instanceof OutboxContainer) {
			return sourceParent;
		}

		return undefined;
	}

	/**
	 * Drop operation to execute. Here a formula is created to fetch data from the json tree.
	 *
	 * @param feedback Feedback for drag operation.
	 * @param {String} title Text of source item
	 * @param sourceView View of source item
	 * @param event MouseEvent
	 * @param viewer GraphViewer
	 */
	onDrop(feedback, title, sourceView, event, viewer) {
		if (sourceView === undefined) {
			return;
		}

		const selection = sourceView.getSelectedItem();
		if (selection === undefined || this.isMessageBox(sourceView, event)) {
			return;
		}

		const inBox = this.isInbox(sourceView, event);
		if (inBox === undefined) {
			return;
		}

		const vertical = event.isPressed(ClientEvent.KeyType.CTRL);
		const altKey = event.isPressed(ClientEvent.KeyType.ALT);
		const range = new CellRange(this.getItem(), feedback._cell.x, feedback._cell.y);
		let targetRange;

		if (altKey) {
			targetRange = new CellRange(
				this.getItem(),
				feedback._cell.x - (vertical ? 0 : 1),
				feedback._cell.y - (vertical ? 1 : 0)
			);
		} else {
			targetRange = new CellRange(
				this.getItem(),
				feedback._cell.x + (vertical ? 0 : 1),
				feedback._cell.y + (vertical ? 1 : 0)
			);
		}

		let formula;
		const key = feedback._key;

		range.shiftToSheet();
		targetRange.shiftToSheet();

		const treeItems = sourceView.getItem().getSubTreeForItem(selection);
		treeItems.unshift(selection);

		let skipDepth;
		const rows = key ? treeItems.length : 1;
		const targetRangeMemory = [];
		const cellData = [];
		const outbox = this.getOutbox(sourceView);

		for (let i = 0; i < rows; i += 1) {
			if (skipDepth !== undefined && skipDepth === treeItems[i].depth) {
				while (treeItems[i] && treeItems[i].depth >= skipDepth) {
					i += 1;
					if (treeItems[i] === undefined) {
						return;
					}
				}
				skipDepth = undefined;
			}
			const itemPath = sourceView.getItem().getItemPath(treeItems[i]);
			const path = TreeItemsNode.splitPath(itemPath);

			if (inBox && !altKey) {
				const sourceSheet = this.getSourceProcessSheet(sourceView);
				let sheetName = '';
				if (sourceSheet.getId() !== this.getItem().getId()) {
					sheetName = `"${sourceSheet.getName().getValue()}"`;
				}
				if (itemPath.startsWith('[Metadata]')) {
					formula = `READ(INBOXMETADATA(${sheetName},`;
				} else {
					formula = `READ(INBOXDATA(${sheetName},`;
				}
			} else {
				let name = 'Message';
				if (outbox !== undefined) {
					let sel = outbox.getMessageListItems().getSelectedItem();
					if (!sel) {
						sel = sourceView._findSelectedItemByLevel(0);
					}
					if (sel && sel.id) {
						name = sel.id;
					}
				}
				const pathfn = itemPath.startsWith('[Metadata]') ? 'OUTBOXMETADATA' : 'OUTBOXDATA';
				const mainfn = altKey ? 'WRITE' : 'READ';
				formula = `${mainfn}(${pathfn}("${name}"`;
			}

			const activeItem = sourceView
				.getItem()
				.getTreeItemAttributes()
				.getActiveElement()
				.getValue();
			let activePath;

			if (activeItem && activeItem.length && itemPath.startsWith(`${activeItem}`)) {
				activePath = TreeItemsNode.splitPath(activeItem);
			}

			let pos = inBox ? 1 : 0;

			if (inBox) {
				if (activePath && activePath.length !== path.length) {
					for (; pos < activePath.length; pos += 1) {
						if (activePath[pos] !== path[pos]) {
							break;
						}
					}
					if (pos === activePath.length) {
						formula += ',';
						pos += 1;
						if (skipDepth === undefined) {
							skipDepth = treeItems[i].depth;
						}
					} else {
						pos = 0;
					}
				} else {
					pos = 1;
				}
			} else {
				pos = 1;
			}

			if (path.length !== 1 || !inBox) {
				for (; pos < path.length; pos += 1) {
					formula += ',';
					let elem;
					if (treeItems[i].parent && pos < path.length - 1) {
						if (targetRangeMemory[pos]) {
							elem = targetRangeMemory[pos];
							formula += `${elem}`;
						}
					}
					if (elem === undefined) {
						elem = path[pos];
						formula += `"${elem}"`;
					}
				}
			}

			formula += '),';

			switch (treeItems[i].type) {
				case TreeItemsNode.DataType.OBJECT:
					formula += '';
					formula += ',"Dictionary"';
					break;
				case TreeItemsNode.DataType.ARRAY:
					formula += '';
					formula += ',"Array"';
					break;
				case TreeItemsNode.DataType.STRING:
					formula += targetRange.toString();
					formula += ',"String"';
					break;
				case TreeItemsNode.DataType.NUMBER:
					formula += targetRange.toString();
					formula += ',"Number"';
					break;
				case TreeItemsNode.DataType.BOOLEAN:
					formula += targetRange.toString();
					formula += ',"Bool"';
					break;
				default:
					break;
			}
			// DL-3590: always set last parameter of READ formula on DnD
			formula += formula.startsWith('READ') ? ',,TRUE)' : ')';

			let cell = {};
			cell.reference = range.toString();
			cell.value = undefined; // DL-2214 if cell value is undefined formula result is used
			cell.formula = formula;
			cellData.push(cell);

			targetRangeMemory[treeItems[i].depth] = range.toString();

			if (altKey && treeItems[i].value !== undefined) {
				const data = this.getItem().getDataProvider();

				const valueRange = range.copy();
				if (vertical) {
					valueRange._y1 -= 1;
					valueRange._y2 -= 1;
				} else {
					valueRange._x1 -= 1;
					valueRange._x2 -= 1;
				}
				const valueCell = data.getRC(
					valueRange._x1 -
						this.getItem()
							.getColumns()
							.getInitialSection(),
					valueRange._y1 -
						this.getItem()
							.getRows()
							.getInitialSection()
				);
				if (valueCell === undefined || valueCell.getValue() === undefined) {
					// const item = this.getItem();
					cell = {};
					cell.reference = valueRange.toString();
					cell.value = treeItems[i].value;
					cellData.push(cell);
				}
			}

			if (vertical) {
				range._x1 += 1;
				range._x2 += 1;
				targetRange._x1 += 1;
				targetRange._x2 += 1;
			} else {
				range._y1 += 1;
				range._y2 += 1;
				targetRange._y1 += 1;
				targetRange._y2 += 1;
			}
		}
		if (cellData.length) {
			viewer.getInteractionHandler().execute(new SetCellsCommand(this.getItem(), cellData, true));
		}
	}

	static get SHEET_DROP_FROM_OUTBOX() {
		return SHEET_DROP_FROM_OUTBOX;
	}
}
