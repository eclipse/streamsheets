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
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import LinearProgress from '@material-ui/core/LinearProgress';
import { accessManager } from '../../helper/AccessManager';


class NotAuthorizedComponent extends React.Component {
	static propTypes = {
		style: PropTypes.object,
	//	target: PropTypes.string.isRequired,
	};
	static defaultProps = {
		style: {
			fontSize: '2rem',
			textAlign: 'center',
			color: 'red',
			border: 'red dotted',
			padding: '5px',
			margin: '15px',
		},
	};

	render() {
		if (!accessManager.ready) return (<LinearProgress />);
		return (
			<div style={this.props.style}>
				<FormattedMessage
					id="Admin.notAuthorized"
					defaultMessage="Not Authorized"
				/>
			</div>
		);
	}
}
export default NotAuthorizedComponent;
