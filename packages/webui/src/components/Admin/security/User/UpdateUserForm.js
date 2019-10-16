import { Button, Chip, FormLabel, Grid, TextField, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { IconUser } from '../../../icons';
import { userShape } from './UserPropTypes';

export const UpdateUserForm = (props) => {
	const {
		originalUser,
		errors,
		user,
		valid,
		disabled,
		pristine,
		intl,
		onUsernameUpdate,
		onEmailUpdate,
		onFirstNameUpdate,
		onLastNameUpdate,
		onCancel,
		onSubmit,
		onChangePassword,
	} = props;

	const errorsMappings = {
		EMAIL_INVALID: intl.formatMessage({ id: 'Admin.User.errorEMailInvalid' }, {}),
		EMAIL_IN_USE: intl.formatMessage({ id: 'Admin.User.errorEMailInUse' }, {}),
		EMAIL_REQUIRED: intl.formatMessage({ id: 'Admin.User.errorEMailRequired' }, {}),
		USERNAME_REQUIRED: intl.formatMessage({ id: 'Admin.User.errorUsernameRequired' }, {}),
		USERNAME_IN_USE: intl.formatMessage({ id: 'Admin.User.errorUsernameInUse' }, {}),
		USERNAME_INVALID: intl.formatMessage({ id: 'Admin.User.errorUsernameInvalid' }, {}),
		UNEXPECTED_ERROR: intl.formatMessage({ id: 'Admin.User.errorUnexpected' }, {}),
		PASSWORD_DONT_MATCH: intl.formatMessage({ id: 'Admin.User.errorPasswordsDontMatch' }, {}),
	};
	
	const getError = (code) => (code ? errorsMappings[code] || errorsMappings.UNEXPECTED_ERROR : undefined);

	return (
		<form>
			<Grid container spacing={32}>
				<Grid item container spacing={8} justify="space-between">
					<Grid item>
						<Typography variant="h5" gutterBottom>
							<FormattedMessage id="Admin.User.update" defaultMessage="Update user" />
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
						
						<Chip icon={<IconUser />} label={originalUser.username} />
					</Grid>
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
						value={user.username}
						onChange={(event) => onUsernameUpdate(event.target.value)}
					/>
				</Grid>
				<Grid item xs={12} sm={12}>
					<TextField
						required
						id="email"
						label={<FormattedMessage id="Admin.User.labelEMail" defaultMessage="E-Mail" />}
						fullWidth
						error={!!errors.email}
						helperText={getError(errors.email)}
						disabled={disabled}
						value={user.email}
						onChange={(event) => onEmailUpdate(event.target.value)}
					/>
				</Grid>
				<Grid item xs={12} sm={6}>
					<TextField
						id="firstName"
						label={<FormattedMessage id="Admin.User.labelFirstName" defaultMessage="First name" />}
						fullWidth
						disabled={disabled}
						value={props.user.firstName}
						onChange={(event) => onFirstNameUpdate(event.target.value)}
					/>
				</Grid>
				<Grid item xs={12} sm={6}>
					<TextField
						id="lastName"
						label={<FormattedMessage id="Admin.User.labelLastName" defaultMessage="Last name" />}
						fullWidth
						disabled={disabled}
						value={props.user.lastName}
						onChange={(event) => onLastNameUpdate(event.target.value)}
					/>
				</Grid>
				<Grid item container xs={12} spacing={16} justify="space-between">
					<Grid item xs={12}>
						<FormLabel>
							<FormattedMessage id="Admin.User.password" defaultMessage="Password" />
						</FormLabel>
					</Grid>
					<Grid item xs={12}>
						<Button variant="outlined" onClick={onChangePassword} disabled={disabled}>
							<FormattedMessage id="Admin.User.buttonChangePassword" defaultMessage="Change password" />
						</Button>
					</Grid>
				</Grid>

				<Grid container item spacing={16} xs={12} justify="flex-end" direction="row">
					<Grid item>
						<Button variant="contained" onClick={onCancel} disabled={disabled}>
							<FormattedMessage id="Admin.User.buttonCancel" defaultMessage="Cancel" />
						</Button>
					</Grid>
					<Grid item>
						<Button
							// className={classes.button}
							variant="contained"
							color="primary"
							onClick={onSubmit}
							disabled={pristine || disabled || !valid}
						>
							<FormattedMessage id="Admin.User.buttonSave" defaultMessage="Save" />
						</Button>
					</Grid>
				</Grid>
			</Grid>
		</form>
	);
};

UpdateUserForm.propTypes = {
	user: userShape.isRequired,
	errors: PropTypes.shape({
		username: PropTypes.string,
		email: PropTypes.string,
	}).isRequired,
	originalUser: userShape.isRequired,
	pristine: PropTypes.bool.isRequired,
	valid: PropTypes.bool.isRequired,
	disabled: PropTypes.bool.isRequired,
	intl: PropTypes.shape({
		formatMessage: PropTypes.func.isRequired,
	}).isRequired,
	onUsernameUpdate: PropTypes.func.isRequired,
	onEmailUpdate: PropTypes.func.isRequired,
	onFirstNameUpdate: PropTypes.func.isRequired,
	onLastNameUpdate: PropTypes.func.isRequired,
	onChangePassword: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
};
