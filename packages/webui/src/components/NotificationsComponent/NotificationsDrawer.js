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
import {FormattedMessage, injectIntl} from 'react-intl';
import * as Colors from '@material-ui/core/colors';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/DeleteForever';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography/Typography';
import * as Actions from '../../actions/actions';
import DateTimeHelper from '../../helper/DateTimeHelper';

const sortNotifications = (a,b) => new Date(b.timestamp) - new Date(a.timestamp);


class NotificationsDrawer extends React.Component {

	handleClear = () => {
		this.props.clearNotifications();
		this.props.setAppState({
			notificationsOpen: false,
			anchorEl: null,
		});
	};

	render() {
		const { notifications } = this.props.notifications;
		return (
			<Drawer
				anchor="right"
				open={this.props.notificationsOpen}
				onClose={() => this.props.setAppState({
					notificationsOpen: false,
					anchorEl: null,
				})}
			>
				<div
					style={{
						width: '100%',
						height: '48px',
						backgroundColor: 'grey',
						display: 'flex',
						justifyContent: 'space-between',
					}}
				>
					<Typography
						variant="h6"
						style={{
							color: 'white',
							padding: '10px 15px',
						}}
					>
						<FormattedMessage id="Notification.list.subheader" defaultMessage="Notifications" />
					</Typography>
					{ notifications.length < 1 ? null : (
						<IconButton
							aria-label="Clean"
							onClick={this.handleClear}
							style={{
								float: 'right',
								color: 'white',
							}}
						>
							<ClearIcon />
						</IconButton>
					) }
				</div>
				<div>
					<List>
						{ notifications.sort(sortNotifications).map(notification => [
							<ListItem divider>
								<ListItemText
									primary={notification.title || 'System'}
									secondary={
										<React.Fragment>
											<div style={{ maxWidth: '250px' }}>
												<span style={{ color: Colors.grey[900], maxWidth: '250px'  }}>
													{DateTimeHelper.formatTimestamp(notification.timestamp)}
												</span> --
												{notification.message}
											</div>
										</React.Fragment>
									}
								/>
							</ListItem>,
							<Divider variant="inset" />,
						]) }

					</List>
				</div>
			</Drawer>
		);
	}
}


function mapStateToProps(state) {
	return {
		notificationsOpen: state.appState.notificationsOpen,
		notifications: state.notifications,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(NotificationsDrawer));
