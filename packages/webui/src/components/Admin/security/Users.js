/* eslint-disable react/no-unused-state,no-unused-vars,react/prop-types,react/sort-comp */
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import IconUser from '@material-ui/icons/Person';
import { FormattedMessage } from 'react-intl';

import NotAuthorizedComponent from '../../Errors/NotAuthorizedComponent';
import CombinedResourceListing
	from '../../base/listing/CombinedResourceListing';
import * as Actions from '../../../actions/actions';
import { accessManager } from '../../../helper/AccessManager';
import styles from './styles';
import AdminConstants from '../../../constants/AdminConstants';
import Constants from '../../../constants/Constants';
import { intl } from '../../../helper/IntlGlobalProvider';
import { formatDateString } from '../../base/listing/Utils';
import StreamHelper from '../../../helper/StreamHelper';

const { RESOURCE_TYPES, RESOURCE_ACTIONS } = accessManager;

const fields = [
	{
		label: <FormattedMessage id="Admin.userName"
		                         defaultMessage="Username"/>,
		key: 'userId',
	},
	{
		label: <FormattedMessage id="Admin.mail"
		                         defaultMessage="Email address"/>,
		key: 'mail',
	},
	{
		label: <FormattedMessage id="Admin.firstName"
		                         defaultMessage="First Name"/>,
		key: 'firstName',
	},
	{
		label: <FormattedMessage id="Admin.secondName"
		                         defaultMessage="Last Name"/>,
		key: 'secondName',
	},
	{ label: <FormattedMessage id="Admin.lastModified" defaultMessage="Last Modified" />, key: 'lastModified_formatted' },
];

const { headerBackgroundColor } = AdminConstants.GRID_CONFIG.User;

class Users extends Component {
	static getDerivedStateFromProps(nextProps, prevState) {
		nextProps.setPageSelected('users');
		return prevState;
	}

	handleNew = (event) => {
		event.preventDefault();
		this.props.openUser({ userId: null });
	};

	handleClose = () => {
		this.setState({ anchorEl: null });
	};

	onMenuSelect = async (optionIndex, resourceId) => {
		switch (optionIndex) {
			case Constants.RESOURCE_MENU_IDS.EDIT:
				window.open(`/administration/user/${resourceId}`);
				break;
			case Constants.RESOURCE_MENU_IDS.DELETE: {
				const adminUser = StreamHelper.getAdminUser(this.props);
				if (adminUser && resourceId === adminUser.userId) {
					this.props.setFormFeedback({
						title: 'Delete User',
						error: AdminConstants.ADMIN_SECURITY.ERROR_REMOVE_DENIED,
						message: intl.formatMessage(
							{ id: AdminConstants.ADMIN_SECURITY.ERROR_REMOVE_DENIED },
							{ name: AdminConstants.ADMIN_SECURITY.ERROR_REMOVE_DENIED },
						),
					});
				} else {
					const res = await this.props.removeUserByUserId(resourceId);
					if (!res.ok) {
						this.props.setFormFeedback({
							title: 'Delete User',
							error: res.error,
							message: res.error,
						});
					}
				}
				break;
			}
			default:
		}
		this.setState({ anchorEl: null });
	};

	onFilter = (filter, resources) => resources;

	onResourceOpen = (user) => {
		this.props.openUser(user);
	};

	handleClick = (event, id) => {
		this.setState({
			anchorEl: event.currentTarget,
			selectedId: id,
		});
	};

	handleResourceDetails = resource => (
		<div>
			<Typography
				style={{
					paddingBottom: '15px',
				}}
			>
				email: {resource.email}
			</Typography>
		</div>);

	enrichResources = (resources) => {
		const newRes = resources.map(u => {
			u.name = u.userId;
			u.lastModified_formatted = formatDateString(u.lastModified);
			return u;
		});
		return newRes;
	};

	render() {
		if (!accessManager.can(RESOURCE_TYPES.SECURITY,
			RESOURCE_ACTIONS.VIEW)) {
			return <NotAuthorizedComponent
				target={accessManager.PERMISSIONS.SECURITY_VIEW}/>;
		}
		const { security } = this.props;
		const resources = security.users.map(
			u => ({ ...u, id: u.userId, lastModified_formatted: formatDateString(u.lastModified) }));
		const canEdit = accessManager.can(RESOURCE_TYPES.USER,
			RESOURCE_ACTIONS.EDIT);
		const canDelete = accessManager.can(RESOURCE_TYPES.USER,
			RESOURCE_ACTIONS.DELETE);
		const options = [];
		if (canEdit) {
			options.push({
				label: <FormattedMessage id="Admin.edit"
				                         defaultMessage="Edit"/>,
				value: Constants.RESOURCE_MENU_IDS.EDIT,
			});
		}
		if (canDelete) {
			options.push({
				label: <FormattedMessage id="Admin.delete"
				                         defaultMessage="Delete"/>,
				value: Constants.RESOURCE_MENU_IDS.DELETE,
			});
		}
		return (
			<div>
				<CombinedResourceListing
					type="admin"
					fields={fields}
					label={<FormattedMessage
						id="Admin.users"
						defaultMessage="Users"
					/>}
					titleAttribute="userId"
					resources={resources}
					icon={<IconUser/>}
					menuOptions={options}
					onFilter={this.onFilter}
					onMenuSelect={this.onMenuSelect}
					onResourceOpen={this.onResourceOpen}
					handleResourceDetails={this.handleResourceDetails}
					headerBackgroundColor={headerBackgroundColor}
					handleNew={accessManager.can(RESOURCE_TYPES.USER,
						RESOURCE_ACTIONS.CREATE) ? this.handleNew : false}
					filterName
					enrichResources={this.enrichResources}
				/>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		appState: state.appState,
		security: state.adminSecurity,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(
	connect(mapStateToProps, mapDispatchToProps)(Users));
