/* eslint-disable react/no-unused-state */
/* eslint-disable react/prop-types */
import * as Colors from '@material-ui/core/colors';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SvgIcon from '@material-ui/core/SvgIcon';
import Divider from '@material-ui/core/Divider';
import DeleteIcon from '@material-ui/icons/Delete';
import AdminAppIcon from '@material-ui/icons/Security';
import DashboardIcon from '@material-ui/icons/ViewList';
import NewIcon from '@material-ui/icons/NoteAdd';
import CloneIcon from '@material-ui/icons/FileCopy';
import OpenIcon from '@material-ui/icons/OpenInBrowser';
import SettingsIcon from '@material-ui/icons/Settings';
import MenuItem from '@material-ui/core/MenuItem';
import Drawer from '@material-ui/core/Drawer';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { FormattedMessage } from 'react-intl';
import { accessManager, RESOURCE_ACTIONS, RESOURCE_TYPES, PERMISSIONS } from '../../helper/AccessManager';
import * as Actions from '../../actions/actions';
import { Restricted } from '../HelperComponent/Restricted';

export class MainDrawer extends Component {
	state = {
		adminOpen: false,
	};

	setAppState(state) {
		this.props.setAppState(state);
	}

	handleNew = () => {
			this.props.getDataStores()
			.then(() =>
				this.setAppState({
					drawerOpen: false,
					showNewDialog: true,
				}),
			);
	};

	handleExport = () => {
		this.setAppState({
			drawerOpen: false,
		});
		this.props.openExport(this.props.machineId);
	};

	handleOpen = () => {
		this.props.getMachines().then(() =>
			this.setAppState({
				drawerOpen: false,
				showOpenDialog: true,
			}),
		);
	};

	handleImport = () => {
		this.props.showStartImportDialog();
		this.setAppState({
			drawerOpen: false,
		});
	};

	handleOpenPreview = () => {
		window.open(`${window.location.href}?viewmode=sheet&hideheader&hidegrid`, 'newwindow',
			`width=${window.innerWidth},height=${window.outerHeight - 290}`);
		this.setAppState({
			drawerOpen: false,
		});
	};

	handleOpenAdmin = () => {
		this.setAppState({
			drawerOpen: false,
		});
		window.open('/administration');
	};

	handleSaveAs = () => {
		this.setAppState({
			drawerOpen: false,
			showSaveAsDialog: true,
		});
	};

	handleOpenDashboard = () => {
		this.props.openDashboard(this.props.machineId);
		this.setAppState({
			drawerOpen: false,
		});
	};

	handleAdminMenu = () => {
		this.setState({ adminOpen: !this.state.adminOpen });
	};

	showSettingsDialog = () => {
		this.setAppState({
			drawerOpen: false,
			openSettings: true,
		});
	};

	showDeleteMachineDialog = () => {
		this.setAppState({
			drawerOpen: false,
			showDeleteMachineDialog: true,
		});
	};

