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
import { IconUser } from '@cedalo/webui/src/components/icons';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { userShape } from './UserPropTypes';

export const UpdatePasswordForm = (props) => {
	const {
		user,
		disabled,
		valid,
		errors,
		intl,
		newPassword,
		passwordConfirmation,
		onNewPasswordUpdate,
		onPasswordConfirmationUpdate,
		onSubmit,
		onCancel
	} = props;

	const errorsMappings = {
		EMAIL_INVALID: intl.formatMessage({ id: 'Admin.User.errorEMailInvalid' }, {}),
		EMAIL_IN_USE: intl.formatMessage({ id: 'Admin.User.errorEMailInUse' }, {}),
		EMAIL_REQUIRED: intl.formatMessage({ id: 'Admin.User.errorEMailRequired' }, {}),
		USERNAME_REQUIRED: intl.formatMessage({ id: 'Admin.User.errorUsernameRequired' }, {}),
		USERNAME_IN_USE: intl.formatMessage({ id: 'Admin.User.errorUsernameInUse' }, {}),
		USERNAME_INVALID: intl.formatMessage({ id: 'Admin.User.errorUsernameInvalid' }, {}),
		UNEXPECTED_ERROR: intl.formatMessage({ id: 'Admin.User.errorUnexpected' }, {}),
		PASSWORD_DONT_MATCH: intl.formatMessage({ id: 'Admin.User.errorPasswordsDontMatch' }, {})
	};

	const getError = (code) => (code ? errorsMappings[code] || errorsMappings.UNEXPECTED_ERROR : undefined);

	return (
		<form>
			<Grid container spacing={32}>
				<Grid item container spacing={8} justify="space-between">
					<Grid item>
						<Typography variant="h5" gutterBottom>
							<FormattedMessage id="Admin.User.changePassword" defaultMessage="Change password" />
						</Typography>
					</Grid>
					{errors.form ? (
						<Grid item>
							<Typography color="error" variant="subtitle1">
								{getError(errors.form)}
							</Typography>
						</Grid>
					) : (
						undefined
					)}
					<Grid item>
						<Chip icon={<IconUser />} label={user.username} />
					</Grid>
				</Grid>
				<Grid item xs={12}>
					<TextField
						required
						id="new-password"
						label={<FormattedMessage id="Admin.User.labelNewPassword" defaultMessage="New password" />}
						type="password"
						fullWidth
						error={!!errors.password}
						disabled={disabled}
						value={newPassword}
						onChange={(event) => onNewPasswordUpdate(event.target.value)}
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						required
						id="new-password-confirmation"
						label={
							<FormattedMessage id="Admin.User.labelPasswordConfirm" defaultMessage="Confirm password" />
						}
						type="password"
						fullWidth
						error={!!errors.password}
						helperText={getError(errors.password)}
						disabled={disabled}
						value={passwordConfirmation}
						onChange={(event) => onPasswordConfirmationUpdate(event.target.value)}
					/>
				</Grid>
				<Grid container item spacing={16} xs={12} justify="flex-end" direction="row">
					<Grid item>
						<Button variant="contained" disabled={disabled} onClick={onCancel}>
							<FormattedMessage id="Admin.User.buttonCancel" defaultMessage="Cancel" />
						</Button>
					</Grid>
					<Grid item>
						<Button variant="contained" color="primary" onClick={onSubmit} disabled={!valid || disabled}>
							<FormattedMessage id="Admin.User.buttonSave" defaultMessage="Save" />
						</Button>
					</Grid>
				</Grid>
			</Grid>
		</form>
	);
};

UpdatePasswordForm.propTypes = {
	user: userShape.isRequired,
	valid: PropTypes.bool.isRequired,
	disabled: PropTypes.bool.isRequired,
	newPassword: PropTypes.string.isRequired,
	errors: PropTypes.shape({
		password: PropTypes.string
	}).isRequired,
	intl: PropTypes.shape({
		formatMessage: PropTypes.func.isRequired
	}).isRequired,
	passwordConfirmation: PropTypes.string.isRequired,
	onNewPasswordUpdate: PropTypes.func.isRequired,
	onPasswordConfirmationUpdate: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired
};
