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
import AppBar from '@material-ui/core/AppBar';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import Toolbar from '@material-ui/core/Toolbar';
import PropTypes from 'prop-types';
import qs from 'query-string';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions/actions';
import EditBarComponent from '../components/AppBarComponent/EditBarComponent';
import InfoToolBar from '../components/AppBarComponent/InfoToolBar';
import MainDrawer from '../components/AppBarComponent/MainDrawer';
import CanvasToolBar from '../components/Canvas/CanvasToolBar';
import InboxSettings from '../components/HelperComponent/InboxSettings';
import LicenseExpireNotification from '../components/HelperComponent/LicenseExpireNotification';
import MachineSettingsDialog from '../components/HelperComponent/MachineSettingsDialog';
import NewMachineDialog from '../components/HelperComponent/NewMachineDialog';
import OpenDialog from '../components/HelperComponent/OpenDialog';
import { Restricted, NotAllowed } from '../components/HelperComponent/Restricted';
import SaveAsDialog from '../components/HelperComponent/SaveAsDialog';
import ErrorDialog from '../components/ImportExport/ErrorDialog';
import ImportDialog from '../components/ImportExport/ImportDialog';
import StartImportDialog from '../components/ImportExport/StartImportDialog';
import MachineControlBar from '../components/MachineControlBar/MachineControlBar';
import MachineDeleteDialog from '../components/MachineControlBar/MachineDeleteDialog';
import MachineDetailComponent from '../components/MachineDetailComponent/MachineDetailComponent';
import NotificationsComponent from '../components/NotificationsComponent/NotificationsComponent';
import RequestStatusDialog from '../components/RequestStatusDialog/RequestStatusDialog';
import ServerStatusDialog from '../components/ServerStatusDialog/ServerStatusDialog';
import SettingsMenu from '../components/SettingsMenu/SettingsMenu';
import AlertDialog from '../components/SheetDialogs/AlertDialog';
import DecisionDialog from '../components/SheetDialogs/DecisionDialog';
import DeleteCellContentDialog from '../components/SheetDialogs/DeleteCellContentDialog';
import DeleteCellsDialog from '../components/SheetDialogs/DeleteCellsDialog';
import FormatCellsDialog from '../components/SheetDialogs/FormatCellsDialog';
import InsertCellContentDialog from '../components/SheetDialogs/InsertCellContentDialog';
import InsertCellsDialog from '../components/SheetDialogs/InsertCellsDialog';
import NamesDialog from '../components/SheetDialogs/NamesDialog';
import PasteFunctionDialog from '../components/SheetDialogs/PasteFunctionDialog';
import { graphManager } from '../GraphManager';
import { accessManager, RESOURCE_ACTIONS } from '../helper/AccessManager';
import gatewayClient from '../helper/GatewayClient';
import GraphLocaleHandler from '../helper/GraphLocaleHandler';
import { intl } from '../helper/IntlGlobalProvider';
import MachineHelper from '../helper/MachineHelper';
import theme from '../theme';
import HelpButton from './HelpButton';
import { ResizeHandler } from './ResizeHandler';
import { ViewModeHandler, ViewModePropTypes } from './ViewModeHandler';
import { Path } from '../helper/Path';
import { DialogExtensions } from '@cedalo/webui-extensions';

const useExperimental = (setAppState) => {
	useEffect(() => setAppState({ experimental: localStorage.getItem('experimental') === 'true' }), []);
};

