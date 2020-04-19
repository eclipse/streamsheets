import AppBar from '@material-ui/core/AppBar';
import Grid  from '@material-ui/core/Grid';
import * as Colors from '@material-ui/core/colors';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import Toolbar from '@material-ui/core/Toolbar';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
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

export const AdminPageLayoutComponent = (props) => {
	const { page, isMachineEngineConnected, documentTitle, isConnected, children, userLoaded } = props;

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
				<ServerStatusDialog />
				<ErrorDialog />
			</MuiThemeProvider>
		);
	}

	return (
		<MuiThemeProvider theme={theme}>
			<div
				style={{
					height: 'inherit',
					width: 'inherit',
				}}
			>
				<div>
					<ImportDialog />
					<StartImportDialog />
					<NewMachineDialog />
					<OpenDialog />
					<MainDrawer />
					<AlertDialog />
					<DecisionDialog />
					<RequestStatusDialog />
					<ServerStatusDialog isMachineDetailPage />
					<ErrorDialog />
					<AppBar
						style={{
							background: isMachineEngineConnected ? Colors.blue[800] : Colors.red[900],
							display: 'flex',
							margin: 0,
							padding: 0,
							position: 'relative',
						}}
					>
						<div
							style={{
								display: 'flex',
								flexDirection: 'row',
								height: '58px',
							}}
						>
							{/* <Snackbar
								anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
								title={<FormattedMessage id="Administration" defaultMessage="Administration" />}
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
									minHeight: '58px',
								}}
							>
								<NotificationsComponent />
								<HelpButton />
								<SettingsMenu />
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
						<AdminNavigation selection={page} />
					</Grid>
					<Grid item style={{ height: '100%', flexGrow: 1, background: '#EEE' }}>
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
};

function mapStateToProps(state) {
	return {
		isConnected: state.monitor.isConnected,
		isMachineEngineConnected: MachineHelper.isMachineEngineConnected(state.monitor, state.meta),
		disconnectedServices: state.meta.disconnectedServices.join(', '),
		userLoaded: !!state.user.user,
	};
}

const mapDispatchToProps = {
	connect: Actions.connect,
	getMe: Actions.getMe,
};

export const AdminPageLayout = connect(
	mapStateToProps,
	mapDispatchToProps,
)(AdminPageLayoutComponent);
