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
import {GraphUtils, Notification, NotificationCenter, SheetPlotNode, StreamSheet} from '@cedalo/jsg-core';

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

		const view = this._controller.getView();
		const selection = this.isElementHit(event, viewer, view.chartSelection);
		if (selection === undefined) {
			return;
		}

		if (!view.getItem().isProtected()) {
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

	onMouseDrag(event, viewer) {
		const graphView = viewer.getGraphView();

		graphView.clearLayer('chartselection');

		const item = this._controller.getModel();
		if (item.getAllowZoom(item.xAxes[0])) {
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

	onMouseDoubleClick(event, viewer) {}

	onMouseUp(event, viewer) {
		if (this._controller === undefined) {
			super.onMouseUp(event, viewer);
			return;
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

		const view = views[0];
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
					const cmd = vitem.setParamValues(viewer, vitem.xAxes[0].formula, [
						{ index: 4, value: valueStart.x },
						{ index: 5, value: valueEnd.x }
					], item);
					if (cmd) zoomcmds.push(cmd);
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
