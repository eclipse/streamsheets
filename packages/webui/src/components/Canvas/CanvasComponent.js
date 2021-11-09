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
import {
	Button,
	Typography,
	Slide,
	TextField,
	IconButton,
	FormControlLabel,
	Checkbox, FormGroup
} from '@material-ui/core';
import { connect } from 'react-redux';
import AddIcon from '@material-ui/icons/Add';
import SheetIcon from '@material-ui/icons/GridOn';
import DashboardIcon from '@material-ui/icons/Dashboard';
import CloseIcon from '@material-ui/icons/Close';
import SettingsIcon from '@material-ui/icons/Settings';
import * as Colors from '@material-ui/core/colors';
import JSG from '@cedalo/jsg-ui';
import SvgIcon from '@material-ui/core/SvgIcon/SvgIcon';
import { FormattedMessage } from 'react-intl';
import Tooltip from '@material-ui/core/Tooltip';
import Fab from '@material-ui/core/Fab';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Paper from '@material-ui/core/Paper';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import ContextMenu from './ContextMenu';
import TreeContextMenu from './TreeContextMenu';
import GraphContextMenu from './GraphContextMenu';
import LayoutContextMenu from './LayoutContextMenu';
import EditPointsContextMenu from './EditPointsContextMenu';
import SheetDeleteDialog from './SheetDeleteDialog';
import MachineHelper from '../../helper/MachineHelper';
import FunctionWizard from './FunctionWizard';
import { intl } from '../../helper/IntlGlobalProvider';
import Utils from '../../helper/Utils';
import GraphItemProperties from "./GraphItemProperties";
import ViewModeProperties from "./ViewModeProperties";
import LayoutSectionProperties from './LayoutSectionProperties';

const SpeedDialDisabledStyles = {
	basestyle: {
		boxShadow: 'none'
		// disabled: true,
		// pointerEvents: "auto",
	},
	get Dark() {
		return {
			...this.basestyle,
			color: 'rgba(255, 255, 255, 0.3)',
			backgroundColor: 'rgba(255, 255, 255, 0.12)'
		};
	},
	get Default() {
		return {
			...this.basestyle,
			color: 'rgba(0, 0, 0, 0.26)',
			backgroundColor: 'rgba(0, 0, 0, 0.12)'
		};
	}
};

