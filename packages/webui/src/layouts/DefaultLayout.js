/* eslint-disable react/prop-types,react/no-unused-state */
import AppBar from '@material-ui/core/AppBar';
import * as Colors from '@material-ui/core/colors';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import Toolbar from '@material-ui/core/Toolbar';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions/actions';
import AdminContainer from '../components/Admin/AdminContainer';
import InfoToolBar from '../components/AppBarComponent/InfoToolBar';
import MainDrawer from '../components/AppBarComponent/MainDrawer';
import DashBoardComponent from '../components/Dashboard/DashBoardComponent';
import NewMachineDialog from '../components/HelperComponent/NewMachineDialog';
import OpenDialog from '../components/HelperComponent/OpenDialog';
import SaveAsDialog from '../components/HelperComponent/SaveAsDialog';
import LicenseExpireNotification from '../components/HelperComponent/LicenseExpireNotification';
import ErrorDialog from '../components/ImportExport/ErrorDialog';
import ExportComponent from '../components/ImportExport/ExportComponent';
import ImportDialog from '../components/ImportExport/ImportDialog';
import StartImportDialog from '../components/ImportExport/StartImportDialog';
import MachineDeleteDialog from '../components/MachineControlBar/MachineDeleteDialog';
import MachineTableComponent from '../components/MachineTableComponent/MachineTableComponent';
import NotificationsComponent from '../components/NotificationsComponent/NotificationsComponent';
import RequestStatusDialog from '../components/RequestStatusDialog/RequestStatusDialog';
import ServerStatusDialog from '../components/ServerStatusDialog/ServerStatusDialog';
import SettingsMenu from '../components/SettingsMenu/SettingsMenu';
import AlertDialog from '../components/SheetDialogs/AlertDialog';
import DecisionDialog from '../components/SheetDialogs/DecisionDialog';
import { intl } from '../helper/IntlGlobalProvider';
import MachineHelper from '../helper/MachineHelper';
import theme from '../theme';
import HelpButton from './HelpButton';

let initialized = false;
let initializing = false;

export class DefaultLayout extends React.Component {
	static propTypes = {
		// eslint-disable-next-line react/forbid-prop-types
		match: PropTypes.object.isRequired,
	};

	static childContextTypes = {
		muiTheme: PropTypes.object,
	};

	static async initializeAll(props) {
		try {
			if (!props.isConnected) {
				await props.connect();
			}
			await props.getMe();
			await props.getMachines(`
				{
					name
					id
					lastModified
					previewImage
					streamSheets {
						name
					}
					state
				}
			`);
			await props.getDataStores();

			props.setAppState({ experimental: localStorage.getItem('experimental') === 'true' });
			props.setAppState({ debug: !!localStorage.getItem('DLDEBUG') });

			initialized = true;
		} catch (error) {
			console.error('error connecting to the websocket client', error);
		}
	}

	getChildContext() {
		return {
			muiTheme: theme,
		};
	}

	componentDidMount() {
		if (!initialized && !initializing) {
			initializing = true;
			DefaultLayout.initializeAll(this.props);
		}
	}

	onHelp = () => {
		window.open('https://docs.cedalo.com', '_blank');
	};

	onOnline = () => console.log('onOnline');
	onOffline = () => console.log('onOffline');

	getTitle(path) {
		if (path === '/dashboard') {
			return <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />;
		} else if (path.startsWith('/administration')) {
			return <FormattedMessage id="Administration" defaultMessage="Administration" />;
		}
		return <FormattedMessage id="MainTitle" defaultMessage="Stream Machine" />;
	}

	setDocumentTitle() {
		const { match } = this.props;
		switch (match.path) {
			case '/dashboard':
				document.title = intl.formatMessage({ id: 'TitleDashboard' }, {});
				break;
			case '/administration/connectors':
				document.title = intl.formatMessage({ id: 'TitleConnectors' }, {});
				break;
			case '/administration/consumers':
				document.title = intl.formatMessage({ id: 'TitleConsumers' }, {});
				break;
			case '/administration/producers':
				document.title = intl.formatMessage({ id: 'TitleProducers' }, {});
				break;
			case '/export':
				document.title = intl.formatMessage({ id: 'TitleExport' }, {});
				break;
			default:
				if (match.path.startsWith('/administration/stream')) {
					// TODO get name of stream
					document.title = intl.formatMessage({ id: 'TitleStream' }, {});
				} else if (match.path.startsWith('/administration/stream')) {
					document.title = intl.formatMessage({ id: 'TitleStream' }, {});
				} else {
					document.title = intl.formatMessage({ id: 'TitlePage' }, {});
				}
				break;
		}
	}

	connectClient() {
		return this.props.isConnected ? Promise.resolve() : this.props.connect();
	}

	render() {
		const { match } = this.props;
		this.setDocumentTitle();
		if (!this.props.user) {
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
						<SaveAsDialog />
						<MachineDeleteDialog />
						<MainDrawer />
						<AlertDialog />
						<DecisionDialog />
						<RequestStatusDialog />
						<ServerStatusDialog />
						<ErrorDialog />
						<AppBar
							style={{
								background: this.props.isMachineEngineConnected ? Colors.blue[800] : Colors.red[900],
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
								<LicenseExpireNotification />
								<InfoToolBar title={this.getTitle(match.path)} />
								{!this.props.isMachineEngineConnected ? (
									<div>
										<FormattedMessage id="ServicesDisconnected" defaultMessage="Disconnected: " />
										{`${this.props.disconnectedServices}`}
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
					{match.path === '/start' ? (
						<div
							style={{
								position: 'relative',
								width: 'calc(100%)',
								height: `calc(100% - ${contentMargin}px)`,
								outline: 'none',
							}}
						>
							<MachineTableComponent />
						</div>
					) : null}
					{match.path === '/export' ? (
						<div
							style={{
								position: 'relative',
								height: 'calc(100% - 59px)',
								width: '100%',
								overflow: 'hidden',
								backgroundColor: '#EEEEEE',
							}}
						>
							<ExportComponent />
						</div>
					) : null}
					{match.path === '/dashboard' ? (
						<div
							style={{
								position: 'relative',
								height: 'calc(100% - 59px)',
								width: '100%',
								overflow: 'hidden',
								backgroundColor: '#EEEEEE',
							}}
						>
							<DashBoardComponent />
						</div>
					) : null}
					{match.path.startsWith('/administration') ? (
						<div
							style={{
								position: 'relative',
								height: 'calc(100% - 59px)',
								outline: 'none',
								overflow: 'hidden'
							}}
						>
							<AdminContainer location={this.props.location} match={this.props.match} />
						</div>
					) : null}
				</div>
			</MuiThemeProvider>
		);
	}
}

function mapStateToProps(state) {
	return {
		isConnected: state.meta.isConnected,
		isMachineEngineConnected: MachineHelper.isMachineEngineConnected(state.monitor, state.meta),
		user: state.user.user,
		disconnectedServices: state.meta.disconnectedServices.join(', '),
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(DefaultLayout);
