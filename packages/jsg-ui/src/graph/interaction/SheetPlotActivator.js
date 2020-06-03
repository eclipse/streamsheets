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
import { default as JSG, SheetPlotNode, NotificationCenter, Notification, Shape, Arrays } from '@cedalo/jsg-core';

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

	_getControllerAt(location, viewer) {
		return viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => {
			return cont.getModel() instanceof SheetPlotNode && cont.getModel().isVisible();
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
					case 'upbars': {
						const cmd = item.prepareCommand('chart');
						item.chart.upBars.visible = false;
						finish(cmd, 'chart');
						break;
					}
					case 'downbars':
						{
							const cmd = item.prepareCommand('chart');
							item.chart.downBars.visible = false;
							finish(cmd, 'chart');
						}
						break;
					case 'hilolines':
						{
							const cmd = item.prepareCommand('chart');
							item.chart.hiLoLines.visible = false;
							finish(cmd, 'chart');
						}
						break;
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
					case 'serieslabel':
						switch (event.event.key) {
							case 'Delete': {
								const cmd = item.prepareCommand('series');
								selection.data.dataLabel.visible = false;
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
					case 'xAxis':
					case 'yAxis':
						switch (event.event.key) {
							case 'Delete': {
								const cmd = item.prepareCommand('axes');
								if (selection.element === 'xAxis' && item.xAxes.length > 1) {
									item.reAssignAxis(selection.data, true);
									Arrays.remove(item.xAxes, selection.data);
								} else if (selection.element === 'yAxis' && item.yAxes.length > 1) {
									item.reAssignAxis(selection.data, false);
									Arrays.remove(item.yAxes, selection.data);
								}
								finish(cmd, 'axes');
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

	onMouseDoubleClick(event, viewer) {
		const interaction = this.getInteraction(event, viewer);
		if (interaction === undefined) {
			return;
		}

		const item = interaction._controller.getModel();
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
			if (view.chartSelection === undefined && !interaction.isPlotHit(event, viewer)) {
				const interactionHandler = viewer.getInteractionHandler();
				interactionHandler.setActiveInteraction(interactionHandler.getDefaultInteraction());
			} else {
				event.isConsumed = true;
				event.hasActivated = true;
			}
		} else {
			view.chartSelection = undefined;
			NotificationCenter.getInstance().send(
				new Notification(SelectionProvider.SELECTION_CHANGED_NOTIFICATION, interaction._controller.getModel())
			);
		}
		NotificationCenter.getInstance().send(
			new Notification(JSG.PLOT_DOUBLE_CLICK_NOTIFICATION, {
				event
			})
		);
	}

	onMouseMove(event, viewer) {
		const interaction = this.getInteraction(event, viewer);
		if (interaction === undefined) {
			this.removeInfo(event, viewer);
			return;
		}
		let selection;
		if (interaction.isPlotHit(event, viewer)) {
			selection = interaction.isElementHit(event, viewer, undefined, 'only');
			interaction.showData(selection, event, viewer);
			event.doRepaint = true;
		} else {
			this.removeInfo(event, viewer);
		}

		selection = interaction.isElementHit(event, viewer, undefined, 'no');
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
		} else {
			viewer.setCursor(Cursor.Style.AUTO);
		}
	}

	handleContextMenu(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			if (controller.getModel().isProtected()) {
				return;
			}
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
