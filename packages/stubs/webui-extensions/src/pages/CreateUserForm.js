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
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { userShape } from './UserPropTypes';

export const CreateUserForm = (props) => {
	const {
		user,
		errors,
		valid,
		disabled,
		pristine,
		passwordConfirmation,
		intl,
		onUsernameUpdate,
		onPasswordUpdate,
		onPasswordConfirmationUpdate,
		onCancel,
		onSubmit
	} = props;

	const errorsMappings = {
		USERNAME_REQUIRED: intl.formatMessage({ id: 'Admin.User.errorUsernameRequired' }, {}),
		USERNAME_IN_USE: intl.formatMessage({ id: 'Admin.User.errorUsernameInUse' }, {}),
		USERNAME_INVALID: intl.formatMessage({ id: 'Admin.User.errorUsernameInvalid' }, {}),
		UNEXPECTED_ERROR: intl.formatMessage({ id: 'Admin.User.errorUnexpected' }, {}),
		PASSWORD_DONT_MATCH: intl.formatMessage({ id: 'Admin.User.errorPasswordsDontMatch' }, {})
	};

	const getError = (code) => (code ? errorsMappings[code] || errorsMappings.UNEXPECTED_ERROR : undefined);

	return (
		<form>
			<Grid container spacing={16}>
				<Grid item container spacing={8} justify="space-between" alignItems="center">
					<Grid item>
						<Typography variant="h5">
							<FormattedMessage id="Admin.User.add" defaultMessage="Add new user" />
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
				</Grid>
				<Grid item xs={12} sm={12}>
					<TextField
						required
						id="username"
						label={<FormattedMessage id="Admin.User.labelUsername" defaultMessage="Username" />}
						fullWidth
						error={!!errors.username}
						helperText={getError(errors.username)}
						disabled={disabled}
						value={user.username || ''}
						onChange={(event) => onUsernameUpdate(event.target.value)}
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						required
						id="password"
						label={<FormattedMessage id="Admin.User.labelPassword" defaultMessage="Password" />}
						type="password"
						fullWidth
						disabled={disabled}
						error={!!errors.password}
						value={user.password || ''}
						onChange={(event) => onPasswordUpdate(event.target.value)}
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						required
						id="password-confirmation"
						type="password"
						label={
							<FormattedMessage id="Admin.User.labelPasswordConfirm" defaultMessage="Confirm password" />
						}
						error={!!errors.password}
						helperText={getError(errors.password)}
						fullWidth
						disabled={disabled}
						value={passwordConfirmation || ''}
						onChange={(event) => onPasswordConfirmationUpdate(event.target.value)}
					/>
				</Grid>
				<Grid container item xs={12} justify="flex-end" direction="row">
					<Grid item>
						<Button variant="outlined" disabled={disabled} onClick={onCancel}>
							<FormattedMessage id="Admin.User.buttonCancel" defaultMessage="Cancel" />
						</Button>
					</Grid>
					<Grid item style={{ paddingLeft: '16px' }}>
						<Button
							variant="contained"
							color="primary"
							onClick={onSubmit}
							disabled={pristine || !valid || disabled}
						>
							<FormattedMessage id="Admin.User.buttonAdd" defaultMessage="Add" />
						</Button>
					</Grid>
				</Grid>
			</Grid>
		</form>
	);
};

CreateUserForm.propTypes = {
	user: userShape.isRequired,
	errors: PropTypes.shape({
		username: PropTypes.string,
		password: PropTypes.string
	}).isRequired,
	valid: PropTypes.bool.isRequired,
	disabled: PropTypes.bool.isRequired,
	passwordConfirmation: PropTypes.string.isRequired,
	pristine: PropTypes.bool.isRequired,
	intl: PropTypes.shape({
		formatMessage: PropTypes.func.isRequired
	}).isRequired,
	onUsernameUpdate: PropTypes.func.isRequired,
	onPasswordUpdate: PropTypes.func.isRequired,
	onPasswordConfirmationUpdate: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired
};
