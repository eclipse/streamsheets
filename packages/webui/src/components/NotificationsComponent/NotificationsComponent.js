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
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';
// import ReactMaterialUiNotifications from 'react-materialui-notifications';
import Notifications from '@material-ui/icons/Notifications';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { NotificationContainer } from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import { FormattedMessage } from 'react-intl';
import Tooltip from '@material-ui/core/Tooltip';

import * as Actions from '../../actions/actions';
import NotificationsDrawer from './NotificationsDrawer';

class NotificationsComponent extends React.Component {
	render() {
		return (
			<div>
				<Tooltip enterDelay={300} title={<FormattedMessage id="Tooltip.Notifications" defaultMessage="Notifications" />}>
					<div>
						<IconButton
							onClick={event => this.props.setAppState({
								notificationsOpen: true,
								anchorEl: event.currentTarget,
							})}
							disabled={this.props.notifications.notifications.length === 0}
							style={{ color: `rgba(255, 255, 255, ${this.props.notifications.notifications.length === 0 ? 0.3 : 1})` }}
							color="inherit"
						>
							<Badge
								badgeContent={this.props.notifications.notifications.length}
								color="secondary"
								style={{
									visibility: this.props.showTools &&
									this.props.notifications.notifications.length ? 'visible' : 'hidden',
								}}
							>
								<Notifications color="inherit" />
							</Badge>
						</IconButton>
					</div>
				</Tooltip>
				<NotificationsDrawer />
				<NotificationContainer />
				{
					/*
				<ReactMaterialUiNotifications
					desktop
					transitionName={{
						leave: 'fadeOut',
						leaveActive: 'fadeOut',
						appear: 'zoomInUp',
						appearActive: 'zoomInUp',
					}}
					transitionAppear
					transitionLeave
				/>
					 */
				}

			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		showTools: state.appState.showTools,
		machine: state.machine,
		notifications: state.notifications,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationsComponent);
