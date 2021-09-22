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
/* eslint-disable react/prop-types,react/no-unused-state */
import { WorkspaceSelect } from '@cedalo/webui-extensions';
import AppBar from '@material-ui/core/AppBar';
import { MuiThemeProvider } from '@material-ui/core';
import Toolbar from '@material-ui/core/Toolbar';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions/actions';
import InfoToolBar from '../components/AppBarComponent/InfoToolBar';
import MainDrawer from '../components/AppBarComponent/MainDrawer';
import FilterName from '../components/base/listing/FilterName';
import DashBoardComponent from '../components/Dashboard/DashBoardComponent';
import LicenseNotification from '../components/HelperComponent/LicenseNotification';
import NewMachineDialog from '../components/Dialogs/NewMachineDialog';
import OpenDialog from '../components/Dialogs/OpenDialog';
import SaveAsDialog from '../components/Dialogs/SaveAsDialog';
import ErrorDialog from '../components/ImportExport/ErrorDialog';
import ImportDialog from '../components/ImportExport/ImportDialog';
import StartImportDialog from '../components/ImportExport/StartImportDialog';
import MachineDeleteDialog from '../components/MachineControlBar/MachineDeleteDialog';
import NotificationsComponent from '../components/NotificationsComponent/NotificationsComponent';
import RequestStatusDialog from '../components/RequestStatusDialog/RequestStatusDialog';
import ServerStatusDialog from '../components/ServerStatusDialog/ServerStatusDialog';
import SettingsMenu from '../components/HelperComponent/SettingsMenu';
import AlertDialog from '../components/SheetDialogs/AlertDialog';
import DecisionDialog from '../components/SheetDialogs/DecisionDialog';
import { intl } from '../helper/IntlGlobalProvider';
import MachineHelper from '../helper/MachineHelper';
import HelpButton from '../layouts/HelpButton';
import ThemeButton from '../layouts/ThemeButton';
import TourButton from '../layouts/TourButton';
import theme from '../theme';
import Joyride from 'react-joyride';
import steps from '../tutorial/dashboard-steps';

const DASHBOARD_QUERY = `
query Machines($scope: ScopeInput!) {
	scoped(scope: $scope) {
		machines {
			name
			id
			metadata {
				lastModified
				owner
			}
			previewImage
			titleImage
			streamsheets {
				name
				inbox {
					stream {
						name
					}
				}
			}
			state
		}
	}
}
`;

const useExperimental = (setAppState) => {
	useEffect(() => setAppState({ experimental: localStorage.getItem('experimental') === 'true' }), []);
};

export function DashboardPageComponent(props) {
	const { user, isConnected, tour} = props;
	const scopeId = user ? user.scope.id : null;
	const [filter, setFilter] = useState('');

	useExperimental(props.setAppState);

	useEffect(() => {
		if (!isConnected) {
			props.connect();
		}
	}, [isConnected]);

	useEffect(() => {
		if (isConnected) {
			props.getMe();
		}
	}, [isConnected]);

	useEffect(() => {
		if (scopeId) {
			props.getMachines(DASHBOARD_QUERY, { scope: { id: scopeId } });
			props.getDataStores();
		}
	}, [scopeId]);

	document.title = intl.formatMessage({ id: 'TitleDashboard' }, {});

	if (!user) {
		return (
			<MuiThemeProvider theme={theme}>
				<RequestStatusDialog />
				<ServerStatusDialog noStreams />
				<ErrorDialog />
			</MuiThemeProvider>
		);
	}
	return (
		<MuiThemeProvider theme={theme}>
			<div
				style={{
					height: 'inherit',
					width: 'inherit'
				}}
			>
				<div>
					<Joyride
						run={tour === 'dashboard'}
						continuous
						//   getHelpers={this.getHelpers}
						scrollToFirstStep
						showProgress
						showSkipButton
						steps={steps}
						// callback={onTourStateChange}
						styles={{
							options: {
								zIndex: 10000
							}
						}}
					/>
					<ImportDialog />
					<StartImportDialog />
					<NewMachineDialog />
					<OpenDialog />
					<SaveAsDialog />
					<MachineDeleteDialog />
					<MainDrawer />
					<AlertDialog />
					<DecisionDialog />
					<RequestStatusDialog />
					<ServerStatusDialog noStreams />
					<ErrorDialog />
					<AppBar
						color={props.isMachineEngineConnected ? 'primary' : 'error'}
						style={{
							display: 'flex',
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
							<LicenseNotification />
							<div style={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
								<InfoToolBar
									title={<FormattedMessage id="MainTitle" defaultMessage="Streamsheets" />}
								/>
								<WorkspaceSelect editable setScope={props.setScope} />
							</div>
							{!props.isMachineEngineConnected ? (
								<div>
									<FormattedMessage id="ServicesDisconnected" defaultMessage="Disconnected: " />
									{`${props.disconnectedServices}`}
								</div>
							) : null}
							<div
								style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
							>
								<FilterName filter={filter} onUpdateFilter={setFilter} />
							</div>
							<div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
								<Toolbar
									style={{
										paddingRight: '5px',
										minHeight: '58px'
									}}
								>
									<NotificationsComponent />
									<HelpButton />
									<ThemeButton />
									<TourButton context="dashboard" />
									<SettingsMenu />
								</Toolbar>
							</div>
						</div>
					</AppBar>
				</div>
				<div
					style={{
						position: 'relative',
						height: 'calc(100% - 58px)',
						width: '100%',
						overflow: 'hidden'
					}}
				>
					<DashBoardComponent filter={filter} onUpdateFilter={setFilter} />
				</div>
			</div>
		</MuiThemeProvider>
	);
}

function mapStateToProps(state) {
	return {
		tour: state.appState.tour,
		isConnected: state.monitor.isConnected,
		isMachineEngineConnected: MachineHelper.isMachineEngineConnected(state.monitor, state.meta),
		user: state.user.user,
		disconnectedServices: state.meta.disconnectedServices.join(', ')
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export const DashboardPage = connect(mapStateToProps, mapDispatchToProps)(DashboardPageComponent);