	render() {
		const { user } = this.props.user;
		const canEdit = accessManager.canViewUI(accessManager.PERMISSIONS.MACHINE_EDIT);
		if (!user) return null;
		return (
			<Drawer
				width={300}
				open={this.props.open}
				onClose={() => this.setAppState({ drawerOpen: false })}
			>
				<div
					style={{
						height: '18px',
						padding: '20px',
						backgroundColor: Colors.blue[800],
					}}
				>
					<span
						style={{
							color: 'white',
						}}
					>
						<FormattedMessage id="MainTitle" defaultMessage="Stream Machine" />
					</span>
				</div>
				<Restricted permission={PERMISSIONS.MACHINE_ADD}>
					<MenuItem onClick={this.handleNew}>
						<ListItemIcon>
							<NewIcon />
						</ListItemIcon>
						<FormattedMessage id="New" defaultMessage="New" />
					</MenuItem>
				</Restricted>
				<Restricted permission={PERMISSIONS.MACHINE_VIEW}>
					<MenuItem onClick={this.handleOpen}>
						<ListItemIcon>
							<OpenIcon />
						</ListItemIcon>
						<FormattedMessage id="Open" defaultMessage="Open" />
					</MenuItem>
				</Restricted>
				{this.props.isMachineDetailPage ? (
					<div>
						<Restricted permission={PERMISSIONS.MACHINE_ADD}>
							<MenuItem onClick={() => this.handleSaveAs()}>
								<ListItemIcon>
									<CloneIcon />
								</ListItemIcon>
								<FormattedMessage id="SaveCopyAs" defaultMessage="Save Copy As" />
							</MenuItem>
						</Restricted>
					</div>
				) : null}
				<Restricted type={RESOURCE_TYPES.MACHINE} action={RESOURCE_ACTIONS.DELETE}>
					{this.props.isMachineDetailPage && canEdit ? (
						<MenuItem onClick={() => this.showDeleteMachineDialog()}>
							<ListItemIcon>
								<DeleteIcon />
							</ListItemIcon>
							<FormattedMessage id="DeleteMenu" defaultMessage="Delete..." />
						</MenuItem>
					) : null}
				</Restricted>
				<Divider />
				<Restricted
					oneOf={[
						{ type: RESOURCE_TYPES.STREAM, action: RESOURCE_ACTIONS.CREATE },
						{ type: RESOURCE_TYPES.MACHINE, action: RESOURCE_ACTIONS.CREATE },
					]}
				>
					<MenuItem onClick={() => this.handleImport()}>
						<ListItemIcon>
							<SvgIcon>
								<path
									fill="#757575"
									// eslint-disable-next-line max-len
									d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"
								/>
							</SvgIcon>
						</ListItemIcon>
						<FormattedMessage id="Import" defaultMessage="Import" />
					</MenuItem>
				</Restricted>
				<Restricted
					oneOf={[
						{ type: RESOURCE_TYPES.STREAM, action: RESOURCE_ACTIONS.VIEW },
						{ type: RESOURCE_TYPES.MACHINE, action: RESOURCE_ACTIONS.VIEW },
					]}
				>
					<MenuItem onClick={() => this.handleExport()}>
						<ListItemIcon>
							<SvgIcon>
								<path
									fill="#757575"
									// eslint-disable-next-line max-len
									d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"
								/>
							</SvgIcon>
						</ListItemIcon>
						<FormattedMessage id="Export" defaultMessage="Export" />
					</MenuItem>
				</Restricted>
				{this.props.isMachineDetailPage && canEdit ? (
					<div>
						<Divider />
						<MenuItem onClick={() => this.showSettingsDialog()}>
							<ListItemIcon>
								<SettingsIcon />
							</ListItemIcon>
							<FormattedMessage id="Preferences" defaultMessage="Preferences" />
						</MenuItem>
					</div>
				) : null}
				<Divider />
				<MenuItem onClick={this.handleOpenDashboard}>
					<ListItemIcon>
						<DashboardIcon />
					</ListItemIcon>
					<FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
				</MenuItem>
				{!accessManager.canViewCompositeUI(accessManager.PERMISSIONS.ADMINISTRATION) || process.env.REACT_APP_HIDE_ADMIN ? null : (
					<MenuItem onClick={this.handleOpenAdmin}>
						<ListItemIcon>
							<AdminAppIcon />
						</ListItemIcon>
						<FormattedMessage id="Administration" defaultMessage="Administration" />
					</MenuItem>
				)}
				{this.props.isMachineDetailPage ? (
					<MenuItem onClick={this.handleOpenPreview}>
						<ListItemIcon>
							<SvgIcon>
								<path
									fill="#757575"
									// eslint-disable-next-line max-len
									d="M12 5.5L10 8H14L12 5.5M18 10V14L20.5 12L18 10M6 10L3.5 12L6 14V10M14 16H10L12 18.5L14 16M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3M21 19H3V5H21V19Z"
								/>
							</SvgIcon>
						</ListItemIcon>
						<FormattedMessage id="UserPreview" defaultMessage="User Preview" />
					</MenuItem>
				) : null}
			</Drawer>
		);
	}
}

function mapStateToProps(state) {
	return {
		open: state.appState.drawerOpen,
		machineId: state.monitor.machine.id,
		user: state.user,
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(MainDrawer);
