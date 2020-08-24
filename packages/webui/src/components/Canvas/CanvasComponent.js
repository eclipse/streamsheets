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
/* eslint-disable react/no-unused-state */
/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { Button, Typography, Slide } from '@material-ui/core';
import { connect } from 'react-redux';
import AddIcon from '@material-ui/icons/Add';
import * as Colors from '@material-ui/core/colors';
import JSG from '@cedalo/jsg-ui';
import SvgIcon from '@material-ui/core/SvgIcon/SvgIcon';
import { FormattedMessage } from 'react-intl';
import Tooltip from '@material-ui/core/Tooltip';
import Fab from '@material-ui/core/Fab';

import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import ContextMenu from './ContextMenu';
import TreeContextMenu from './TreeContextMenu';
import GraphContextMenu from './GraphContextMenu';
import SheetDeleteDialog from './SheetDeleteDialog';
import MachineHelper from '../../helper/MachineHelper';
import FunctionWizard from './FunctionWizard';
import { intl } from '../../helper/IntlGlobalProvider';
import StreamChartProperties from './StreamChartProperties';
// import NotAuthorizedComponent from '../Errors/NotAuthorizedComponent';

export class CanvasComponent extends Component {
	static getDerivedStateFromProps(props, state) {
		const { permissions } = props.adminSecurity;
		if (
			!state.loaded &&
			graphManager.getGraph() &&
			graphManager.getGraph().getMachineContainer() &&
			permissions.length > 0
		) {
			try {
				// const canEdit = MachineHelper.currentMachineCan(RESOURCE_ACTIONS.EDIT);
				// if (!canEdit) {
				// 	graphManager.setMachineProtected(true);
				// } else {
				// 	graphManager.setMachineProtected(false);
				// }
				return { ...state, loaded: true };
			} catch (e) {
				console.warn(e);
				const loading = state.loading + 1;
				return { ...state, loading };
			}
		}
		return { ...state };
	}

	constructor(props) {
		super(props);
		this.state = {
			graphEditor: null,
			graph: null,
			loaded: false,
			loading: 1,
			chartWizardTitle: '',
			dummy: ''
		};
	}

