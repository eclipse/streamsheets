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
import { StringUtil } from '@cedalo/util';
import { getDataStores, openPage } from '@cedalo/webui/src/actions/actions';
import { Overlay } from '@cedalo/webui/src/components/HelperComponent/Overlay';
import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';
import { useGraphQL } from '@cedalo/webui/src/helper/Hooks';
import { intl } from '@cedalo/webui/src/helper/IntlGlobalProvider';
import { Path } from '@cedalo/webui/src/helper/Path';
import { AdminPageLayout } from '@cedalo/webui/src/layouts/AdminPageLayout';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import CheckIcon from '@material-ui/icons/Check';
import PropTypes from 'prop-types';
import React, { useEffect, useReducer } from 'react';
import { connect } from 'react-redux';
import { UpdatePasswordForm } from './UpdatePasswordForm';

const QUERY = `
query UpdateUserForm($id: ID!) {
	user(id: $id) {
		id
		username
	}
}
`;

const UPDATE_PASSWORD_MUTATION = `
mutation UpdateUser($id: ID!, $newPassword: String!) {
	updateUserPassword(id: $id, newPassword: $newPassword) {
		success
		code
		fieldErrors {
			password
		}
	}
} 
`;

const hasFieldError = (errors) =>
	Object.entries(errors).filter(([key, value]) => key !== 'form' && !StringUtil.isEmpty(value)).length > 0;

const updateUserReducer = (state, action) => {
	switch (action.type) {
		case 'init':
			return {
				...state,
				user: action.data
			};
		case 'set_password_1':
			return {
				...state,
				newPassword: action.data,
				validationPending: true
			};
		case 'set_password_2':
			return {
				...state,

				confirmation: action.data,
				confirmationPristine: false,
				validationPending: true
			};

		case 'save_password':
			return { ...state, savePending: true };
		case 'saving_success_password':
			return { ...state, savePending: false, saved: true, errors: {} };
		case 'saving_error_password':
			return { ...state, savePending: false, errors: action.data };

		case 'check_passwords':
			return {
				...state,
				validationPending: false,
				errors: {
					password:
						!state.confirmationPristine && state.newPassword && state.newPassword !== state.confirmation
							? 'PASSWORD_DONT_MATCH'
							: undefined
				}
			};
		default:
			throw new Error(`Unkown action '${action.type}'`);
	}
};

export const UpdateUserPageComponent = (props) => {
	const { onCancel, onSubmit, userId } = props;
	const { loading, errors, data } = useGraphQL(QUERY, { id: userId }, [userId]);
	const [state, dispatch] = useReducer(updateUserReducer, {
		newPassword: '',
		confirmation: '',
		user: {},
		confirmationPristine: true,
		validationPending: true,
		errors: {},
		saved: false,
		savePending: false
	});

	useEffect(() => {
		if (data && data.user) {
			const { id, ...user } = data.user;
			dispatch({
				type: 'init',
				data: user
			});
		}
	}, [data]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			dispatch({ type: 'check_passwords' });
		}, 500);
		return () => {
			clearTimeout(timeoutId);
		};
	}, [state.newPassword, state.confirmation]);

	useEffect(() => {
		if (state.saved) {
			setTimeout(() => {
				onSubmit();
			}, 500);
		}
	}, [state.saved]);

	const savePassword = async () => {
		dispatch({ type: 'save_password' });
		try {
			const {
				updateUserPassword: { success, fieldErrors, code, user }
			} = await gatewayClient.graphql(UPDATE_PASSWORD_MUTATION, {
				id: userId,
				newPassword: state.newPassword
			});
			if (success) {
				dispatch({ type: 'saving_success_password', data: user });
			} else if (fieldErrors) {
				dispatch({ type: 'saving_error_password', data: fieldErrors });
			} else {
				dispatch({ type: 'saving_error_password', data: { form: code } });
			}
		} catch (error) {
			dispatch({ type: 'saving_error_password', data: { form: 'UNEXPECTED_ERROR' } });
			console.error(error);
		}
	};

	if (errors) {
		return (
			<div
				style={{
					height: '100%',
					padding: '24px',
					backgroundColor: '#EEE',
					boxSizing: 'border-box',
					overflow: 'auto'
				}}
			>
				{errors.join('\n')}
			</div>
		);
	}

	const showProgress = loading || state.savePending;
	const showSuccess = state.saved;
	const { newPassword, confirmation, validationPending } = state;
	const hasError = hasFieldError(state.errors);
	const hasRequired = newPassword && confirmation;
	const isValid = !!(!hasError && hasRequired && !validationPending);

	return (
		<AdminPageLayout page="users" documentTitle={intl.formatMessage({ id: 'TitleUsers' })}>
			<div
				style={{
					minHeight: '100%',
					padding: '24px'
				}}
			>
				<Paper style={{ padding: '32px', maxWidth: '960px', margin: 'auto', position: 'relative' }}>
					<UpdatePasswordForm
						user={state.user}
						pristine={state.pristine}
						newPassword={state.newPassword}
						passwordConfirmation={state.confirmation}
						disabled={state.savePending}
						valid={isValid}
						errors={state.errors}
						intl={intl}
						onNewPasswordUpdate={(value) => dispatch({ type: 'set_password_1', data: value })}
						onPasswordConfirmationUpdate={(value) => dispatch({ type: 'set_password_2', data: value })}
						onSubmit={savePassword}
						onCancel={onCancel}
					/>
					{showProgress && (
						<Overlay>
							<CircularProgress style={{ width: '24px', height: '24px' }} />
						</Overlay>
					)}
					{showSuccess && (
						<Overlay>
							<CheckIcon color="primary" />
						</Overlay>
					)}
				</Paper>
			</div>
		</AdminPageLayout>
	);
};

UpdateUserPageComponent.propTypes = {
	userId: PropTypes.string.isRequired,
	onCancel: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
	onCancel: () => dispatch(openPage(Path.users())),
	onSubmit: () => {
		dispatch(openPage(Path.users()));
		dispatch(getDataStores());
	}
});

const mapStateToProps = (state, ownProps) => ({
	userId: ownProps.match.params.userId,
	rights: state.user.rights
});

export const UpdateUserPage = connect(
	mapStateToProps,
	mapDispatchToProps
)(UpdateUserPageComponent);
