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
import {GraphUtils, MathUtils, Point, Notification, NotificationCenter, SheetPlotNode, StreamSheet} from '@cedalo/jsg-core';

import Interaction from './Interaction';
import ChartSelectionFeedbackView from '../feedback/ChartSelectionFeedbackView';
import ChartInfoFeedbackView from '../feedback/ChartInfoFeedbackView';
import Cursor from '../../ui/Cursor';
import SelectionProvider from '../view/SelectionProvider';
import WorksheetView from '../view/WorksheetView';
import SheetInteraction from './SheetInteraction';

export default class SheetPlotInteraction extends Interaction {
	constructor() {
		super();

		this._controller = undefined;
	}

	onKeyDown(event, viewer, dispatcher) {
		const focus = viewer.getGraphView().getFocus();
		if (focus && focus.getView() instanceof WorksheetView && focus.getView().hasSelection()) {
			const interaction = this.activateInteraction(new SheetInteraction(), dispatcher);
			interaction._controller = focus;
			interaction._hitCode = WorksheetView.HitCode.SHEET;
			if (interaction.onKeyDown(event, viewer)) {
				event.isConsumed = true;
				event.hasActivated = true;
			}
		}
	}

	toLocalCoordinate(event, viewer, point) {
		viewer.translateFromParent(point);

		GraphUtils.traverseDown(viewer.getGraphView(), this._controller.getView(), (v) => {
			v.translateFromParent(point);
			return true;
		});

		return point;
	}

	isElementHit(event, viewer, oldSelection, series) {
		const pt = this.toLocalCoordinate(event, viewer, event.location.copy());

		return this._controller.getModel().isElementHit(pt, oldSelection, series);
	}

	isPlotHit(event, viewer) {
		const pt = this.toLocalCoordinate(event, viewer, event.location.copy());

		return this._controller.getModel().isPlotHit(pt);
	}

	showData(selection, event, viewer) {
		if (selection) {
			viewer.getGraphView().clearLayer('chartinfo');
			const layer = viewer.getGraphView().getLayer('chartinfo');

			const item = this._controller.getModel();
			const pt = this.toLocalCoordinate(event, viewer, event.location.copy());
			const axes = item.getAxes();
			const group = item.getAxes().x.zoomGroup;
			const value = item.scaleFromAxis(axes, pt);

			const sheetView = this._controller.getView().getSheetView();
			GraphUtils.traverse(sheetView, (plotView) => {
				if (plotView.getItem) {
					const plot = plotView.getItem();
					if (plot instanceof SheetPlotNode && plot.isVisible()) {
						const groupOther = plot.getAxes().x.zoomGroup;
						if (item === plot || (groupOther.length && group === groupOther)) {
							layer.push(new ChartInfoFeedbackView(plotView, selection, pt, value, viewer));
						}
					}
				}
			});
		}
	}

	onMouseDown(event, viewer) {
		if (this._controller === undefined) {
			return;
		}

		const selectionProvider = viewer.getSelectionProvider();
		if (!selectionProvider.hasSelection() || selectionProvider.getFirstSelection() !== this._controller) {
			viewer.clearSelection();
			viewer.select(this._controller);
		}

		this.drag = false;
		this.offsetStart = this.toLocalCoordinate(event, viewer, event.location.copy());

		const item = this._controller.getModel();
		if (item.isMap() && item.chart.mapZoom) {
			this.mapOldOffset = item.chart.mapOffset ?  item.chart.mapOffset.copy() : new Point(0, 0);
		}
	}

	onMouseDrag(event, viewer) {
		const graphView = viewer.getGraphView();
		const item = this._controller.getModel();
		const offsetNow = this.toLocalCoordinate(event, viewer, event.location.copy());

		this.drag = MathUtils.getLineLength(this.offsetStart, offsetNow) > 150;

		if (this.drag) {
			if (item.isMap() && item.chart.mapZoom) {
				if (!item.chart.mapOffset) {
					item.chart.mapOffset = new Point(0, 0);
				}
				item.chart.mapOffset.x = this.mapOldOffset.x + offsetNow.x - this.offsetStart.x;
				item.chart.mapOffset.y = this.mapOldOffset.y + offsetNow.y - this.offsetStart.y;
				item.getGraph().markDirty();
			}

			if (item.getAllowZoom(item.xAxes[0])) {
				graphView.clearLayer('chartselection');
				const layer = graphView.getLayer('chartinfo');
				if (layer === undefined || !layer.length) {
					return;
				}
				if (layer.length >= 1) {
					layer.forEach((view) => {
						if (view.chartView.getItem().getId() === item.getId()) {
							view.endPoint = this.toLocalCoordinate(event, viewer, event.location.copy());
						}
					});
				}
				viewer.setCursor(Cursor.Style.CROSS);
			}
		}
	}

	onMouseDoubleClick(event, viewer) {}

