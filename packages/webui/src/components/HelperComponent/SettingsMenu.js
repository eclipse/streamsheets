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
/* eslint-disable react/prop-types */
import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Avatar from '@material-ui/core/Avatar';
import * as Colors from '@material-ui/core/colors';
import {FormattedMessage} from 'react-intl';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Tooltip from '@material-ui/core/Tooltip';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import {Assignment, ExitToApp, Info, Security, Settings} from '@material-ui/icons';

import * as Actions from '../../actions/actions';
import {graphManager} from '../../GraphManager';
import {withStyles} from '@material-ui/core/styles';
import {Path} from '../../helper/Path';
import ListItemText from "@material-ui/core/ListItemText";
import {
	getLicenseStreamsheetsInfo,
	getLicenseValidUntil,
	getPremium,
	isPremiumLicense
} from '../../helper/license';


const VERSION = process.env.REACT_APP_VERSION || '2.5';
const BUILD_NUMBER = process.env.REACT_APP_BUILD_NUMBER || 'unknown';


/**
 * A modal dialog can only be closed by selecting one of the actions.
 */
export class SettingsMenu extends React.Component {

	static getDerivedStateFromProps(props, state) {
		const { permissions } = props.adminSecurity;
		const { user } = props.user;
		if (!state.loaded && user && user.settings && permissions.length > 0) {
			return {
				...state,
				loaded: true
			};
		}
		return { ...state };
	}

	constructor(props) {
		super(props);
		this.state = {
			experimental: false,
			theme: localStorage.getItem('theme') ? localStorage.getItem('theme') : 'Default',
			prevLocale: 'en',
			tab: 'status'
		};
		this.showHelpDialog = this.showHelpDialog.bind(this);
		this.logout = this.logout.bind(this);
	}

	showPreferencesDialog = () => {
		this.setState({ prevLocale: this.props.locale });
		this.props.setAppState({
			showLoading: false,
			openMoreSettingMenu: false,
		});
		this.props.setAppState({ openPreferences: true });
	};

	handleOpenAdmin = () => {
		this.props.setAppState({ openMoreSettingMenu: false });
		this.props.openPage(Path.users());
	};

	handlePreferencesCancel = () => {
		this.props.setAppState({ openPreferences: false });
		this.props.setUserSettings({ locale: this.state.prevLocale });
	};

	handlePreferencesSubmit = () => {
		this.props.setAppState({ openPreferences: false });
		const { user } = this.props.user;
		this.props.saveUserSettings(user.settings);
	};

	showHelpDialog = () => {
		this.setState({ experimental: this.props.experimental });
		this.setState({ debug: this.props.debug });
		this.props.setAppState({
			showLoading: false,
			openMoreSettingMenu: false,
		});
		this.props.setAppState({ openHelp: true });
	};

	getLocale = () => {
		return this.props.locale || this.state.prevLocale || 'EN';
	}

	showLicenseAgreement = () => {
		const locale = this.getLocale();
		// window.location.href = `/license_${locale.toUpperCase()}.pdf`;
		window.open(`/license_${locale.toUpperCase()}.pdf`);
	}

	logout = () => {
		this.props.openPage('/logout');
	};

	handleCloseHelp = () => {
		this.props.setAppState({
			showLoading: true,
			experimental: this.state.experimental,
			debug: this.state.debug,
			openHelp: false
		});
		localStorage.setItem('experimental', this.state.experimental);
		if(this.state.debug === true) {
			localStorage.setItem('DLDEBUG', this.state.debug);
		} else {
			localStorage.removeItem('DLDEBUG');
		}
		graphManager.updateDimensions();
	};

	handleExperimental = () => (event, state) => {
		this.setState({ experimental: state });
	};

	handleTabChange = (event, tab) => {
		this.setState({tab})
	};

	async handleLanguageChange(event) {
		const locale = event.target.value;
		this.props.setUserSettings({
			locale,
		});
	}