const getAddSheetActionStyle = (state) => {
	if (state === 'yes') return undefined;
	const style = SpeedDialDisabledStyles[localStorage.getItem('theme') || 'Default'];
	return { style, disableRipple: true };
};


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
			speedOpen: false,
			searchOpen: false,
			searchOptions: false,
			searchCaps: false,
			searchFormulas: false,
			searchActiveSheet: false,
			searchText: '',
			dummy: ''
		};
	}

	getAddSheetButtonActionStyle(state) {
		if (state === 'yes') return undefined;
		const theme = localStorage.getItem('theme') || 'Default';

		return {
			visibility: this.props.showTools ? 'visible' : 'hidden',
			position: 'absolute',
			zIndex: 1200,
			right: '30px',
			bottom: '26px',
			boxShadow: 'none',
			color: theme === 'Dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
			backgroundColor: theme === 'Dark' ?  'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
		}
	}

	componentDidMount() {
		const graphEditor = this.initGraphEditor();
		JSG.NotificationCenter.getInstance().register(this, JSG.NotificationCenter.ZOOM_NOTIFICATION, 'onZoom');
		JSG.NotificationCenter.getInstance().register(this, JSG.NotificationCenter.ADD_SHEET_NOTIFICATION, 'onAddDashboardSheet');
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
		JSG.NotificationCenter.getInstance()
			.register(this, JSG.WorksheetView.SHEET_SEARCH_NOTIFICATION, 'onSheetSearch');
		/* eslint-disable react/no-did-mount-set-state */
		this.setState({ graphEditor });
		/* eslint-enable react/no-did-mount-set-state */
	}

	componentWillUnmount() {
		const { canvas } = this;
		JSG.NotificationCenter.getInstance().unregister(this, JSG.NotificationCenter.ZOOM_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.NotificationCenter.ADD_SHEET_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.StreamSheetView.SHEET_DROP_FROM_OUTBOX);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.WorksheetView.SHEET_SEARCH_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.ButtonNode.BUTTON_CLICKED_NOTIFICATION);
		canvas._jsgEditor.destroy();
		delete canvas._jsgEditor;
		window.removeEventListener('resize', this.updateDimensions);
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

	onSheetSearch() {
		this.setState({ searchOpen: true });
		setTimeout(() => {
			document.getElementById('sheet-search').focus();
		}, 100);
	};

	handleSearch = (event) => {

		graphManager.getGraph().collectSearchResult(event.target.value, {
			matchCase: this.state.searchCaps,
			formulas: this.state.searchFormulas,
			activeSheet: this.state.searchActiveSheet,
			sheet: graphManager.getActiveSheetView() ? graphManager.getActiveSheetView().getItem() : undefined,
		});

		this.setState({
			searchText: event.target.value,
		})
		this.showSearchCell();
		graphManager.redraw();
	};

	handleSearchKeyDown = (event) => {
		switch (event.key) {
		case 'Enter':
		case 'ArrowDown':
			this.handleSearchNext();
			break;
		case 'Escape':
			this.handleSearchClose();
			break;
		case 'ArrowUp':
			this.handleSearchPrevious();
			break;
		default:
			break;
		}
	}

	handleSearchPrevious = () => {
		graphManager.getGraph().getPreviousSearchResult();
		this.showSearchCell();
		graphManager.redraw();
	};

	handleSearchNext = () => {
		graphManager.getGraph().getNextSearchResult();
		this.showSearchCell();
		graphManager.redraw();
	};

	showSearchCell() {
		const graph = graphManager.getGraph();
		if (!graph.searchResult || graph.activeSearchIndex === -1) {
			return;
		}
		const viewer = graphManager.getGraphViewer();
		const graphController = viewer.getGraphController();
		const searchRange = graph.searchResult[graph.activeSearchIndex];
		if (!searchRange) {
			return;
		}
		const controller = graphController.getControllerByModelId(searchRange.getSheet().getId());
		if (!controller) {
			return;
		}
		const view = controller.getView();

		if (view.getItem().getParent() instanceof JSG.StreamSheetContainer) {
			view.getParent().moveSheetToTop(viewer);
		}
		viewer.getGraphView().setFocus(controller);
		view.showCell({x: searchRange.getX1(), y: searchRange.getY1()});

		this.setState({
			searchCount: graphManager.getGraph.searchResult ? graphManager.getGraph.searchResult.length : 0
		})
	}

	handleSearchOptions = () => {
		this.setState({ searchOptions: !this.state.searchOptions });
	}

	handleSearchCaps = (event, state) => {
		this.setState({searchCaps: state});
		graphManager.getGraph().collectSearchResult(this.state.searchText, {
			matchCase: state,
			formulas: this.state.searchFormulas,
			activeSheet: this.state.searchActiveSheet,
			sheet: graphManager.getActiveSheetView() ? graphManager.getActiveSheetView().getItem() : undefined,
		});
		this.showSearchCell();
		graphManager.redraw();
	};

	handleSearchFormulas = (event, state) => {
		this.setState({searchFormulas: state});
		graphManager.getGraph().collectSearchResult(this.state.searchText, {
			matchCase: this.state.searchCaps,
			formulas: state,
			activeSheet: this.state.searchActiveSheet,
			sheet: graphManager.getActiveSheetView() ? graphManager.getActiveSheetView().getItem() : undefined,
		});
		this.showSearchCell();
		graphManager.redraw();
	};

	handleSearchActiveSheet = (event, state) => {
		this.setState({searchActiveSheet: state});
		graphManager.getGraph().collectSearchResult(this.state.searchText, {
			matchCase: this.state.searchCaps,
			formulas: this.state.searchFormulas,
			activeSheet: state,
			sheet: graphManager.getActiveSheetView() ? graphManager.getActiveSheetView().getItem() : undefined,
		});
		this.showSearchCell();
		graphManager.redraw();
	};

	handleSearchClose = () => {
		this.setState({
			searchOpen: false,
			searchText: '',
		});

		const graph = graphManager.getGraph();
		if (!graph.searchResult || graph.activeSearchIndex === -1) {
			return;
		}
		const viewer = graphManager.getGraphViewer();
		const graphController = viewer.getGraphController();
		const searchRange = graph.searchResult[graph.activeSearchIndex];
		if (!searchRange) {
			return;
		}
		const controller = graphController.getControllerByModelId(searchRange.getSheet().getId());
		if (!controller) {
			return;
		}
		const view = controller.getView();

		if (view.getItem().getParent() instanceof JSG.StreamSheetContainer) {
			view.getParent().moveSheetToTop(viewer);
		}
		viewer.getGraphView().setFocus(controller);

		const selection = view.getOwnSelection();
		selection.selectRange(searchRange.copy());
		view.showCell(selection.getActiveCell());
		view.notifySelectionChange(viewer);

		graphManager.getGraph().clearSearchResult();
		graphManager.redraw();
		setTimeout(() => {
			graphManager.getCanvas().focus();
		}, 100);
	};

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

	onCloseViewMode = () => {
		this.props.setAppState({ showViewMode: false });
		this.props.setJsgState({ cellSelected: false });
	}

	onViewModeProperties = () => {
		this.props.setAppState({ showViewModeProperties: true });
	}
	/**
	 * Resize canvas and inform GraphEditor
	 */

	handleSpeedOpen = () => {
		this.setState({speedOpen: true});
	}

	handleSpeedClose = () => {
		this.setState({speedOpen: false});
	}

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

	addSheetAllowed() {
		const graph = graphManager.getGraph();
		if (!graph) {
			return false;
		}

		const license = Utils.areSheetsAvailable(this.props.licenseInfo);
		const cnt = graph.getStreamSheetContainerCount();

		if (!license) {
			return 'lic';
		} else if (cnt > 5) {
			return 'max';
		}
		return 'yes';
	}

	onAddDashboardSheet() {
		const graph = graphManager.getGraph();
		const cnt = graph.getStreamSheetContainerCount() % 8;
		this.setState({speedOpen: false});

		this.props.createStreamSheet(this.props.machineId, 0, { x: 1000 * cnt, y: 1000 * cnt }, 'cellsheet');
	}

	onAdd = (type) => {
		const graph = graphManager.getGraph();
		let cnt = graph.getStreamSheetContainerCount();
		this.setState({speedOpen: false});

		if (cnt > 5) {
			// JSG.NotificationCenter.getInstance().send(
			// 	new JSG.Notification(JSG.WorksheetView.SHEET_MESSAGE_NOTIFICATION, {
			// 		view: this,
			// 		message: { message: intl.formatMessage({ id: 'Alert.SheetMaximum' }, {}) },
			// 	}),
			// );
			return;
		}

		graphManager.getGraphViewer().getSelectionProvider().clearSelection();

		cnt %= 8;

		graph.setViewMode(undefined, 0);

		this.props.createStreamSheet(this.props.machineId, 0, { x: 1000 * cnt, y: 1000 * cnt }, type);

		setTimeout(() => {
			this.props.setAppState({ viewMode: {
					dummy: Math.random(),
					...this.props.viewMode
				}
			});
		}, 200);

	};

	initGraphEditor() {
		const { canvas } = this;
		if (canvas) {
			JSG.setDrawingDisabled(true);
			const graphEditor = graphManager.createEditor(canvas);
			const graph = graphEditor.getGraph();
			window.addEventListener('resize', () => this.updateDimensions());
			// window.addEventListener('resize', () => this.updateDimensions());
			this.updateDimensions();
			graphEditor.invalidate();
			this.setState({ graphEditor, graph });
			return graphEditor;
		}
		return null;
	}

	getAddTipTitle(addAllowed, sheet) {
		switch (addAllowed) {
		default:
		case 'yes':
			return sheet ?
				<FormattedMessage
					id="Tooltip.AddStreamSheet"
					defaultMessage="Add StreamSheet"
				/> :
				<FormattedMessage
					id="Tooltip.AddDashboard"
					defaultMessage="Add Dashboard"
				/>
		case 'lic':
			return <FormattedMessage
				id="License.Info.Streamsheets.max.reached"
				defaultMessage="Maximum number of Streamsheets reached!"
			/>
		case 'max':
			return <FormattedMessage
				id="Alert.SheetMaximum"
				defaultMessage="Maximum number of 6 Sheet per Machine allowed!"
			/>
		}
	}

	updateDimensions() {
		graphManager.updateDimensions();
		graphManager.updateControls();
	}

	render() {
		const canEdit = this.props.canEditMachine;
		const canAddStreamsheet = this.addSheetAllowed();
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
				id="stream-app-edit-area"
				style={{
					height: '100%',
					width: '100%',
					visibility: this.props.showMachine ? 'visible' : 'hidden'
				}}
			>
				{viewMode.active === true || !canEdit ? null : (
					<React.Fragment>
						<SheetDeleteDialog />
						<ContextMenu />
						<TreeContextMenu />
						<GraphContextMenu />
						<LayoutContextMenu />
						<EditPointsContextMenu />
						<Paper
							elevation={4}
							style={{
								position: 'absolute',
								top: '10px',
								right: '10px',
								visibility: this.state.searchOpen ? 'visible' : 'hidden',
								paddingBottom: '6px',
							}}
						>
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center'
								}}
							>
								<TextField
									variant="outlined"
									inputProps={{
										id: "sheet-search"
									}}
									size="small"
									margin="normal"
									style={{
										width: '180px',
										display: 'inline-block',
										marginLeft: '8px',
									}}
									label={
										graphManager.getGraph().searchResult ?
											intl.formatMessage({ id: 'SearchResult' },
												{count: graphManager.getGraph().searchResult.length,
												index: graphManager.getGraph().activeSearchIndex + 1}) :
											<FormattedMessage id="SearchText" defaultMessage="SearchText"/>
									}
									value={this.state.searchText}
									onKeyUp={this.handleSearchKeyDown}
									onChange={this.handleSearch}
								/>
								<IconButton
									style= {{
										margin: '5px',
									}}
									size='small'
									onClick={(e) => this.handleSearchPrevious(e)}
									disabled={!graphManager.getGraph().searchResult}
								>
									<KeyboardArrowUpIcon />
								</IconButton>
								<IconButton
									style= {{
										margin: '5px',
									}}
									size='small'
									onClick={(e) => this.handleSearchNext(e)}
									disabled={!graphManager.getGraph().searchResult}
								>
									<KeyboardArrowDownIcon />
								</IconButton>
								<IconButton
									style= {{
										margin: '5px',
									}}
									size='small'
									onClick={(e) => this.handleSearchOptions(e)} disabled={false}
								>
									<MoreVertIcon />
								</IconButton>
								<IconButton
									style= {{
										margin: '5px',
									}}
									size='small'
									onClick={(e) => this.handleSearchClose(e)} disabled={false}
								>
									<CloseIcon />
								</IconButton>
							</div>
							{this.state.searchOptions ? (
								<FormGroup
									style={ {
										marginLeft: '6px'
									}}
								>
									<FormControlLabel
										control={<Checkbox
											checked={this.state.searchCaps}
											onChange={(event, state) => this.handleSearchCaps(event, state)}
										/>}
										label={<FormattedMessage id="SearchCaps" defaultMessage="Match Case" />}
									/>
									<FormControlLabel
										control={<Checkbox
											checked={this.state.searchFormulas}
											onChange={(event, state) => this.handleSearchFormulas(event, state)}
										/>}
										label={<FormattedMessage id="SearchFormulas" defaultMessage="Search in Formulas" />}
									/>
									<FormControlLabel
										control={<Checkbox
											checked={this.state.searchActiveSheet}
											onChange={(event, state) => this.handleSearchActiveSheet(event, state)}
										/>}
										label={<FormattedMessage id="SearchActiveSheet" defaultMessage="Search in active Sheet" />}
									/>
								</FormGroup>
								) : null
							}
						</Paper>
					</React.Fragment>
				)}
				<canvas
					id="canvas"
					style={{
						width: `calc(100% - ${this.props.showViewModeProperties ? '300px' : '0px'})`,
						// width: `calc(100%)`,
						height: '100%',
						outline: 'none'
					}}
					ref={(c) => {
						this.canvas = c;
					}}
					width="800"
					height="450"
					tabIndex="0"
					//	aria-disabled={this.isAccessDisabled()}
				/>
				{viewMode.active === true || !canEdit ? null : <GraphItemProperties dummy={this.state.dummy} />}
				{viewMode.active === true || !canEdit ? null : <LayoutSectionProperties dummy={this.state.dummy} />}
				{viewMode.active === true && canEdit ? <ViewModeProperties viewMode={viewMode} /> : null}
				{viewMode.active === true || !canEdit ? null : (
					<Slide direction="left" in={this.props.functionWizardVisible} mountOnEnter unmountOnExit>
						<FunctionWizard />
					</Slide>
				)}

				{viewMode.active === true || !canEdit ? null : (
					<div>
						{graph.getDashboardContainer() ? (
							<Tooltip
								enterDelay={300}
								title={this.getAddTipTitle(canAddStreamsheet, true)}
							>
								<Fab
									id="addSheet"
									aria-label="add"
									color="primary"
									size="medium"
									style={this.getAddSheetButtonActionStyle()}
									onClick={() => this.onAdd('sheet')}
								>
									<AddIcon
										style={{
											color: '#FFFFFF'
										}}
									/>
								</Fab>
							</Tooltip>
						) : (
							<SpeedDial
								style={{
									visibility: this.props.showTools ? 'visible' : 'hidden',
									position: 'absolute',
									zIndex: 1200,
									right: '30px',
									bottom: '26px'
								}}
								ariaLabel="Add"
								// className={classes.speedDial}
								FabProps={{
									size: 'medium'
								}}
								icon={<SpeedDialIcon />}
								onClose={this.handleSpeedClose}
								onOpen={this.handleSpeedOpen}
								open={this.state.speedOpen}
								direction="up"
							>
								<SpeedDialAction
									key="sheet"
									icon={<SheetIcon />}
									tooltipTitle={this.getAddTipTitle(canAddStreamsheet, true)}
									onClick={canAddStreamsheet === 'yes' ? () => this.onAdd('sheet') : undefined}
									// disabled
									// failed to get tooltip work if action is disabled
									// => so fake it by setting similar styles:
									FabProps={getAddSheetActionStyle(canAddStreamsheet)}
								/>
								<SpeedDialAction
									key="dash"
									icon={<DashboardIcon />}
									tooltipTitle={this.getAddTipTitle(canAddStreamsheet, false)}
									onClick={canAddStreamsheet === 'yes' ? () => this.onAdd('dashboard') : undefined}
									FabProps={getAddSheetActionStyle(canAddStreamsheet)}
								/>
							</SpeedDial>
						)}
					</div>
				)}
				{viewMode.active === true && canEdit
					? [
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="Tooltip.CloseViewMode" defaultMessage="Close View Mode" />}
							>
								<Fab
									color="primary"
									id="closeViewMode"
									size="medium"
									style={{
										position: 'absolute',
										zIndex: 1200,
										right: '30px',
										bottom: '26px'
									}}
									onClick={this.onCloseViewMode}
								>
									<CloseIcon
										style={{
											color: '#FFFFFF'
										}}
									/>
								</Fab>
							</Tooltip>,
							<Tooltip
								enterDelay={300}
								title={
									<FormattedMessage
										id="Tooltip.ViewModeSettings"
										defaultMessage="View Mode Settings"
									/>
								}
							>
								<Fab
									color="primary"
									id="viewModeProperties"
									size="medium"
									style={{
										position: 'absolute',
										zIndex: 1200,
										right: '90px',
										bottom: '26px'
									}}
									onClick={this.onViewModeProperties}
								>
									<SettingsIcon
										style={{
											color: '#FFFFFF'
										}}
									/>
								</Fab>
							</Tooltip>
					  ]
					: null}
				<div
					style={{
						visibility: this.props.showTools ? 'visible' : 'hidden',
						position: 'absolute',
						zIndex: 1200,
						left: `30px`,
						bottom: '26px'
					}}
				>
					{sheets.map((sheet, index) => (
						<div
							key={index.toString()}
							style={{
								visibility: this.props.showTools ? 'visible' : 'hidden',
								display: 'inline-flex',
								zIndex: 1200
							}}
						>
							<div
								style={{
									display: 'block',
									justifyContent: 'center',
									marginRight: '15px'
								}}
							>
								<Button
									aria-label="show"
									mini
									style={{
										backgroundColor: Colors.blue[800],
										minWidth: '40px',
										padding: '5px',
										margin: 'auto',
										display: 'block'
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
										// width: '40px',
										textAlign: 'center',
										fontSize: '10px',
										marginTop: '5px',
										display: 'block'
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
						</div>
					))}
				</div>
			</div>
		);
	}
}

function mapStateToProps(state, ownProps) {
	return {
		showMachine: MachineHelper.showMachine(state) && ownProps.machineLoaded,
		machineId: state.monitor.machine.id,
		viewMode: state.appState.viewMode,
		showViewModeProperties: state.appState.showViewModeProperties,
		showTools: state.appState.showTools,
		functionWizardVisible: state.appState.functionWizard.show,
		adminSecurity: state.adminSecurity,
		licenseInfo: state.meta.licenseInfo
	};
}

const mapDispatchToProps = Actions;

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(CanvasComponent);