export function MachineDetailPage(props) {
	const { locale, machineName, viewMode, searchParams, isConnected, location } = props;
	let { showTools } = props;
	// Should be directly on props
	const machineId = props.match.params.machineId || props.machineId;
	const { token, userId } = qs.parse(location.search);

	if (token && !accessManager.authToken) {
		const newUrl = window.location.origin + Path.machine(machineId, window.location.search);
		accessManager.loginWithToken({
			token,
			userId,
			newUrl
		});
	}

	const [userLoaded, setUserLoaded] = useState(false);
	const [canEditMachine, setCanEditMachine] = useState(false);
	useExperimental(props.setAppState);

	useEffect(() => {
		if (!isConnected) {
			props.connect();
		}
	}, [isConnected]);

	// Update canvas if showTools or viewMode change
	useEffect(() => {
		graphManager.updateCanvas(showTools, viewMode);
	}, [showTools, viewMode]);

	const loadUser = async () => {
		try {
			await props.getMe();
			setUserLoaded(true);
		} catch (e) {
			console.warn(e);
		}
	};

	const handleState = (state) => {
		props.setAppState(state);
	};

	useEffect(() => {
		if (isConnected) {
			loadUser();
		}
	}, [isConnected]);

	const loadMachine = async () => {
		const query = qs.parse(searchParams);
		const stream = {
			id: query.streamId,
			name: query.streamName
		};
		const newMachineName = query.machineName;
		const scope = { id: query.scope };
		try {
			const response = await props.loadSubscribeMachine(machineId, {
				settings: { locale },
				stream,
				scope
			});
			const createdFromTemplate = !!response.machineserver.templateId;
			const { machine } = response.machineserver;
			if (createdFromTemplate) {
				await props.rename(machine.id, newMachineName);
				console.log(`Rerouting to machine ${machine.id}`);
				const newURL = Path.machine(machine.id);
				props.history.replace(newURL);
			}
			// will probably always/often fail for shared machine due to wrong scope??
			const { scopedByMachine } = await gatewayClient.graphql(
				`
			query MachineDetailPageData($machineId: ID!) {
				scopedByMachine(machineId: $machineId) {
					streamsLegacy {
						name
						id
						className
						state
					}
					machine(id: $machineId) {
						canEdit
						scope {
							id
						}
					}
				}
			}
			`,
				{ machineId }
			);
			setCanEditMachine(scopedByMachine.machine.canEdit);
			props.receiveStreams({ streams: scopedByMachine.streamsLegacy });
			props.setScope(scopedByMachine.machine.scope.id);
			if (scopedByMachine.machine.canEdit === false) {
				showTools = false;
			}
		} catch (error) {
			console.log(error);
			console.log(`${error ? error.toString() : ''}`);
		} finally {
			graphManager.updateCanvas(showTools, viewMode);
			graphManager.redraw();
		}
	};

	useEffect(() => {
		if (userLoaded && MachineHelper.currentMachineCan(RESOURCE_ACTIONS.VIEW) && machineId) {
			loadMachine();
			return () => props.unsubscribe(machineId);
		}
		return () => {};
	}, [userLoaded, machineId]);

	useEffect(() => {
		document.title = intl.formatMessage({ id: 'TitleMachine' }, { name: machineName || 'Machine' });
	}, [machineName]);

	const showTools_ = viewMode.viewMode === null && showTools;
	let contentMargin = canEditMachine ? 118 : 58;
	contentMargin = showTools_ ? contentMargin : 0;
	if (!userLoaded) {
		return (
			<MuiThemeProvider theme={theme}>
				<ViewModeHandler />
				<RequestStatusDialog />
				<ServerStatusDialog />
				<ErrorDialog />
				<ResizeHandler />
			</MuiThemeProvider>
		);
	}

	// const title = <FormattedMessage id="MainTitle" defaultMessage="Stream Machine" />;
	return (
		<MuiThemeProvider theme={theme}>
			<div
				style={{
					height: 'inherit',
					width: 'inherit'
				}}
			>
				<ViewModeHandler />
				<ResizeHandler />
				<GraphLocaleHandler />
				<DialogExtensions />
				{viewMode.viewMode === null ? (
					<div>
						<ImportDialog />
						<NewMachineDialog />
						<OpenDialog />
						<SaveAsDialog />
						<MainDrawer isMachineDetailPage canEditMachine={canEditMachine} />
						<AlertDialog />
						<DecisionDialog />
						<RequestStatusDialog />
						<ServerStatusDialog isMachineDetailPage />
						<ErrorDialog />
						{canEditMachine ? (
							<React.Fragment>
								<InsertCellsDialog />
								<DeleteCellsDialog />
								<DeleteCellContentDialog
									open={props.showDeleteCellContentDialog}
									stateHandler={handleState}
								/>
								<InsertCellContentDialog
									open={props.showInsertCellContentDialog}
									stateHandler={handleState}
								/>
								<FormatCellsDialog open={props.showFormatCellsDialog} stateHandler={handleState} />
								<PasteFunctionDialog
									open={props.showPasteFunctionsDialog}
									stateHandler={handleState}
									experimental={props.experimental}
								/>
								<NamesDialog open={props.showEditNamesDialog} stateHandler={handleState} />
								<StartImportDialog />
								<InboxSettings />
								<MachineSettingsDialog />
								<MachineDeleteDialog />
							</React.Fragment>
						) : null}
						<AppBar
							color={isConnected ? "primary" : "error"}
							style={{
								visibility: showTools_ ? 'visible' : 'hidden',
								display: showTools_ ? 'flex' : 'none',
								margin: 0,
								padding: 0,
								position: 'relative'
							}}
							elevation={0}
						>
							<div
								style={{
									display: 'flex',
									flexDirection: 'row',
									justifyContent: 'space-between',
									height: '58px'
								}}
							>
								<InfoToolBar canEditMachine={canEditMachine} width="33%"/>
								{!isConnected ? (
									<div>
										<FormattedMessage id="ServicesDisconnected" defaultMessage="Disconnected: " />
										{`${props.meta.disconnectedServices.join(', ')}`}
									</div>
								) : null}
								<div
									style={{
										display: 'inline-flex',
									}}
								>
									{canEditMachine ? <MachineControlBar /> : null}
									<LicenseExpireNotification />
									<Toolbar
										style={{
											paddingRight: '5px',
											minHeight: '58px'
										}}
									>
										<NotificationsComponent />
										<HelpButton />
										<SettingsMenu />
									</Toolbar>
								</div>
							</div>
							{canEditMachine ? (
								<React.Fragment>
									<CanvasToolBar />
									<EditBarComponent />
								</React.Fragment>
							) : null}
						</AppBar>
					</div>
				) : null}

				<Restricted all={['machine.view']}>
					<NotAllowed>
						<div
							style={{
								fontSize: '2rem',
								textAlign: 'center',
								color: 'red',
								// border: 'red dotted',
								padding: '5px',
								margin: '50px'
							}}
						>
							<FormattedMessage id="Admin.notAuthorized" defaultMessage="Not Authorized" />
						</div>
					</NotAllowed>
					<div
						style={{
							position: 'relative',
							width: '100%',
							height: `calc(100% - ${contentMargin}px)`,
							outline: 'none'
						}}
					>
						<MachineDetailComponent canEditMachine={canEditMachine} />
					</div>
				</Restricted>
			</div>
		</MuiThemeProvider>
	);
}

