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
/* eslint-disable react/forbid-prop-types */

import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';

import {intl} from '../../../helper/IntlGlobalProvider';

class CustomTooltip extends React.Component {
	static propTypes = {
		header: PropTypes.string.isRequired,
		message: PropTypes.string.isRequired,
		messageValues: PropTypes.object,
	};

	static defaultProps = {
		messageValues: {},
	};

	state = {
		open: false,
	};

	onMouseDown = () => {
		this.setState({ open: false });
	}

	handleOpen = () => {
		this.setState({ open: true });
		document.addEventListener('mousedown', this.onMouseDown, false);
	};

	handleClose = () => {
		this.setState({ open: false });
		document.removeEventListener('mousedown', this.onMouseDown, false);
	};

	render() {
		const { message, header, messageValues } = this.props;
		return (
			<Tooltip
				enterDelay={300}
				onOpen={() => this.handleOpen()}
				onClose={() => this.handleClose()}
				open={ this.state.open }
				title={
					<React.Fragment>
						<div style={{
							fontWeight: 'bold',
							marginBottom: '8px',
						}}
						>
							 {intl.formatMessage({id: header}, {})}
						</div>
						<div color="transparent">
							 {intl.formatMessage({id: message}, messageValues)}
						</div>
					</React.Fragment>
				}
			>
				<div style={{ border: '0', display: 'inline' }} >
					{this.props.children}
				</div>
			</Tooltip>
		);
	}
}

export default CustomTooltip;
