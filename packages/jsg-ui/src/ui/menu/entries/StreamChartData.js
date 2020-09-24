/* global document */

import {default as JSG, ImagePool, Notification, NotificationCenter, SheetPlotNode} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';
import SelectionProvider from "../../../graph/view/SelectionProvider";
import ChartSelectionFeedbackView from "../../../graph/feedback/ChartSelectionFeedbackView";


export default class StreamChartData extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'chartdata';
		this.group = 'data';
		this.element = JSG.imagePool.get(ImagePool.SVG_TABLE);
		this.element.style.cursor = 'pointer';
	}

	isVisible(item) {
		return (item instanceof SheetPlotNode) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			const graphcontroller = editor.getGraphViewer().getGraphController();
			const controller = graphcontroller.getControllerByModelId(item.getId());
			if (!controller) {
				return false;
			}
			const view = controller.getView();
			view.chartSelection = {
				element: 'plot',
				data: item.plot
			};

			NotificationCenter.getInstance().send(
				new Notification(SelectionProvider.SELECTION_CHANGED_NOTIFICATION, item)
			);

			const layer = view.getGraphView().getLayer('chartselection');
			layer.push(new ChartSelectionFeedbackView(view));
			editor.invalidate();

			if (!item.isProtected()) {
				NotificationCenter.getInstance().send(
					new Notification(JSG.PLOT_DOUBLE_CLICK_NOTIFICATION, {open: true})
				);
			}
		}
		return handled;
	}
};
