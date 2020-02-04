import {
	GraphUtils,
	StreamSheet,
	NumberExpression,
	SetCellDataCommand
} from '@cedalo/jsg-core';

import Interaction from './Interaction';
import ChartSelectionFeedbackView from '../feedback/ChartSelectionFeedbackView';
import ChartInfoFeedbackView from '../feedback/ChartInfoFeedbackView';
import Cursor from '../../ui/Cursor';

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
			layer.push(new ChartInfoFeedbackView(this._controller.getView(), selection, event.location.copy(), viewer));
		}
	}

	onMouseDown(event, viewer) {
		if (this._controller === undefined) {
			return;
		}

		const formula = document.getElementById('editbarformula');
		const view = this._controller.getView();
		const selection = this.isElementHit(event, viewer);
		if (selection === undefined) {
			return;
		}

		if (formula) {
			switch (selection.element) {
			case 'datarow':
				formula.innerHTML = `=${selection.data.getFormula()}`;
				break;
			case 'title':
				formula.innerHTML = `=${selection.data.title.getFormula()}`;
				break;
			case 'xAxis':
			case 'yAxis':
				formula.innerHTML = `=${selection.data.formula.getFormula()}`;
				break;
			default:
				formula.innerHTML = '';
				break;
			}
		}
		viewer.setCursor(Cursor.Style.AUTO);

		view.chartSelection  = selection;

		if (selection) {
			const layer = view.getGraphView().getLayer('chartselection');
			layer.push(new ChartSelectionFeedbackView(view));
		}
	}

	onMouseDrag(event, viewer) {
		const graphView = viewer.getGraphView();

		graphView.clearLayer('chartselection');
		const layer = graphView.getLayer('chartinfo');
		if (layer === undefined || layer.length !== 1) {
			return;
		}
		const view = layer[0];
		view.endPoint = event.location;
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
		if (layer === undefined || layer.length !== 1) {
			super.onMouseUp(event, viewer);
			return;
		}

		const item = this._controller.getModel();
		const xAxisInfo = item.getAxisInfo(item.xAxes[0].formula);
		const view = layer[0];
		if (item.validateAxis(xAxisInfo) && view.endPoint) {
			const ptStart = this.toLocalCoordinate(event, viewer, view.point.copy());
			const ptEnd = this.toLocalCoordinate(event, viewer, view.endPoint.copy());
			if (ptStart.x !== ptEnd.x) {
				const valueStart = item.scaleFromAxis(xAxisInfo, ptStart.x < ptEnd.x ? ptStart : ptEnd);
				const valueEnd = item.scaleFromAxis(xAxisInfo, ptStart.x < ptEnd.x ? ptEnd : ptStart);

				this.setParamValue(item, item.xAxes[0].formula.getTerm(), 3, valueStart);
				this.setParamValue(item, item.xAxes[0].formula.getTerm(), 4, valueEnd);

				viewer.getGraph().markDirty();
				event.doRepaint = true;
			}
		}


		super.onMouseUp(event, viewer);
	}

	setParamValue(item, term, index, value) {
		const info = item.getParamInfo(term, index);
		if (info) {
			const range = info.range.copy();
			range.shiftToSheet();
			const cmd  = new SetCellDataCommand(info.sheet, range.toString(), new NumberExpression(value), true);
			this.getInteractionHandler().execute(cmd);
		}

		return 0;
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
