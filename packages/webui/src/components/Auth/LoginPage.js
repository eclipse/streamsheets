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
/* eslint-disable react/forbid-prop-types */
import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LinearProgress from '@material-ui/core/LinearProgress';
import ErrorIcon from '@material-ui/icons/Error';
import { FormattedMessage } from 'react-intl';
import { logout, login } from '../../actions/actions';

import theme from '../../theme';
import ConfigManager from '../../helper/ConfigManager';

const CONFIG = ConfigManager.config.gatewayClientConfig;

const styles = {
	actions: {
		display: 'flex',
	},
	expand: {
		transform: 'rotate(0deg)',
		marginLeft: 'auto',
		transition: theme.transitions.create('transform', {
			duration: theme.transitions.duration.shortest,
		}),
	},
	expandOpen: {
		transform: 'rotate(180deg)',
	},
};
const AUTH_URL = `${CONFIG.restEndpointURL}/auth/provider/`;
const ALL_PROVIDERS = [
	{
		id: 'ldap',
		text: 'LDAP',
		type: 'form',
	},
	{
		id: 'github',
		text: 'Github',
	},
	{
		id: 'google',
		text: 'google',
	},
	{
		id: 'openid',
		text: 'openid',
	},
	{
		id: 'oauth2',
		text: 'oauth2',
	},
	{
		id: 'hydra',
		text: 'Hydra',
	},
];

class LoginPage extends React.Component {
	static propTypes = {
		login: PropTypes.func.isRequired,
		classes: PropTypes.object.isRequired,
		// logout: PropTypes.func.isRequired,
	};

	constructor(props) {
		super(props);
		// const token = localStorage.getItem('jwtToken');
		// reset login status
		// this.props.logout(token);
		this.state = {
			username: '',
			password: '',
			providerId: 'internal',
			expanded: false,
			error: false,
			socketEndpointURL: CONFIG.socketEndpointURL,
			restEndpointURL: CONFIG.restEndpointURL,
			providers: []
		};
		this.handleLogin = this.handleLogin.bind(this);
	}

	componentDidMount() {
		if(!this.config) {
			ConfigManager.loadConfig().then(conf => {
				const providers = ALL_PROVIDERS.filter((p) => conf.authProviders.includes(p.id));
				this.setState({providers});
			});
			// eslint-disable-next-line react/no-did-mount-set-state
		}
		const params = new URLSearchParams(window.location.search);
		const token = params.get('token');
		const userId = params.get('userId');
		if (token) {
			localStorage.removeItem('jwtToken');
			localStorage.removeItem('user');
			const url = params.get('url') || '/dashboard';
			this.loginUI(token, userId, url);
		}
		const existingToken = localStorage.getItem('jwtToken');
		if(existingToken){
			const redirect = params.get('redirect');
			window.location = redirect ? decodeURIComponent(redirect) :'/dashboard';
		}
	}

	async handleLogin(e, pId, redirect) {
		if(e.preventDefault) {
			e.preventDefault();
		}
		const { username, password, providerId } = this.state;
		if (username && password) {
			try {
				const resp = await this.props.login({
					username,
					password,
					providerId: pId || providerId,
				}, redirect);
				this.setState({ error: resp.error });
			} catch (err) {
				this.setState({ error: err });
			}
		} else {
			this.setState({ error: 'INVALID' });
		}
	}

	loginUI(token, userId, url = '/dashboard') {
		localStorage.setItem('jwtToken', token);
		localStorage.setItem(
			'user',
			JSON.stringify({
				id: userId,
			}),
		);
		window.location = url;
	}

	handleExpandClick = () => {
		this.setState((state) => ({ expanded: !state.expanded }));
	};

	handleProviderChange = (event) => {
		const providerId = event.target.value;
		const provider = this.state.providers.find((p) => p.id === providerId);
		if (provider && !provider.type) {
			window.location.href = `${AUTH_URL}${providerId}`;
		} else {
			this.setState({ providerId });
		}
		if (provider.type === 'form') {
			this.forceUpdate();
			this.handleLogin(event, providerId);
		}
	};

