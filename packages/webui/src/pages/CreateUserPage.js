import { StringUtil } from '@cedalo/util';
import { CircularProgress, Paper } from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import PropTypes from 'prop-types';
import React, { useEffect, useReducer } from 'react';
import { connect } from 'react-redux';
import { openPage } from '../actions/actions';
import { CreateUserForm } from '../components/Admin/security/User/CreateUserForm';
import { Overlay } from '../components/HelperComponent/Overlay';
import gatewayClient from '../helper/GatewayClient';
import { intl } from '../helper/IntlGlobalProvider';
import { AdminPageLayout } from '../layouts/AdminPageLayout';

const createUserReducer = (state, action) => {
	switch (action.type) {
		case 'set_username':
			return {
				...state,
				pristine: false,
				user: { ...state.user, username: action.data },
				errors: {
					...state.errors,
					username: StringUtil.isEmpty(action.data) ? 'USERNAME_REQUIRED' : undefined,
				},
			};
		case 'set_email':
			return {
				...state,
				pristine: false,
				user: { ...state.user, email: action.data },
				errors: {
					...state.errors,
					email: StringUtil.isEmpty(action.data) ? 'EMAIL_REQUIRED' : undefined,
				},
			};
		case 'set_first_name':
			return {
				...state,
				pristine: false,
				user: { ...state.user, firstName: action.data },
			};
		case 'set_last_name':
			return {
				...state,
				pristine: false,
				user: { ...state.user, lastName: action.data },
			};
		case 'set_password':
			return {
				...state,
				pristine: false,
				user: {
					...state.user,
					password: action.data,
				},
			};
		case 'set_password_confirmation':
			return {
				...state,
				pristine: false,
				passwordConfirmationPristine: false,
				passwordConfirmation: action.data,
			};
		case 'check_passwords':
			return {
				...state,
				errors: {
					...state.errors,
					password:
						!state.passwordConfirmationPristine &&
						state.user.password &&
						state.user.password !== state.passwordConfirmation
							? 'PASSWORD_DONT_MATCH'
							: undefined,
				},
			};
		case 'save':
			return {
				...state,
				savePending: true,
			};
		case 'saving_error':
			return {
				...state,
				savePending: false,
				pristine: true,
				errors: action.data,
			};
		case 'saving_success':
			return {
				...state,
				savePending: false,
				saved: true,
			};
		default:
			throw new Error('Unkown action');
	}
};

const CREATE_USER_MUTATION = `
mutation CreateUser($user: UserInput!) {
	createUser(user: $user) {
		user {
			id
			username
		}
		success
		code
		fieldErrors {
			username
			email
			password
		}
	}
}
`;

const hasFieldError = (errors) =>
	Object.entries(errors).filter(([key, value]) => key !== 'form' && !StringUtil.isEmpty(value)).length > 0;

export const CreatUserPageComponent = (props) => {
	const { onCancel, onSubmit } = props;
	const [state, dispatch] = useReducer(createUserReducer, {
		pristine: true,
		user: {
			username: '',
			email: '',
			firstName: '',
			lastName: '',
			password: '',
		},
		errors: {},
		passwordConfirmation: '',
		passwordConfirmationPristine: true,
		savePending: false,
		saved: false,
	});
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			dispatch({ type: 'check_passwords' });
		}, 500);
		return () => {
			clearTimeout(timeoutId);
		};
	}, [state.passwordConfirmation, state.user.password]);

	useEffect(() => {
		if (state.saved) {
			setTimeout(() => {
				onSubmit(state.user);
			}, 500);
		}
	}, [state.saved]);

	const hasError = hasFieldError(state.errors);
	const hasRequired = state.user.username && state.user.email && state.user.password && state.passwordConfirmation;
	const isValid = !!(!hasError && hasRequired);

	const saveUser = async () => {
		dispatch({ type: 'save' });
		try {
			const {
				createUser: { success, fieldErrors, code, user },
			} = await gatewayClient.graphql(CREATE_USER_MUTATION, {
				user: state.user,
			});
			if (success) {
				dispatch({ type: 'saving_success', data: user });
			} else if (fieldErrors) {
				dispatch({ type: 'saving_error', data: fieldErrors });
			} else {
				dispatch({ type: 'saving_error', data: { form: code } });
			}
		} catch (error) {
			dispatch({ type: 'saving_error', data: { form: 'UNEXPECTED_ERROR' } });
			console.error(error);
		}
	};

	return (
		<AdminPageLayout page="users" documentTitle={intl.formatMessage({ id: 'TitleUsers' })}>
			<div
				style={{
					minHeight: '100%',
					padding: '24px',
				}}
			>
				<Paper style={{ padding: '32px', maxWidth: '960px', margin: 'auto', position: 'relative' }}>
					<CreateUserForm
						user={state.user}
						errors={state.errors}
						passwordConfirmation={state.passwordConfirmation}
						pristine={state.pristine}
						valid={isValid}
						disabled={state.savePending || state.saved}
						intl={intl}
						onCancel={onCancel}
						onSubmit={saveUser}
						onUsernameUpdate={(value) => dispatch({ type: 'set_username', data: value })}
						onEmailUpdate={(value) => dispatch({ type: 'set_email', data: value })}
						onFirstNameUpdate={(value) => dispatch({ type: 'set_first_name', data: value })}
						onLastNameUpdate={(value) => dispatch({ type: 'set_last_name', data: value })}
						onPasswordUpdate={(value) => dispatch({ type: 'set_password', data: value })}
						onPasswordConfirmationUpdate={(value) =>
							dispatch({ type: 'set_password_confirmation', data: value })
						}
					/>
					{state.savePending && (
						<Overlay>
							<CircularProgress style={{ width: '24px', height: '24px' }} />
						</Overlay>
					)}
					{state.saved && (
						<Overlay>
							<CheckIcon color="primary" />
						</Overlay>
					)}
				</Paper>
			</div>
		</AdminPageLayout>
	);
};

CreatUserPageComponent.propTypes = {
	onCancel: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
	onCancel: () => openPage('/administration/users'),
	onSubmit: () => openPage('/administration/users'),
};

export const CreateUserPage = connect(
	null,
	mapDispatchToProps,
)(CreatUserPageComponent);
