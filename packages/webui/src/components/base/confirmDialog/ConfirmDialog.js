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
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import { FormattedMessage } from 'react-intl';

class
	ConfirmDialog extends React.Component {
	static propTypes = {
		open: PropTypes.bool,
		onConfirm: PropTypes.func.isRequired,
		onCancel: PropTypes.func.isRequired,
		title: PropTypes.element.isRequired,
		content: PropTypes.element,
		style: PropTypes.object,
	};
	static defaultProps = {
		content: '',
		style: {
			content: {
				margin: '20px 10px 10px 5px',
			},
			title: {
			},
		},
		open: false,
	};

	onConfirm = (event) => this.props.onConfirm(event);
	onCancel = (event) => this.props.onCancel(event);

	render() {
		const {
			title, content, style, open,
		} = this.props;
		return (
			<div>
				<Dialog
					open={open}
				>
					<DialogTitle style={style.title}>{title}</DialogTitle>
					<DialogContent style={style.content}>
						{ content }
					</DialogContent>
					<DialogActions>
						<Button onClick={this.onCancel} color="primary">
							<FormattedMessage
								id="Cancel"
								defaultMessage="Cancel"
							/>
						</Button>
						<Button
							data-action="confirm"
							onClick={this.onConfirm}
							color="primary"
							autoFocus
						>
							<FormattedMessage
								id="Confirm"
								defaultMessage="Confirm"
							/>
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		);
	}
}
export default ConfirmDialog;
