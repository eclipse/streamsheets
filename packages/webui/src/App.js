/* eslint-disable react/no-did-mount-set-state */
import React from 'react';
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
import {
	UserTablePage,
	CreateUserPage,
	UpdateUserPage,
	DashboardPage,
	ExportPage,
	StreamsPage
} from './pages';

const GATEWAY_CONFIG = ConfigManager.config.gatewayClientConfig;

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
									<Route
										exact
										path="/administration"
										render={() => {
											if (this.props.rights.includes('stream')) {
												return <Redirect to="/administration/connectors" />;
											}
											return <Redirect to="/administration/users" />;
										}}
									/>
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

export default connect(({ user }) => ({ rights: user.user ? user.user.rights : [] }))(App);
