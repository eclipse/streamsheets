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
import Grid from '@material-ui/core/Grid';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import Toolbar from '@material-ui/core/Toolbar';
import PropTypes from 'prop-types';
import React, {useEffect} from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import * as Actions from '../actions/actions';
import InfoToolBar from '../components/AppBarComponent/InfoToolBar';
import MainDrawer from '../components/AppBarComponent/MainDrawer';
import NewMachineDialog from '../components/HelperComponent/NewMachineDialog';
import OpenDialog from '../components/HelperComponent/OpenDialog';
import ErrorDialog from '../components/ImportExport/ErrorDialog';
import ImportDialog from '../components/ImportExport/ImportDialog';
import StartImportDialog from '../components/ImportExport/StartImportDialog';
import NotificationsComponent from '../components/NotificationsComponent/NotificationsComponent';
import RequestStatusDialog from '../components/RequestStatusDialog/RequestStatusDialog';
import ServerStatusDialog from '../components/ServerStatusDialog/ServerStatusDialog';
import SettingsMenu from '../components/SettingsMenu/SettingsMenu';
import AlertDialog from '../components/SheetDialogs/AlertDialog';
import DecisionDialog from '../components/SheetDialogs/DecisionDialog';
import { useDocumentTitle } from '../helper/Hooks';
import MachineHelper from '../helper/MachineHelper';
import theme from '../theme';
import { AdminNavigation } from './AdminNavigation';
import HelpButton from './HelpButton';
import Wall from '../components/HelperComponent/Wall';


export const AdminPageLayoutComponent = (props) => {
	const {
		page,
		isMachineEngineConnected,
		documentTitle,
		isConnected,
		children,
		userLoaded,
		requireStreams,
	} = props;

	useEffect(() => {
		if (!isConnected) {
			props.connect();
		}
	}, [isConnected]);

	useEffect(() => {
		if (isConnected && !userLoaded) {
			props.getMe();
		}
	}, [isConnected]);

	useDocumentTitle(documentTitle);

	if (!userLoaded) {
		return (
			<MuiThemeProvider theme={theme}>
				<RequestStatusDialog />
				<ServerStatusDialog noStreams={!requireStreams} noMachines />
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
					<ImportDialog />
					<StartImportDialog />
					<NewMachineDialog />
					<OpenDialog />
					<MainDrawer isAdminPage />
					<AlertDialog />
					<DecisionDialog />
					<RequestStatusDialog />
					<ServerStatusDialog noStreams={!requireStreams} noMachines />
					<ErrorDialog />
					<AppBar
						color={props.isMachineEngineConnected ? "primary" : "error"}
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
							{/* <Snackbar
								anchorOrigin={{ vertical: 'top', horizontal: 'center' } }
								key="daysLeft"
								open={daysLeft < 20}
								ContentProps={{
									'aria-describedby': 'message-id',
								}}
								message={
									<span style={{ color: 'red' }} id="message-id">
										{daysLeft}{' '}
										<FormattedMessage
											id="License.DaysLeftNotification"
											defaultMessage="days left for expiration of your StreamSheets!"
										/>
									</span>
								}
							/> */}
							<InfoToolBar
								title={<FormattedMessage id="MainTitle" defaultMessage="Streamsheets" />}
								hideDrawer
							/>
							{!isMachineEngineConnected ? (
								<div>
									<FormattedMessage id="ServicesDisconnected" defaultMessage="Disconnected: " />
									{`${props.disconnectedServices}`}
								</div>
							) : null}
							<Toolbar
								style={{
									paddingRight: '5px',
									minHeight: '58px'
								}}
							>
								<NotificationsComponent />
								<HelpButton />
								<SettingsMenu isAdminPage />
							</Toolbar>
						</div>
					</AppBar>
				</div>
				<Grid
					container
					padding="0"
					alignItems="stretch"
					style={{ height: 'calc(100% - 58px)', flexWrap: 'nowrap' }}
				>
					<Grid item style={{ width: '200px', borderRight: '1px solid grey' }}>
						<Wall>
							<AdminNavigation selection={page} />
						</Wall>
					</Grid>
					<Grid item style={{ height: '100%', backgroundColor: theme.wall.backgroundColor, flexGrow: 1, overflow: 'auto'}}>
						{children}
					</Grid>
				</Grid>
			</div>
		</MuiThemeProvider>
	);
};

AdminPageLayoutComponent.propTypes = {
	page: PropTypes.string.isRequired,
	documentTitle: PropTypes.string.isRequired,
	isMachineEngineConnected: PropTypes.bool.isRequired,
	isConnected: PropTypes.bool.isRequired,
	userLoaded: PropTypes.bool.isRequired,
	children: PropTypes.node.isRequired,
	disconnectedServices: PropTypes.string.isRequired,
	connect: PropTypes.func.isRequired,
	getMe: PropTypes.func.isRequired,
	requireStreams: PropTypes.bool,
};

AdminPageLayoutComponent.defaultProps = {
	requireStreams: false,
};

function mapStateToProps(state) {
	return {
		isConnected: state.monitor.isConnected,
		isMachineEngineConnected: MachineHelper.isMachineEngineConnected(state.monitor, state.meta),
		disconnectedServices: state.meta.disconnectedServices.join(', '),
		userLoaded: !!state.user.user
	};
}

const mapDispatchToProps = {
	connect: Actions.connect,
	getMe: Actions.getMe
};

export const AdminPageLayout = connect(mapStateToProps, mapDispatchToProps)(AdminPageLayoutComponent);