MachineDetailPage.propTypes = {
	getMe: PropTypes.func.isRequired,
	loadSubscribeMachine: PropTypes.func.isRequired,
	rename: PropTypes.func.isRequired,
	setAppState: PropTypes.func.isRequired,
	receiveStreams: PropTypes.func.isRequired,
	connect: PropTypes.func.isRequired,
	locale: PropTypes.string,
	isConnected: PropTypes.bool.isRequired,
	machineName: PropTypes.string,
	viewMode: ViewModePropTypes,
	showTools: PropTypes.bool.isRequired,
	searchParams: PropTypes.string.isRequired,
	history: PropTypes.shape({
		replace: PropTypes.func.isRequired
	}).isRequired,
	// eslint-disable-next-line
	match: PropTypes.object.isRequired,
	meta: PropTypes.shape({
		disconnectedServices: PropTypes.arrayOf(PropTypes.string).isRequired
	}).isRequired
};

MachineDetailPage.defaultProps = {
	locale: undefined,
	machineName: '',
	viewMode: {}
};

function mapStateToProps(state) {
	return {
		isConnected: MachineHelper.isMachineEngineConnected(state.monitor, state.meta),
		machine: state.monitor.machine,
		machineName: state.monitor.machine.name,
		viewMode: state.appState.viewMode,
		showTools: state.appState.showTools,
		searchParams: state.router.location.search,
		locale: state.locales.locale,
		meta: state.meta,
		showDeleteCellContentDialog: state.appState.showDeleteCellContentDialog,
		showInsertCellContentDialog: state.appState.showInsertCellContentDialog,
		showFormatCellsDialog: state.appState.showFormatCellsDialog,
		showPasteFunctionsDialog: state.appState.showPasteFunctionsDialog,
		showEditNamesDialog: state.appState.showEditNamesDialog,
		experimental: state.appState.experimental,
		adminSecurity: state.adminSecurity
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MachineDetailPage);
