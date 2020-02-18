import { Term, NullTerm } from '@cedalo/parser';
import {
	GraphUtils,
	StreamSheet,
	NumberExpression,
	Selection,
	DeleteCellContentCommand,
	SheetPlotNode,
	SetCellDataCommand, NotificationCenter, Notification
} from '@cedalo/jsg-core';

import Interaction from './Interaction';
import ChartSelectionFeedbackView from '../feedback/ChartSelectionFeedbackView';
import ChartInfoFeedbackView from '../feedback/ChartInfoFeedbackView';
import Cursor from '../../ui/Cursor';
import SelectionProvider from '../view/SelectionProvider';

export default class SheetPlotInteraction extends Interaction {
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

	toLocalCoordinate(event, viewer, point) {
		viewer.translateFromParent(point);

		GraphUtils.traverseDown(viewer.getGraphView(), this._controller.getView(), (v) => {
			v.translateFromParent(point);
			return true;
		});

		return point;
	}

	isElementHit(event, viewer) {
		const pt = this.toLocalCoordinate(event, viewer, event.location.copy());

		return this._controller.getModel().isElementHit(pt);
	}

	showData(selection, event, viewer) {
		if (selection) {
			viewer.getGraphView().clearLayer('chartinfo');
			const layer = viewer.getGraphView().getLayer('chartinfo');

			const item = this._controller.getModel();
			let type = item.xAxes[0].type;
			if (type === 'category') {
				return;
			}

			const children = this._controller.getParent().children;

			const pt = this.toLocalCoordinate(event, viewer, event.location.copy());
			const axes = item.getAxes();
			const value = item.scaleFromAxis(axes.x.scale, pt);

			children.forEach((controller) => {
				if (controller.getModel() instanceof SheetPlotNode) {
					type = controller.getModel().xAxes[0].type;
					if (type !== 'category') {
						layer.push(
							new ChartInfoFeedbackView(controller.getView(), selection, event.location.copy(), value, viewer));
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
		const selection = this.isElementHit(event, viewer);
		if (selection === undefined) {
			return;
		}

		view.chartSelection  = selection;

		NotificationCenter.getInstance().send(new Notification(SelectionProvider.SELECTION_CHANGED_NOTIFICATION, view.getItem()));

		viewer.setCursor(Cursor.Style.AUTO);

		if (selection) {
			const layer = view.getGraphView().getLayer('chartselection');
			layer.push(new ChartSelectionFeedbackView(view));
		}
	}

	onMouseDrag(event, viewer) {
		const graphView = viewer.getGraphView();

		graphView.clearLayer('chartselection');
		const layer = graphView.getLayer('chartinfo');
		if (layer === undefined || !layer.length) {
			return;
		}
		if (layer.length >= 1) {
			layer.forEach((view) => {
				if (view.chartView.getItem().getId() === this._controller.getView().getItem().getId()) {
					view.endPoint = event.location;
				}
			});
		}
		viewer.setCursor(Cursor.Style.CROSS);
	}

	onMouseDoubleClick(event, viewer) {
	}

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

		layer.forEach((view) => {
			if (view.endPoint) {
				const ptStart = this.toLocalCoordinate(event, viewer, view.point.copy());
				const ptEnd = this.toLocalCoordinate(event, viewer, view.endPoint.copy());
				if (ptStart.x !== ptEnd.x) {
					const item = this._controller.getModel();
					const axes = item.getAxes();
					const valueStart = item.scaleFromAxis(axes.x.scale, ptStart.x < ptEnd.x ? ptStart : ptEnd);
					const valueEnd = item.scaleFromAxis(axes.x.scale, ptStart.x < ptEnd.x ? ptEnd : ptStart);

					this.setParamValue(viewer, item, item.xAxes[0].formula, 4, valueStart);
					this.setParamValue(viewer, item, item.xAxes[0].formula, 5, valueEnd);

					viewer.getGraph().markDirty();
					event.doRepaint = true;
				}
			}
		});

		super.onMouseUp(event, viewer);
	}

	setParamValue(viewer, item, expression, index, value) {
		const term = expression.getTerm();
		if (term === undefined) {
			return;
		}

		const info = item.getParamInfo(term, index);
		if (info) {
			const range = info.range.copy();
			let cmd;
			if (value === undefined) {
				const selection = new Selection(info.sheet);
				selection.add(range);
				cmd = new DeleteCellContentCommand(info.sheet, selection.toStringMulti(), "all")
			} else {
				range.shiftToSheet();
			 	cmd  = new SetCellDataCommand(info.sheet, range.toString(), new NumberExpression(value), true);
			}
			viewer.getInteractionHandler().execute(cmd);
			return;
		}

		if (term && term.params) {
			for (let i = term.params.length; i < index; i += 1) {
				term.params[i] = new NullTerm();
			}

			if (value === undefined) {
				term.params[index] = new NullTerm();
			} else {
				term.params[index] = Term.fromNumber(value);
			}
			expression.correctFormula();
		}
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
