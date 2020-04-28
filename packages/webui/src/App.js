/* eslint-disable react/no-did-mount-set-state */
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import fetch from 'isomorphic-fetch';
import 'typeface-roboto'; // eslint-disable-line
import MachineDetailPage from './layouts/MachineDetailPage';
import LoginPage from './components/Auth/LoginPage';
import SetupPage from './components/Auth/SetupPage';
import LogoutPage from './components/Auth/LogoutPage';
import PrivateRoute from './components/Auth/PrivateRoute';
import { history } from './store';
import './App.css';
import ConfigManager from './helper/ConfigManager';
import { DashboardPage, ExportPage, StreamsPage } from './pages';
import { RoutesExtensions, UserTablePage, CreateUserPage, UpdateUserPage } from '@cedalo/webui-extensions';
import * as Actions from './actions/actions';
import MachineHelper from './helper/MachineHelper';
import { Path } from './helper/Path';

const GATEWAY_CONFIG = ConfigManager.config.gatewayClientConfig;

const DefaultAdminRouteRedirect = connect(
	({ user, monitor, meta }) => ({
		rights: user.rights,
		hasUser: !!user.user,
		isConnected: MachineHelper.isMachineEngineConnected(monitor, meta)
	}),
	{
		getMe: Actions.getMe,
		connect: Actions.connect
	}
)((props) => {
	const { rights, isConnected, hasUser } = props;
	useEffect(() => {
		if (!isConnected) {
			props.connect();
		}
	}, [isConnected]);

	useEffect(() => {
		if (isConnected && !hasUser) {
			props.getMe();
		}
	}, [isConnected]);
	if (!hasUser) {
		return null;
	}
	if (rights.includes('stream')) {
		return <Redirect to={Path.connectors()} />;
	}
	return <Redirect to={Path.users()} />;
});

const isLicenseAccepted = (setup) => setup.licenseAgreement && setup.licenseAgreement.accepted;
const isSetupCompleted = (setup) => setup && isLicenseAccepted(setup);
class App extends React.Component {
	async componentDidMount() {
		const response = await fetch(`${GATEWAY_CONFIG.restEndpointURL}/system/setup`);
		const setup = await response.json();
		this.setState({
			setup
		});
	}

	render() {
		return (
			<ConnectedRouter history={history}>
				<div
					style={{
						height: '100%',
						width: '100%'
					}}
				>
					<Route path="/setup" component={SetupPage} />
					{this.state && !isSetupCompleted(this.state.setup) && (
						<Redirect
							to={{
								pathname: '/setup'
							}}
						/>
					)}
					{this.state && this.state.setup && isSetupCompleted(this.state.setup) && (
						<div
							style={{
								height: '100%',
								width: '100%'
							}}
						>
							<Route path="/login" component={LoginPage} />
							<Route path="/logout" component={LogoutPage} />
							<Route exact path="/" render={() => <Redirect to="/dashboard" />} />
							{process.env.REACT_APP_HIDE_ADMIN ? null : (
								<React.Fragment>
									<Route exact path="/administration" component={DefaultAdminRouteRedirect} />
									<PrivateRoute path="/administration/connectors" component={StreamsPage} />
									<PrivateRoute path="/administration/database" component={StreamsPage} />
									<Route path="/administration/consumers" component={StreamsPage} />
									<Route path="/administration/producers" component={StreamsPage} />
									{/* <PrivateRoute path="/administration/plugins/" component={DefaultLayout} /> */}
									<PrivateRoute exact path="/administration/users" component={UserTablePage} />
									<PrivateRoute exact path="/administration/users/new" component={CreateUserPage} />
									<PrivateRoute
										exact
										path="/administration/users/:userId([^\/]{4,})"
										component={UpdateUserPage}
									/>
								</React.Fragment>
							)}

							<RoutesExtensions />

							<PrivateRoute path="/dashboard" component={DashboardPage} />
							<PrivateRoute path="/export" component={ExportPage} />
							<PrivateRoute path="/machines/:machineId" component={MachineDetailPage} />
							<Route path="/machines/:machineId/:userId/:token" component={MachineDetailPage} />
							<PrivateRoute path="/administration/stream/:configId" component={StreamsPage} />
						</div>
					)}
				</div>
			</ConnectedRouter>
		);
	}
}

export default App;
