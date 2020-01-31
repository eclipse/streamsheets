import {
	GraphUtils,
	StreamSheet
} from '@cedalo/jsg-core';

import Interaction from './Interaction';

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

	toLocalCoordinate(event, viewer) {
		const point = event.location.copy();
		viewer.translateFromParent(point);

		GraphUtils.traverseDown(viewer.getGraphView(), this._controller.getView(), (v) => {
			v.translateFromParent(point);
			return true;
		});

		return point;
	}

	isElementHit(event, viewer) {
		const pt = this.toLocalCoordinate(event, viewer);

		return this._controller.getModel().isElementHit(pt);
	}

	onMouseDown(event, viewer) {

		const formula = document.getElementById('editbarformula');
		const info = this.isElementHit(event, viewer);

		if (formula) {
			switch (info.element) {
			case 'datarow':
				formula.innerHTML = `=${info.data.getFormula()}`;
				break;
			case 'title':
				formula.innerHTML = `=${info.data.title.getFormula()}`;
				break;
			case 'xAxis':
			case 'yAxis':
				formula.innerHTML = `=${info.data.formula.getFormula()}`;
				break;
			}
		}


	}

	onMouseDrag(event, viewer) {
	}

	onMouseDoubleClick(event, viewer) {
	}

	onMouseUp(event, viewer) {
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
