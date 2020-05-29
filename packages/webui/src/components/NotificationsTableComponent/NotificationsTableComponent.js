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
// import * as Colors from '@material-ui/core/styles/colors';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';


import * as Actions from '../../actions/actions';
import DateTimeHelper from '../../helper/DateTimeHelper';

class NotificationsTableComponent extends React.Component {

	componentWillReceiveProps(nextProps) {
		this.setState({
			// eslint-disable-next-line react/no-unused-state
			monitor: nextProps.monitor,
		});
	}

	buildTable(notifications) {
		return notifications.map(notification => (
			<TableRow selectable={false}>
				<TableCell>{notification.icon}</TableCell>
				<TableCell>{notification.title}</TableCell>
				<TableCell>{notification.message}</TableCell>
				<TableCell>{DateTimeHelper.formatTimestamp(notification.timestamp)}</TableCell>
			</TableRow>));
	}

	render() {
		// eslint-disable-next-line
		return (
			<Table selectable={false}>
				<TableHead adjustForCheckbox={false} displaySelectAll={false}>
					<TableRow>
						<TableCell />
						<TableCell>Title</TableCell>
						<TableCell>Message</TableCell>
						<TableCell>Timestamp</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{
						this.buildTable(this.props.notifications.notifications || [])
					}
				</TableBody>
			</Table>
		);
	}
}

function mapStateToProps(state) {
	return {
		notifications: state.notifications,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationsTableComponent);
