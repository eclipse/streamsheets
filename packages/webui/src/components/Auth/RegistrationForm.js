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
import React from 'react';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import OkIcon from '@material-ui/icons/Done';
import { green } from '@material-ui/core/colors';
import { FormattedMessage } from 'react-intl';

export default function RegistrationForm(props) {
	return (
		<React.Fragment>
			{
				props.subscribed ? 
				<Grid container spacing={8}>
					<Grid item xs={12}>
						<OkIcon style={{ color: green[800] }} />
						<div />
						<FormattedMessage id="Setup.Registration.SubcribedSuccessfully" defaultMessage="You are successfully subscribed to our newsletter." />
					</Grid>
				</Grid>
				: <Grid container spacing={8}>
					<Grid item xs={12} sm={6}>
						<TextField
							required
							id="firstName"
							name="firstName"
							label={<FormattedMessage id="Setup.Registration.FirstName" defaultMessage="First name" />}
							fullWidth
							autoComplete="fname"
							value={props.user.firstName}
							onChange={(event) => props.onFirstNameUpdate(event.target.value)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<TextField
							required
							id="lastName"
							name="lastName"
							label={<FormattedMessage id="Setup.Registration.LastName" defaultMessage="Last name" />}
							fullWidth
							autoComplete="lname"
							value={props.user.lastName}
							onChange={(event) => props.onLastNameUpdate(event.target.value)}
						/>
					</Grid>
					<Grid item xs={12}>
						<TextField
							required
							type="email"
							id="email"
							name="email"
							label={<FormattedMessage id="Setup.Registration.EMail" defaultMessage="E-Mail" />}
							fullWidth
							autoComplete="email"
							value={props.user.email}
							onChange={(event) => props.onEmailUpdate(event.target.value)}
						/>
					</Grid>
					<Grid item xs={12} sm={9} />
					<Grid item xs={12} sm={2}>
						<Button
							variant="contained"
							color="primary"
							disabled={!props.user.firstName || !props.user.lastName || !props.user.email}
							onClick={() => props.onNewsletterRegistration()}
						>
							<FormattedMessage
								id="Setup.Registration.RegisterNewsletter"
								defaultMessage="Register newsletter"
							/>
						</Button>
					</Grid>
				</Grid>
			}
		</React.Fragment>
	);
}

RegistrationForm.propTypes = {
	subscribed: PropTypes.bool.isRequired,
	onFirstNameUpdate: PropTypes.func.isRequired,
	onLastNameUpdate: PropTypes.func.isRequired,
	onEmailUpdate: PropTypes.func.isRequired,
	onNewsletterRegistration: PropTypes.func.isRequired,
	user: PropTypes.shape({
		firstName: PropTypes.string.isRequired,
		lastName: PropTypes.string.isRequired,
		email: PropTypes.string.isRequired,
	}).isRequired,
};
