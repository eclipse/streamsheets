import { StringUtil } from '@cedalo/util';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import CheckIcon from '@material-ui/icons/Check';
import PropTypes from 'prop-types';
import React, { useEffect, useReducer } from 'react';
import { connect } from 'react-redux';
import { getDataStores, openPage } from '../actions/actions';
import { UpdatePasswordForm } from '../components/Admin/security/User/UpdatePasswordForm';
import { UpdateUserForm } from '../components/Admin/security/User/UpdateUserForm';
import { Overlay } from '../components/HelperComponent/Overlay';
import gatewayClient from '../helper/GatewayClient';
import { useGraphQL } from '../helper/Hooks';
import { intl } from '../helper/IntlGlobalProvider';
import { AdminPageLayout } from '../layouts/AdminPageLayout';
import { Path } from '../helper/Path';

const QUERY = `
query UpdateUserForm($id: ID!) {
	user(id: $id) {
		id
	  	username
	  	email
	  	lastName
		firstName
	}
	updateUserForm(userId: $id) {
		fields {
			id
			label
			default
			current
			options {
				id
				name
			}
		}
	}
}
`;

const UPDATE_USER_MUTATION = `
mutation UpdateUser($id: ID!, $user: UpdateUserInput!) {
	updateUser(id: $id, user: $user) {
		user {
			id
			username
		}
		success
		code
		fieldErrors {
			username
			email
		}
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
		case 'set_initial_user':
			return {
				...state,
				user: action.data,
				originalUser: action.data
			};
		case 'set_username':
			return {
				...state,
				pristine: false,
				user: { ...state.user, username: action.data },
				errors: {
					...state.errors,
					username: StringUtil.isEmpty(action.data) ? 'USERNAME_REQUIRED' : undefined
				}
			};
		case 'set_email':
			return {
				...state,
				pristine: false,
				user: { ...state.user, email: action.data },
				errors: {
					...state.errors,
					email: StringUtil.isEmpty(action.data) ? 'EMAIL_REQUIRED' : undefined
				}
			};
		case 'set_first_name':
			return {
				...state,
				pristine: false,
				user: { ...state.user, firstName: action.data }
			};
		case 'set_last_name':
			return {
				...state,
				pristine: false,
				user: { ...state.user, lastName: action.data }
			};
		case 'set_field':
			return {
				...state,
				pristine: false,
				user: {
					...state.user,
					[action.data.id]: action.data.value
				}
			};
		case 'save':
			return {
				...state,
				savePending: true
			};
		case 'saving_error':
			return {
				...state,
				savePending: false,
				pristine: true,
				errors: action.data
			};
		case 'saving_success':
			return {
				...state,
				savePending: false,
				saved: true,
				errors: {}
			};
		case 'set_password_1':
			return {
				...state,
				password: { ...state.password, newPassword: action.data, validationPending: true }
			};
		case 'set_password_2':
			return {
				...state,
				password: {
					...state.password,
					confirmation: action.data,
					confirmationPristine: false,
					validationPending: true
				}
			};
		case 'edit_password':
			return {
				...state,
				password: {
					newPassword: '',
					confirmation: '',
					confirmationPristine: true,
					validationPending: true,
					errors: {},
					saved: false,
					savePending: false
				}
			};
		case 'save_password':
			return { ...state, password: { ...state.password, savePending: true } };
		case 'saving_success_password':
			return { ...state, password: { ...state.password, savePending: false, saved: true, errors: {} } };
		case 'saving_error_password':
			return { ...state, password: { ...state.password, savePending: false, errors: action.data } };

		case 'check_passwords':
			return {
				...state,
				password: {
					...state.password,
					validationPending: false,
					errors: {
						password:
							!state.password.confirmationPristine &&
							state.password.newPassword &&
							state.password.newPassword !== state.password.confirmation
								? 'PASSWORD_DONT_MATCH'
								: undefined
					}
				}
			};
		case 'finish_password':
			return {
				...state,
				password: false
			};
		default:
			throw new Error(`Unkown action '${action.type}'`);
	}
};

export const UpdateUserPageComponent = (props) => {
	const { onCancel, onSubmit, userId } = props;
	const { loading, errors, data } = useGraphQL(QUERY, { id: userId }, [userId]);
	const [state, dispatch] = useReducer(updateUserReducer, {
		pristine: true,
		user: {},
		originalUser: {},
		errors: {},
		password: false,
		savePending: false,
		saved: false
	});

	useEffect(() => {
		if (data && data.user) {
			const { id, ...user } = {
				...data.user,
				...data.updateUserForm.fields.reduce(
					(acc, field) => ({ ...acc, [field.id]: field.current || field.default }),
					{}
				)
			};
			dispatch({
				type: 'set_initial_user',
				data: user
			});
		}
	}, [data]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (state.password) {
				dispatch({ type: 'check_passwords' });
			}
		}, 500);
		return () => {
			clearTimeout(timeoutId);
		};
	}, [state.password.newPassword, state.password.confirmation]);

	useEffect(() => {
		if (state.saved) {
			setTimeout(() => {
				onSubmit(state.user);
			}, 500);
		}
	}, [state.saved]);

	useEffect(() => {
		if (state.password.saved) {
			setTimeout(() => {
				dispatch({ type: 'finish_password' });
			}, 500);
		}
	}, [state.password.saved]);

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

	const saveUser = async () => {
		dispatch({ type: 'save' });
		try {
			const {
				updateUser: { success, fieldErrors, code, user }
			} = await gatewayClient.graphql(UPDATE_USER_MUTATION, {
				id: userId,
				user: state.user
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

	const savePassword = async () => {
		dispatch({ type: 'save_password' });
		try {
			const {
				updateUserPassword: { success, fieldErrors, code, user }
			} = await gatewayClient.graphql(UPDATE_PASSWORD_MUTATION, {
				id: userId,
				newPassword: state.password.newPassword
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

	const additionalFields = data ? data.updateUserForm.fields : [];

	const userForm = () => {
		const hasError = hasFieldError(state.errors);
		const hasRequired = state.user.username && state.user.email;
		const isValid = !!(!hasError && hasRequired);
		return (
			<UpdateUserForm
				user={state.user}
				originalUser={state.originalUser}
				pristine={state.pristine}
				errors={state.errors}
				intl={intl}
				disabled={loading || state.savePending || state.saved}
				onCancel={onCancel}
				valid={isValid}
				additionalFields={additionalFields}
				onFieldUpdate={(id, value) => dispatch({ type: 'set_field', data: { id, value } })}
				onSubmit={saveUser}
				onUsernameUpdate={(value) => dispatch({ type: 'set_username', data: value })}
				onEmailUpdate={(value) => dispatch({ type: 'set_email', data: value })}
				onFirstNameUpdate={(value) => dispatch({ type: 'set_first_name', data: value })}
				onLastNameUpdate={(value) => dispatch({ type: 'set_last_name', data: value })}
				onChangePassword={() => dispatch({ type: 'edit_password' })}
			/>
		);
	};

	const passwordForm = () => {
		const { newPassword, confirmation, validationPending } = state.password;
		const hasError = hasFieldError(state.password.errors);
		const hasRequired = newPassword && confirmation;
		const isValid = !!(!hasError && hasRequired && !validationPending);
		return (
			<UpdatePasswordForm
				user={state.originalUser}
				pristine={state.password.pristine}
				newPassword={state.password.newPassword}
				passwordConfirmation={state.password.confirmation}
				disabled={state.savePending}
				valid={isValid}
				errors={state.password.errors}
				intl={intl}
				onNewPasswordUpdate={(value) => dispatch({ type: 'set_password_1', data: value })}
				onPasswordConfirmationUpdate={(value) => dispatch({ type: 'set_password_2', data: value })}
				onSubmit={savePassword}
				onCancel={() => dispatch({ type: 'finish_password' })}
			/>
		);
	};

	const showProgress = loading || state.savePending || state.password.savePending;
	const showSuccess = state.saved || state.password.saved;

	return (
		<AdminPageLayout page="users" documentTitle={intl.formatMessage({ id: 'TitleUsers' })}>
			<div
				style={{
					minHeight: '100%',
					padding: '24px'
				}}
			>
				<Paper style={{ padding: '32px', maxWidth: '960px', margin: 'auto', position: 'relative' }}>
					{state.password ? passwordForm() : userForm()}
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
	userId: ownProps.match.params.userId
});

export const UpdateUserPage = connect(mapStateToProps, mapDispatchToProps)(UpdateUserPageComponent);
