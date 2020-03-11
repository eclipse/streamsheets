import {
	default as JSG,
	SheetPlotNode, NotificationCenter, Notification, Shape
} from '@cedalo/jsg-core';

import SheetPlotInteraction from './SheetPlotInteraction';
import InteractionActivator from './InteractionActivator';
import MouseEvent from '../../ui/events/MouseEvent';
import SelectionProvider from '../view/SelectionProvider';
import Cursor from '../../ui/Cursor';

JSG.PLOT_DOUBLE_CLICK_NOTIFICATION = 'plot_double_click_notification';
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

	onKeyDown(event, viewer) {

		const controller = viewer.getSelectionProvider().getFirstSelection();
		if (!controller) {
			return;
		}
		const item = controller.getModel();
		if (!(item instanceof SheetPlotNode)) {
			return;
		}

		const finish = (cmd, key) => {
			item.finishCommand(cmd, key);
			viewer.getInteractionHandler().execute(cmd);
			event.consume();
			event.hasActivated = true;
		};


		if (controller.getView().chartSelection !== undefined) {
			const selection = controller.getView().chartSelection;
			if (selection) {
				switch (selection.element) {
				case 'series':
					switch (event.event.key) {
					case 'Delete': {
						const cmd = item.prepareCommand('series');
						JSG.Arrays.remove(item.series, selection.data);
						finish(cmd, 'series');
						break;
					}
					}
					break;
				case 'legend':
					switch (event.event.key) {
					case 'Delete': {
						const cmd = item.prepareCommand('legend');
						item.legend.visible = false;
						finish(cmd, 'legend');
						break;
					}
					}
					break;
				case 'title':
					switch (event.event.key) {
					case 'Delete': {
						const cmd = item.prepareCommand('title');
						item.title.visible = false;
						finish(cmd, 'title');
						break;
					}
					}
					break;
				case 'xAxisGrid':
				case 'yAxisGrid':
				case 'xAxisTitle':
				case 'yAxisTitle':
					switch (event.event.key) {
					case 'Delete': {
						const cmd = item.prepareCommand('axes');
						if (selection.element === 'xAxisTitle' || selection.element === 'yAxisTitle') {
							selection.data.visible = false;
						} else {
							selection.data.gridVisible = false;
						}
						finish(cmd, 'axes');
						break;
					}
					}
					break;
				}
			}
		}
	}

	onMouseDoubleClick(event, viewer, dispatcher) {
		const interaction = this.getInteraction(event, viewer);
		if (interaction === undefined) {
			return;
		}

		const item = interaction._controller.getModel();
		const selection = interaction.isElementHit(event, viewer);
		if (selection) {
			switch (selection.element) {
			case 'xAxis':
			case 'yAxis': {
				const axis = selection.data;

				item.spreadZoomInfo();
				item.setParamValues(viewer, axis.formula,
					[{index: 4, value: undefined}, {index: 5, value: undefined}]);

				viewer.getGraph().markDirty();
				event.doRepaint = true;
				break;
			}
			// case 'series':
			// 	selection.data.xAxis = 'secondary';
			// 	selection.data.yAxis = 'secondary';
			// 	viewer.getGraph().markDirty();
			// 	event.doRepaint = true;
			// 	break;
			}
		}
		if (!item.isProtected()) {
			NotificationCenter.getInstance().send(
				new Notification(JSG.PLOT_DOUBLE_CLICK_NOTIFICATION, {
					event
				})
			);
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
		const view = interaction._controller.getView();

		const hit = interaction.isElementHit(event, viewer);
		if (hit) {
			if (hit.element === 'action') {
				const item = interaction._controller.getModel();
				hit.data.action.call(item, viewer);
				viewer.getGraph().markDirty();
				event.doRepaint = true;
				event.isConsumed = true;
				event.hasActivated = true;
				return;
			}
			this.activateInteraction(interaction, dispatcher);
			if (!event.isClicked(MouseEvent.ButtonType.RIGHT)) {
				interaction.onMouseDown(event, viewer);
			}
			if (view.chartSelection === undefined && hit.element !== 'series' && hit.element !== 'plot') {
				const interactionHandler = viewer.getInteractionHandler();
				interactionHandler.setActiveInteraction(interactionHandler.getDefaultInteraction());
			} else {
				event.isConsumed = true;
				event.hasActivated = true;
			}
		} else {
			view.chartSelection = undefined;
			NotificationCenter.getInstance().send(new Notification(SelectionProvider.SELECTION_CHANGED_NOTIFICATION, interaction._controller.getModel()));
		}
		NotificationCenter.getInstance().send(
			new Notification(JSG.PLOT_DOUBLE_CLICK_NOTIFICATION, {
				event
			})
		);
	}

	onMouseMove(event, viewer, dispatcher) {
		const interaction = this.getInteraction(event, viewer);
		if (interaction === undefined) {
			this.removeInfo(event, viewer);
			return;
		}
		let selection;
		if (interaction.isPlotHit(event, viewer)) {
			selection = interaction.isElementHit(event, viewer);
			interaction.showData(selection, event, viewer);
			event.doRepaint = true;
		} else {
			this.removeInfo(event, viewer);
		}

		selection = interaction.isElementHit(event, viewer, undefined, true);
		if (selection) {
			event.isConsumed = true;
			event.hasActivated = true;
		}

		if (selection) {
			switch (selection.element) {
			case 'action':
				viewer.setCursor(Cursor.Style.EXECUTE);
				break;
			case 'series':
				viewer.setCursor(Cursor.Style.CROSS);
				break;
			default:
				viewer.setCursor(Cursor.Style.AUTO);
				break;
			}
		}  else {
			viewer.setCursor(Cursor.Style.AUTO);
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