	onMouseUp(event, viewer) {
		if (this._controller === undefined) {
			super.onMouseUp(event, viewer);
			return;
		}

		let view = this._controller.getView();
		const selection = this.isElementHit(event, viewer, view.chartSelection);
		if (selection) {
			if (!view.getItem().isProtected() && !this.drag) {
				view.chartSelection = selection;
				NotificationCenter.getInstance().send(
					new Notification(SelectionProvider.SELECTION_CHANGED_NOTIFICATION, view.getItem())
				);
				viewer.setCursor(Cursor.Style.AUTO);

				if (selection) {
					const layer = view.getGraphView().getLayer('chartselection');
					layer.push(new ChartSelectionFeedbackView(view));
				}
			}
		}

		const graphView = viewer.getGraphView();
		const layer = graphView.getLayer('chartinfo');
		if (layer === undefined || !layer.length) {
			super.onMouseUp(event, viewer);
			return;
		}

		const views = layer.filter((layerView) => {return layerView.chartView === this._controller.getView()});
		if (!views.length) {
			super.onMouseUp(event, viewer);
			return;
		}

		view = views[0];
		if (view.endPoint) {
			const ptStart = view.point.copy();
			const ptEnd = view.endPoint.copy();
			const item = this._controller.getModel();
			const axes = item.getAxes();
			if (Math.abs(ptEnd.x - ptStart.x) > 150) {
				let valueStart;
				let valueEnd;
				if (item.xAxes[0].align === 'bottom' || item.xAxes[0].align === 'top') {
					if (axes.x.invert) {
						valueStart = item.scaleFromAxis(axes, ptStart.x > ptEnd.x ? ptStart : ptEnd);
						valueEnd = item.scaleFromAxis(axes, ptStart.x > ptEnd.x ? ptEnd : ptStart);
					} else {
						valueStart = item.scaleFromAxis(axes, ptStart.x < ptEnd.x ? ptStart : ptEnd);
						valueEnd = item.scaleFromAxis(axes, ptStart.x < ptEnd.x ? ptEnd : ptStart);
					}
				} else if (axes.x.invert) {
					valueStart = item.scaleFromAxis(axes, ptStart.y < ptEnd.y ? ptStart : ptEnd);
					valueEnd = item.scaleFromAxis(axes, ptStart.y < ptEnd.y ? ptEnd : ptStart);
				} else {
					valueStart = item.scaleFromAxis(axes, ptStart.y > ptEnd.y ? ptStart : ptEnd);
					valueEnd = item.scaleFromAxis(axes, ptStart.y > ptEnd.y ? ptEnd : ptStart);
				}

				switch (item.xAxes[0].type) {
				case 'category':
					valueStart.x = Math.max(0, valueStart.x);
					valueEnd.x = Math.max(valueStart.x + 1, valueEnd.x);
					break;
				case 'time':
					valueEnd.x = Math.max(valueStart.x + 0.0000004, valueEnd.x);
					break;
				default:
					valueEnd.x = Math.max(valueStart.x + 0.0000001, valueEnd.x);
					break;
				}

				const zoomcmds = [];
				layer.forEach((lview) => {
					const vitem = lview.chartView.getItem();
					const values = [
						{ index: 4, value: valueStart.x },
						{ index: 5, value: valueEnd.x },
						{ index: 7, value: undefined },
						{ index: 8, value: undefined },
						{ index: 10, value: undefined },
						{ index: 11, value: undefined }
					]
					const term = vitem.xAxes[0].formula.getTerm();
					if (term) {
						const field1 = vitem.getParamValue(vitem.xAxes[0].formula.getTerm(), 6);
						const field2 = vitem.getParamValue(vitem.xAxes[0].formula.getTerm(), 9);
						if (field1 || field2) {
							const ref = vitem.getDataSourceInfo(vitem.series[vitem.series.length - 1]);
							if (ref.time && ref.xKey && ref.time.values && ref.time.values[ref.xKey]) {
								let start1;
								let start2;
								let end1;
								let end2;
								const refValues = ref.time.values[ref.xKey];
								refValues.forEach((value, index) => {
									if (valueStart.x > value) {
										if (field1 && ref.time.values[field1]) {
											start1 = ref.time.values[field1][index];
										}
										if (field2 && ref.time.values[field2]) {
											start2 = ref.time.values[field2][index];
										}
									}
									if (value > valueEnd.x && end1 === undefined) {
										if (field1 && ref.time.values[field1]) {
											end1 = ref.time.values[field1][index];
										}
									}
									if (value > valueEnd.x && end2 === undefined) {
										if (field2 && ref.time.values[field2]) {
											end2 = ref.time.values[field2][index];
										}
									}
								});

								values[2].value = start1;
								values[3].value = end1;
								values[4].value = start2;
								values[5].value = end2;
							}
						}
					}
					const cmds = vitem.setParamValues(viewer, vitem.xAxes[0].formula, values, item);
					if (cmds.length) {
						cmds.forEach(cmd => zoomcmds.push(cmd));
					}
				});

				item.spreadZoomInfo(viewer, zoomcmds);

				viewer.getGraph().markDirty();
				event.doRepaint = true;
			}
			view.endPoint = undefined;
		}

		super.onMouseUp(event, viewer);
	}

	willFinish(event, viewer) {
		super.willFinish(event, viewer);
	}

	cancelInteraction(event, viewer) {
		super.cancelInteraction(event, viewer);
	}

	getSheet() {
		let sheet = this._controller.getModel().getParent();
		while (sheet && !(sheet instanceof StreamSheet)) {
			sheet = sheet.getParent();
		}

		return sheet;
	}
}
