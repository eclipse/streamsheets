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

		const item = this._controller.getModel();
		if (item.title.position.containsPoint(pt)) {
			return true;
		}

		if (item.plot.position.containsPoint(pt)) {
			return true;
		}

		if (item.xAxes.some((axis) => axis.position.containsPoint(pt))) {
			return true;
		}

		if (item.yAxes.some((axis) => axis.position.containsPoint(pt))) {
			return true;
		}

		return false;
	}

	onMouseDown(event, viewer) {
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
