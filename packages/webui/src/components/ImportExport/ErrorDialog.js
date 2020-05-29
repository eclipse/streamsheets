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
/* eslint-disable react/prop-types, react/forbid-prop-types */
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { connect } from 'react-redux';
import * as Actions from '../../actions/actions';

function ErrorDialog(props) {
	const handleConfirm = () => {
		props.setAppState({ errorDialog: { open: false } });
	};
	const { titleId, messageId, open } = props.errorDialog;
	const { intl } = props;
	const title = open && intl.formatMessage({ id: titleId, defaultMessage: 'Error' });
	const message = open && intl.formatMessage({ id: messageId, defaultMessage: 'An error occurred' });

	return (
		<Dialog open={open}>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent
				style={{
					margin: '20px',
				}}
			>
				<DialogContentText>{message}</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button color="primary" onClick={handleConfirm}>
					<FormattedMessage id="OK" defaultMessage="OK" />
				</Button>
			</DialogActions>
		</Dialog>
	);
}

ErrorDialog.propTypes = {
	errorDialog: PropTypes.shape({
		messageId: PropTypes.string,
		titleId: PropTypes.string,
		open: PropTypes.bool,
	}).isRequired,
	// eslint-disable-next-line react/no-typos
	intl: intlShape.isRequired,
};

const mapStateToProps = (state) => ({
	errorDialog: state.appState.errorDialog,
});
const mapDispatchToProps = Actions;

export default injectIntl(
	connect(
		mapStateToProps,
		mapDispatchToProps,
	)(ErrorDialog),
);
