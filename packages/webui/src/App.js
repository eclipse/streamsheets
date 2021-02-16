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
/* eslint-disable react/no-did-mount-set-state */
import React from 'react';
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
import { DashboardPage, ExportPage } from './pages';
import { RoutesExtensions, UserTablePage, CreateUserPage, UpdateUserPage } from '@cedalo/webui-extensions';
import { Path } from './helper/Path';
import { DatabasePage } from './pages/DatabasePage';

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
									<Route exact path="/administration" render={() => <Redirect to={Path.users()} />} />
									{/* <PrivateRoute path="/administration/plugins/" component={DefaultLayout} /> */}
									<PrivateRoute exact path="/administration/users" component={UserTablePage} />
									<PrivateRoute exact path="/administration/users/new" component={CreateUserPage} />
									<PrivateRoute
										exact
										path="/administration/users/:userId([^\/]{4,})"
										component={UpdateUserPage}
									/>
									<PrivateRoute path="/administration/database" component={DatabasePage} />
								</React.Fragment>
							)}

							<RoutesExtensions />

							<PrivateRoute path="/dashboard" component={DashboardPage} />
							<PrivateRoute path="/export" component={ExportPage} />
							<PrivateRoute path="/machines/:machineId" component={MachineDetailPage} />
							<Route path="/machines/:machineId/:userId/:token" component={MachineDetailPage} />
						</div>
					)}
				</div>
			</ConnectedRouter>
		);
	}
}

export default App;