	componentDidMount() {
		const graphEditor = this.initGraphEditor();
		JSG.NotificationCenter.getInstance().register(this, JSG.NotificationCenter.ZOOM_NOTIFICATION, 'onZoom');
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.StreamSheetView.SHEET_DROP_FROM_OUTBOX,
			'onDropFromOutbox',
		);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.ButtonNode.BUTTON_CLICKED_NOTIFICATION,
			'onButtonClicked',
		);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.GRAPH_DOUBLE_CLICK_NOTIFICATION,
			'onGraphDoubleClicked',
		);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.PLOT_DOUBLE_CLICK_NOTIFICATION,
			'onPlotDoubleClicked',
		);
		/* eslint-disable react/no-did-mount-set-state */
		this.setState({ graphEditor });
		/* eslint-enable react/no-did-mount-set-state */
	}

	// componentWillReceiveProps(props)  {
	// 	this.state.graphEditor.setZoom(props.config.canvasZoomLevel);
	// }

	componentWillUnmount() {
		const { canvas } = this;
		JSG.NotificationCenter.getInstance().unregister(this, JSG.NotificationCenter.ZOOM_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.StreamSheetView.SHEET_DROP_FROM_OUTBOX);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.ButtonNode.BUTTON_CLICKED_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.GRAPH_DOUBLE_CLICK_NOTIFICATION);
		canvas._jsgEditor.destroy();
		delete canvas._jsgEditor;
		window.removeEventListener('resize', this.updateDimensions);
	}

	onGraphDoubleClicked() {
		this.props.setAppState({ showChartProperties: true });
	}

	onPlotDoubleClicked(notification) {
		if (notification.object && notification.object.event.type === JSG.MouseEvent.MouseEventType.DBLCLK) {
			this.props.setAppState({showStreamChartProperties: true});
		}

		const viewer = graphManager.getGraphViewer();
		const controller = viewer.getSelectionProvider().getFirstSelection();
		if (!controller) {
			return;
		}

		if (controller.getView().chartSelection) {
			this.setState({chartWizardTitle: controller.getView().chartSelection.element});
		} else {
			this.setState({chartWizardTitle: "Chart"});
		}
		this.setState({dummy: String(Math.random())});
	}

	onButtonClicked(notification) {
		if (notification.object) {
			const info = notification.object;
			const item = info.button;
			const { container } = info;
			switch (item && item.getName().getValue()) {
				case 'minimize': {
					const sheet = container.getStreamSheet();

					if (sheet.getOwnSelection().hasSelection()) {
						const cmd = new JSG.RemoveSelectionCommand(sheet, sheet.getSelectionId());
						graphManager.synchronizedExecute(cmd);
					}
					graphManager
						.getGraphViewer()
						.getSelectionProvider()
						.clearSelection();
					break;
				}
				case 'maximize':
					break;
				default:
					break;
			}
			if (container) {
				this.setState({ graph: container.getGraph() });
			}
		}
	}

	onZoom() {
		const { canvas } = this;
		if (canvas) {
			const { width, height } = canvas;
			const graphEditor = canvas._jsgEditor;
			const cs = graphEditor.getCoordinateSystem();
			const graph = graphEditor.getGraph();
			// force layout
			graph._arrange(cs.deviceToLogX(width) / cs.getDeviceRatio(), cs.deviceToLogY(height) / cs.getDeviceRatio());
			const viewer = graphEditor.getGraphViewer();
			viewer.layout(cs.deviceToLogX(width) / cs.getDeviceRatio(), cs.deviceToLogY(height) / cs.getDeviceRatio());
			graphEditor.setScrollPosition(0, 0);
			graphEditor.resizeContent(width, height);
		}
	}

	onDropFromOutbox(notification) {
		this.props.showFunctionWizard({
			targetCell: notification.object.ref,
			messageTerm: notification.object.messageFormula,
			sheetViewItem: notification.object.item,
			sheetView: notification.object.sheetView,
		});
	}

	/**
	 * Resize canvas and inform GraphEditor
	 */

	onShowSheet = (sheet) => {
		sheet.getGraph().setViewMode(sheet, 0);
		graphManager.redraw();

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.execute(
				new JSG.ChangeItemOrderCommand(
					sheet,
					JSG.ChangeItemOrderCommand.Action.TOTOP,
					graphManager.getGraphViewer(),
				),
			);

		this.setState({ graph: sheet.getGraph() });
	};

	onAdd = () => {
		const graph = graphManager.getGraph();
		let cnt = graph.getStreamSheetContainerCount();

		if (cnt > 3) {
			JSG.NotificationCenter.getInstance().send(
				new JSG.Notification(JSG.WorksheetView.SHEET_MESSAGE_NOTIFICATION, {
					view: this,
					message: { message: intl.formatMessage({ id: 'Alert.SheetMaximum' }, {}) },
				}),
			);

			return;
		}

		graphManager
			.getGraphViewer()
			.getSelectionProvider()
			.clearSelection();

		cnt %= 8;

		graph.setViewMode(undefined, 0);

		this.props.createStreamSheet(this.props.machineId, 0, { x: 1000 * cnt, y: 1000 * cnt });
	};

	initGraphEditor() {
		const { canvas } = this;
		if (canvas) {
			JSG.setDrawingDisabled(true);
			const graphEditor = graphManager.createEditor(canvas);
			const graph = graphEditor.getGraph();
			window.addEventListener('resize', () => this.updateDimensions());
			this.updateDimensions();
			graphEditor.invalidate();
			this.setState({ graphEditor, graph });
			return graphEditor;
		}
		return null;
	}

	updateDimensions() {
		graphManager.updateDimensions();
		graphManager.updateControls();
	}

	render() {
		const canEdit = this.props.canEditMachine;
		const sheets = [];
		const graph = graphManager.getGraph();
		if (graph) {
			const machineContainer = graph.getMachineContainer();
			if (machineContainer) {
				const attr = machineContainer.getMachineContainerAttributes();
				if (attr) {
					attr.setHideToolbars(canEdit === false);
				}
			}

			const container = graph.getStreamSheetsContainer();
			if (container !== undefined) {
				let max = false;
				container.enumerateStreamSheetContainers((sheet) => {
					if (
						sheet
							.getItemAttributes()
							.getViewMode()
							.getValue() === 2
					) {
						max = true;
					}
				});
				if (max === false) {
					container.enumerateStreamSheetContainers((sheet) => {
						if (
							sheet
								.getItemAttributes()
								.getViewMode()
								.getValue() === 1
						) {
							sheets.push(sheet);
						}
					});
				}
			}
		}

		const { viewMode } = this.props;

		return (
			<div
				style={{
					height: '100%',
					width: '100%',
					visibility: this.props.showMachine ? 'visible' : 'hidden',
				}}
			>
				{viewMode.viewMode !== null || !canEdit ? null : (
					<React.Fragment>
						<SheetDeleteDialog />
						<ContextMenu />
						<TreeContextMenu />
						<GraphContextMenu />
					</React.Fragment>
				)}
				<canvas
					id="canvas"
					style={{
						width: 'calc(100%)',
						height: '100%',
						outline: 'none',
					}}
					ref={(c) => {
						this.canvas = c;
					}}
					width="800"
					height="450"
					tabIndex="0"
					//	aria-disabled={this.isAccessDisabled()}
				/>
				{viewMode.viewMode !== null || !canEdit ? null : <StreamChartProperties title={this.state.chartWizardTitle} dummy={this.state.dummy} />}
				{viewMode.viewMode !== null || !canEdit ? null : (
					<Slide direction="left" in={this.props.functionWizardVisible} mountOnEnter unmountOnExit>
						<FunctionWizard />
					</Slide>
				)}
				{viewMode.viewMode !== null || !canEdit ? null : (
					<Tooltip
						enterDelay={300}
						title={<FormattedMessage id="Tooltip.AddStreamSheet" defaultMessage="Add StreamSheet" />}
					>
						<Fab
							id="addSheet"
							aria-label="add"
							color="primary"
							size="medium"
							style={{
								visibility: this.props.showTools ? 'visible' : 'hidden',
								position: 'absolute',
								zIndex: 1200,
								right: '30px',
								bottom: '26px',
							}}
							onClick={this.onAdd}
						>
							<AddIcon
								style={{
									color: '#FFFFFF',
								}}
							/>
						</Fab>
					</Tooltip>
				)}
				{sheets.map((sheet, index) => (
					<div
						key={index.toString()}
						style={{
							visibility: this.props.showTools ? 'visible' : 'hidden',
							position: 'absolute',
							zIndex: 1200,
							left: `${30 + index * 50}px`,
							bottom: '26px',
						}}
					>
						<Button
							aria-label="show"
							mini
							style={{
								backgroundColor: Colors.blue[800],
								minWidth: '40px',
								padding: '0px',
							}}
							onClick={() => this.onShowSheet(sheet)}
						>
							<SvgIcon>
								<path
									fill="#FFFFFF"
									// eslint-disable-next-line max-len
									d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,13H7V11H10V13M14,13H11V11H14V13M10,16H7V14H10V16M14,16H11V14H14V16M10,19H7V17H10V19M14,19H11V17H14V19Z"
								/>
							</SvgIcon>
						</Button>
						<div
							style={{
								width: '40px',
								textAlign: 'center',
								fontSize: '10px',
								marginTop: '5px',
							}}
						>
							<Typography>
								{sheet
									.getStreamSheet()
									.getName()
									.getValue()}
							</Typography>
						</div>
					</div>
				))}
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		showMachine: MachineHelper.showMachine(state),
		machineId: state.monitor.machine.id,
		viewMode: state.appState.viewMode,
		showTools: state.appState.showTools,
		functionWizardVisible: state.appState.functionWizard.show,
		adminSecurity: state.adminSecurity,
	};
}

const mapDispatchToProps = Actions;

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(CanvasComponent);