	handleThemeChange(event) {
		this.setState({theme: event.target.value});
		localStorage.setItem('theme', event.target.value);
		location.reload();
	}

	renderServiceDetails(service) {
		return service && service.instances && Object.keys(service.instances).length > 0 ?
			Object.keys(service.instances).map((key) => {
				const instance = service.instances[key];
				return <TableRow
					key={instance.id}
				>
					<TableCell>
						<strong>{service.name}</strong>
					</TableCell>
					<TableCell>{service.version}</TableCell>
					<TableCell>{instance.status === 'running' ? <CheckCircleIcon style={{color: 'green'}} /> : ''}</TableCell>
					{/* <TableCell>{instance.id}</TableCell> */}
				</TableRow>
			}
			)
			: <TableRow>
				<TableCell>N/A</TableCell>
				<TableCell>N/A</TableCell>
				{/* <TableCell>N/A</TableCell> */}
				<TableCell>N/A</TableCell>
				{/* <TableCell>N/A</TableCell> */}
			</TableRow>
	}

	render() {
		const { displayName } = JSON.parse(localStorage.getItem('user')) || {};
		const { user } = this.props.user;
		const { licenseInfo, services } = this.props.meta;
		return (
			<div
				style={{
					marginLeft: '20px',
				}}
			>
				<Tooltip enterDelay={300} title={<FormattedMessage id="Tooltip.SettingsMenu" defaultMessage="User Settings and Info" />}>
					<div>
						<IconButton
							aria-label="More"
							color="inherit"
							aria-owns={this.props.openMoreSettingMenu ? 'long-menu' : null}
							aria-haspopup="true"
							onClick={(event) =>
								this.props.setAppState({ anchorEl: event.currentTarget, openMoreSettingMenu: true })
							}
						>
							<Avatar alt="User" src="images/avatar.png" />
						</IconButton>
					</div>
				</Tooltip>
				{this.props.openMoreSettingMenu ? (
					<Menu
						id="long-menu"
						anchorEl={this.props.anchorEl}
						open={this.props.openMoreSettingMenu}
						onClose={() => this.props.setAppState({ anchorEl: null, openMoreSettingMenu: false })}
					>
						<Card
							square
							elevation={0}
							style={{
								marginTop: '-8px',
								outline: 'none',
							}}
						>
							<CardHeader
								title={<div style={{ color: Colors.grey[50] }}>{displayName}</div>}
								subheader={
									<address style={{ color: Colors.grey[50] }}>{user ? user.mail : ''}</address>
								}
								avatar={
									<Avatar alt="User" src="images/avatar.png" onClick={this.showPreferencesDialog} />
								}
								disabled
								style={{
									backgroundColor: this.props.theme.overrides.MuiAppBar.colorPrimary.backgroundColor,
									outline: 'none',
								}}
							/>
						</Card>
						<MenuItem dense onClick={this.showPreferencesDialog}>
							<ListItemIcon>
								<Settings />
							</ListItemIcon>
							<ListItemText
								primary={<FormattedMessage id="UserPreferences" defaultMessage="User Preferences" />}
							/>
						</MenuItem>
						{this.props.isAdminPage ? null : (
							<MenuItem dense onClick={this.handleOpenAdmin}>
								<ListItemIcon>
									<Security />
								</ListItemIcon>
								<ListItemText
									primary={<FormattedMessage id="Administration" defaultMessage="Administration" />}
								/>
							</MenuItem>
						)}
						<MenuItem dense onClick={this.showHelpDialog}>
							<ListItemIcon>
								<Info />
							</ListItemIcon>
							<ListItemText primary={<FormattedMessage id="Info" defaultMessage="Info" />} />
						</MenuItem>
						{this.getLocale().toUpperCase() === 'DE' && (
							<MenuItem dense onClick={() => this.showLicenseAgreement('DE')}>
								<ListItemIcon>
									<Assignment />
								</ListItemIcon>
								<ListItemText
									primary={
										<FormattedMessage
											id="Setup.LicenseAgreement.DownloadLicenseDE"
											defaultMessage="Download license"
										/>
									}
								/>
							</MenuItem>
						)}
						{this.getLocale().toUpperCase() === 'EN' && (
							<MenuItem dense onClick={() => this.showLicenseAgreement('EN')}>
								<ListItemIcon>
									<Assignment />
								</ListItemIcon>
								<ListItemText
									primary={
										<FormattedMessage
											id="Setup.LicenseAgreement.DownloadLicenseEN"
											defaultMessage="Download license"
										/>
									}
								/>
							</MenuItem>
						)}
						<Divider />
						<MenuItem dense onClick={this.logout}>
							<ListItemIcon>
								<ExitToApp />
							</ListItemIcon>
							<ListItemText primary={<FormattedMessage id="Logout" defaultMessage="Logout" />} />
						</MenuItem>
					</Menu>
				) : null}
				{this.props.openPreferences ? (
					<Dialog open={this.props.openPreferences} onClose={this.handlePreferencesCancel}>
						<DialogTitle>
							<FormattedMessage id="DialogPreferences.title" defaultMessage="User Preferences" />
						</DialogTitle>
						<DialogContent
							style={{
								minWidth: '350px'
							}}
						>
							<div
								style={{
									position: 'relative'
								}}
							>
								{this.props.showLoading ? (
									<div
										style={{
											width: '100%',
											height: '100%',
											position: 'absolute',
											boxSizing: 'border-box',
											zIndex: 10,
											background: 'rgba(255, 255, 255, 0.8)',
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center'
										}}
									>
										<CircularProgress color={Colors.blue[800]} />
									</div>
								) : null}
								{user && user.settings ? (
									<div style={{ display: 'flex', flexDirection: 'column' }}>
										<FormControl margin="normal">
											<TextField
												variant="outlined"
												size="small"
												select
												value={this.props.locale}
												onChange={(event) => this.handleLanguageChange(event)}
												label={<FormattedMessage id="Language" defaultMessage="Language" />}
											>
												<MenuItem value="en">
													<FormattedMessage id="English" defaultMessage="English" />
												</MenuItem>
												<MenuItem value="de">
													<FormattedMessage id="German" defaultMessage="German" />
												</MenuItem>
											</TextField>
										</FormControl>
										<FormControl margin="normal">
											<TextField
												id="theme-selection"
												value={this.state.theme}
												select
												variant="outlined"
												size="small"
												onChange={(event) => this.handleThemeChange(event)}
												inputProps={{
													name: 'theme-selection',
													id: 'theme-selection'
												}}
												label={<FormattedMessage id="Theme" defaultMessage="Theme" />}
											>
												<MenuItem value="Default">
													<FormattedMessage id="Default" defaultMessage="Default" />
												</MenuItem>
												<MenuItem value="Dark">
													<FormattedMessage id="Dark" defaultMessage="Dark" />
												</MenuItem>
											</TextField>
										</FormControl>
									</div>
								) : null}
							</div>
						</DialogContent>
						<DialogActions>
							<Button color="primary" onClick={this.handlePreferencesCancel}>
								<FormattedMessage id="Cancel" defaultMessage="Cancel" />
							</Button>
							<Button color="primary" onClick={this.handlePreferencesSubmit}>
								<FormattedMessage id="OK" defaultMessage="OK" />
							</Button>
						</DialogActions>
					</Dialog>
				) : null}
				{this.props.openHelp ? (
				<Dialog open={this.props.openHelp} onClose={this.handleCloseHelp} >
					<DialogTitle>
						<FormattedMessage id="Product.name" defaultMessage="Streamsheets" />{' '}
						<FormattedMessage id="Version" defaultMessage="Version"	/> {' '} {VERSION}
					</DialogTitle>
					<DialogContent
						style={{
							width: '470px'
						}}
					>

						{licenseInfo && (
							<Table size="small">
								<TableBody>
									<TableRow>
										<TableCell>
											<b>
												<FormattedMessage
													id="License.edition"
													defaultMessage="Edition"
												/>
											</b>
										</TableCell>
										<TableCell>
											{isPremiumLicense(licenseInfo) ? getPremium() : licenseInfo.edition}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>
											<b>
												<FormattedMessage
													id="BuildNumber"
													defaultMessage="BuildNumber"
												/>
											</b>
										</TableCell>
										<TableCell>{BUILD_NUMBER}</TableCell>
									</TableRow>
									{isPremiumLicense(licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.validUntil"
														defaultMessage="License valid until"
													/>
												</b>
											</TableCell>
											<TableCell>{getLicenseValidUntil(licenseInfo.daysLeft)}</TableCell>
										</TableRow>
									)}
									{isPremiumLicense(licenseInfo) && (
										<TableRow>
											<TableCell>
												<b>
													<FormattedMessage
														id="License.Info.Streamsheets.max"
														defaultMessage="Maximum number of Streamsheets"
													/>
												</b>
											</TableCell>
											<TableCell>{getLicenseStreamsheetsInfo(licenseInfo)}</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
					)}
						<br />
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>
										<FormattedMessage id="Component" defaultMessage="Component" />
									</TableCell>
									<TableCell>
										<FormattedMessage id="Version" defaultMessage="Version" />
									</TableCell>
									<TableCell>
										<FormattedMessage id="Status" defaultMessage="Status" />
									</TableCell>
									{/* <TableCell>
										<FormattedMessage
											id="Instances"
											defaultMessage="Instances"
										/>
									</TableCell> */}
								</TableRow>
							</TableHead>
							<TableBody>
								{/* TODO: make this table more generic to display any number of services */}
								<TableRow>
									<TableCell><strong>Web UI</strong></TableCell>
									<TableCell>{VERSION}</TableCell>
									{/* <TableCell>{BUILD_NUMBER}</TableCell> */}
									<TableCell>
										<CheckCircleIcon style={{color: 'green'}}/>
									</TableCell>
									{/* <TableCell>webui</TableCell> */}
								</TableRow>
								{
									services &&
									Object.values(services)
										.sort((a, b) => a.name && a.name.localeCompare(b.name))
										.map((service) => this.renderServiceDetails(service)
									)
								}
							</TableBody>
						</Table>
						<FormControlLabel
							style={{
								marginTop:'10px',
							}}
							control={
								<Checkbox
									checked={this.state.experimental}
									onChange={this.handleExperimental()}
								/>
							}
							label={<FormattedMessage
								id="Settings.ExperimentalFeatures"
								defaultMessage="Experimental Features"
							/>}
						/>
						<FormControlLabel
							style={{
								marginTop:'10px',
							}}
							control={
								<Checkbox
									checked={this.state.debug}
									onChange={() => this.setState({debug: !this.state.debug})}
								/>
							}
							label={<FormattedMessage id="Settings.Debug" defaultMessage="Debug Mode" />}
						/>
					</DialogContent>
					<DialogActions>
						<Button
							color="primary"
							onClick={this.handleCloseHelp}
						>
							<FormattedMessage
								id="Close"
								defaultMessage="Close"
							/>
						</Button>
					</DialogActions>
				</Dialog>
				) : null}
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		anchorEl: state.appState.anchorEl,
		openMoreSettingMenu: state.appState.openMoreSettingMenu,
		experimental: state.appState.experimental,
		debug: state.appState.debug,
		openPreferences: state.appState.openPreferences,
		showLoading: state.appState.showLoading,
		openHelp: state.appState.openHelp,
		machine: state.machine,
		monitor: state.monitor,
		meta: state.meta,
		user: state.user,
		adminSecurity: state.adminSecurity,
		locale: state.locales.locale
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(Actions, dispatch);
}

export default withStyles({}, { withTheme: true })(connect(mapStateToProps, mapDispatchToProps)(SettingsMenu));