	render() {
		const params = new URLSearchParams(window.location.search);
		const token = params.get('token');
		const redirect = params.get('redirect');
		const { classes } = this.props;
		// eslint-disable-next-line react/prop-types
		let { error } = this.state;
		error = error || params.get('error');
		return (
			<MuiThemeProvider theme={theme}>
				<div
					style={{
						width: '100vw',
						height: '100vh',
						backgroundSize: '100% 100%',
						backgroundImage: 'url(images/mainbg.jpg)',
					}}
				>
					{token ? (
						<LinearProgress thickness={30} />
					) : (
						<div
							style={{
								width: '100vw',
								height: '100vh',
								backgroundImage: 'url(images/loginbg.png)',
							}}
						>
							<Card
								style={{
									width: '400px',
									top: '30%',
									left: '50%',
									marginLeft: '-200px',
									position: 'relative',
								}}
							>
								<CardContent>
									<h2>
										<FormattedMessage id="Login.title" defaultMessage="Login" />
									</h2>
									{!error ? null : (
										<div
											style={{
												color: '#D8000C',
												backgroundColor: '#FFD2D2',
												margin: '4px',
												border: 'dotter red 2px',
											}}
										>
											<ErrorIcon />
											<span
												style={{
													margin: '0px 3px',
													top: '-5px',
													position: 'relative',
													fontWeight: 'bolder',
												}}
											>
												{error}
											</span>
										</div>
									)}

									<form name="form">
										<TextField
											fullWidth
											hinttext={<FormattedMessage id="Login.userHint" defaultMessage="Login" />}
											required
											error={error}
											label={<FormattedMessage id="Login.userName" defaultMessage="Username" />}
											value={this.state.username}
											onChange={(event) => this.setState({ username: event.target.value })}
										/>
										<br />
										<TextField
											fullWidth
											type="password"
											hinttext="Enter your Password"
											required
											error={error}
											label={<FormattedMessage id="Login.password" defaultMessage="Password" />}
											value={this.state.password}
											onChange={(event) => this.setState({ password: event.target.value })}
										/>
										<Divider variant="inset" component="br"/>
										<Button
											fullWidth
											color="primary"
											variant="text"
											type="submit"
											size="large"
											onClick={(event) => this.handleLogin(event, undefined, redirect)}
										>
											<FormattedMessage id="Login" defaultMessage="Login" />
										</Button>

									</form>
								</CardContent>
								<CardActions className={classes.actions} disableActionSpacing>
									<IconButton
										className={classnames(classes.expand, {
											[classes.expandOpen]: this.state.expanded,
										})}
										onClick={this.handleExpandClick}
									>
										<ExpandMoreIcon />
									</IconButton>
								</CardActions>
								<Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
									<CardContent>
										<TextField
											fullWidth
											type="text"
											hinttext="Enter the Socket API URL"
											required
											label={
												<FormattedMessage id="Label.SocketAPI" defaultMessage="Socket API" />
											}
											value={this.state.socketEndpointURL}
											onChange={(event) => {
												CONFIG.socketEndpointURL = event.target.value;
												this.setState({ socketEndpointURL: event.target.value });
												localStorage.setItem('socketEndpointURL', event.target.value);
											}}
										/>
										<br />
										<TextField
											fullWidth
											type="text"
											hinttext="Enter the REST API URL"
											required
											label={<FormattedMessage id="Label.RESTAPI" defaultMessage="REST API" />}
											value={this.state.restEndpointURL}
											onChange={(event) => {
												CONFIG.restEndpointURL = event.target.value;
												this.setState({ restEndpointURL: event.target.value });
												localStorage.setItem('restEndpointURL', event.target.value);
											}}
										/>
									</CardContent>
								</Collapse>
							</Card>
						</div>
					)}
				</div>
			</MuiThemeProvider>
		);
	}
}
function mapStateToProps(state) {
	return {
		user: state.user,
	};
}
const mapDispatchToProps = {
	logout,
	login
};
export default withStyles(styles)(
	connect(
		mapStateToProps,
		mapDispatchToProps,
	)(LoginPage),
);
