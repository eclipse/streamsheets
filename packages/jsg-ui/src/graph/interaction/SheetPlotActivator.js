import { default as JSG, SheetPlotNode, NotificationCenter, Notification, Shape } from '@cedalo/jsg-core';

import SheetPlotInteraction from './SheetPlotInteraction';
import InteractionActivator from './InteractionActivator';
import MouseEvent from '../../ui/events/MouseEvent';
import SelectionProvider from '../view/SelectionProvider';

const KEY = 'sheetplot.activator';

export default class SheetPlotActivator extends InteractionActivator {
	getKey() {
		return SheetPlotActivator.KEY;
	}

	/**
	 * Gets the controller at specified location or <code>undefined</code> if none could be found.
	 *
	 * @method _getControllerAt
	 * @param {Point} location The location, relative to Graph coordinate system, to start look up at.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which
	 * notified this activator.
	 * @return {GraphItemController} The controller at specified location or
	 * <code>undefined</code>.
	 */
	_getControllerAt(location, viewer) {
		return viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => {
			return cont.getModel() instanceof SheetPlotNode;
		});
	}

	onMouseDoubleClick(event, viewer, dispatcher) {
		const interaction = this.getInteraction(event, viewer);
		if (interaction === undefined) {
			return;
		}

		const selection = interaction.isElementHit(event, viewer);
		if (selection && (selection.element === 'xAxis' || selection.element === 'yAxis')) {
			const axis = selection.data;

			interaction.setParamValue(viewer, interaction._controller.getModel(), axis.formula.getTerm(), 3, undefined);
			interaction.setParamValue(viewer, interaction._controller.getModel(), axis.formula.getTerm(), 4, undefined);

			viewer.getGraph().markDirty();
			event.doRepaint = true;
		}
	}

	removeInfo(event, viewer) {
		if (viewer.getGraphView().hasLayer('chartinfo')) {
			viewer.getGraphView().clearLayer('chartinfo');
			event.doRepaint = true;
		}
	}

	getInteraction(event, viewer) {
		const controller = this._getControllerAt(event.location, viewer);
		if (controller === undefined) {
			return undefined;
		}

		const interaction = new SheetPlotInteraction();
		interaction._controller = controller;
		return interaction;
	}

	onMouseDown(event, viewer, dispatcher) {
		const interaction = this.getInteraction(event, viewer);
		if (interaction === undefined) {
			this.removeInfo(event, viewer);
			return;
		}

		viewer.getGraphView().clearLayer('chartselection');

		if (interaction.isElementHit(event, viewer)) {
			this.activateInteraction(interaction, dispatcher);
			if (!event.isClicked(MouseEvent.ButtonType.RIGHT)) {
				interaction.onMouseDown(event, viewer);
			}
			event.isConsumed = true;
			event.hasActivated = true;
		} else {
			interaction._controller.getView().chartSelection = undefined;
			NotificationCenter.getInstance().send(new Notification(SelectionProvider.SELECTION_CHANGED_NOTIFICATION, interaction._controller.getModel()));
		}
	}

	onMouseMove(event, viewer, dispatcher) {
		const interaction = this.getInteraction(event, viewer);
		if (interaction === undefined) {
			this.removeInfo(event, viewer);
			return;
		}
		const selection = interaction.isElementHit(event, viewer);
		if (selection && (selection.element === 'plot' || selection.element === 'datarow')) {
			interaction.showData(selection, event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
			event.doRepaint = true;
		} else {
			this.removeInfo(event, viewer);
		}
	}

	handleContextMenu(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			if (!controller.isSelected()) {
				viewer.getSelectionProvider().setSelection([controller]);
				viewer.getSelectionView().refresh();
				event.doRepaint = true;
			}
			NotificationCenter.getInstance().send(
				new Notification(JSG.GRAPH_SHOW_CONTEXT_MENU_NOTIFICATION, {
					event,
					controller
				})
			);
		}
	}

	static get KEY() {
		return KEY;
	}
}
