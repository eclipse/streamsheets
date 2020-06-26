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
import { openPage } from '@cedalo/webui/src/actions/actions';
import { Overlay } from '@cedalo/webui/src/components/HelperComponent/Overlay';
import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';
import { useGraphQLCB } from '@cedalo/webui/src/helper/Hooks';
import { intl } from '@cedalo/webui/src/helper/IntlGlobalProvider';
import { Path } from '@cedalo/webui/src/helper/Path';
import { AdminPageLayout } from '@cedalo/webui/src/layouts/AdminPageLayout';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import PropTypes from 'prop-types';
import React, { useEffect, useReducer, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { UserTable } from './UserTable';

const QUERY = `
{
	users {
		id
		username
		canDelete
		lastModified
	}
}
`;

const DELETE_USER_MUTATION = `
	mutation CreateUser($id: ID!) {
		deleteUser(id: $id) {
			success
			code
		}
	}
`;

const defaultState = {
	users: null,
	errors: null,
	loading: true,
	userId: null,
	pending: false,
	reloading: false
};

const reducer = (state, action) => {
	switch (action.type) {
		case 'set_errors':
			return {
				...state,
				errors: action.data
			};
		case 'set_users':
			return {
				...state,
				loading: false,
				users: action.data
			};
		case 'set_user_id':
			return {
				...state,
				userId: action.data,
				pending: false
			};
		case 'start_delete':
			return {
				...state,
				pending: true
			};
		case 'cancel_delete':
			return {
				...state,
				userId: null
			};
		case 'delete_success':
			return {
				...state,
				pending: false,
				reloading: true,
				userId: null
			};
		case 'reload_done':
			return {
				...state,
				reloading: false
			};
		default:
			throw new Error('UserTablePage reducer received unknown action');
	}
};

const UserTablePageComponent = (props) => {
	const { onAddUser, onSelectUser } = props;
	const [filterText, setTextFilter] = useState('');
	const [sort, setSort] = useState({ field: 'username', direction: 'asc' });
	const [state, dispatch] = useReducer(reducer, defaultState);

	useGraphQLCB(
		({ data, errors }) => {
			if (data) {
				dispatch({ type: 'set_users', data });
			}
			if (errors) {
				dispatch({ type: 'set_errors', errors: data });
			}
		},
		QUERY,
		undefined,
		[state.reloading],
		() => !state.users || state.reloading
	);
	const directionMultiplier = sort.direction === 'asc' ? 1 : -1;

	useEffect(() => {
		if (state.reloading && state.users) {
			setTimeout(() => dispatch({ type: 'reload_done' }), 500);
		}
	}, [state.users]);

	if (state.errors) {
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
				{state.errors.join('\n')}
			</div>
		);
	}

	const deleteUser = async () => {
		dispatch({ type: 'start_delete' });
		try {
			const {
				deleteUser: { success, code }
			} = await gatewayClient.graphql(DELETE_USER_MUTATION, {
				id: state.userId
			});
			if (success) {
				dispatch({ type: 'delete_success' });
			} else {
				dispatch({ type: 'done' });
				console.error(`Failed to delete user: ${code}`);
			}
		} catch (error) {
			dispatch({ type: 'done' });
			console.error(error);
		}
	};

	const filterAndSort = () => {
		if (state.loading) {
			return [];
		}
		const { users = [] } = state.users || {};
		const shownUsers = filterText
			? users.filter(({ username, email, firstName, lastName }) =>
					Object.values({ username, email, firstName, lastName })
						.join('\n')
						.toLowerCase()
						.match(filterText.toLowerCase())
			  )
			: users;
		const sortedUsers = shownUsers.sort(
			(a, b) =>
				((a[sort.field] || '').toLowerCase() > (b[sort.field] || '').toLowerCase() ? 1 : -1) *
				directionMultiplier
		);
		return sortedUsers;
	};

	const users = filterAndSort();

	return (
		<AdminPageLayout page="users" documentTitle={intl.formatMessage({ id: 'TitleUsers' })}>
			<div
				style={{
					maxHeight: '100%',
					padding: '24px',
					overflow: 'auto',
					boxSizing: 'border-box'
				}}
			>
				<Paper
					style={{
						padding: '32px',
						maxHeight: '100%',
						maxWidth: '960px',
						margin: 'auto',
						position: 'relative'
					}}
				>
					<Grid container spacing={32}>
						<Grid item container spacing={8} justify="space-between">
							<Grid item>
								<Typography variant="h5" gutterBottom>
									<FormattedMessage id="Admin.Users" defaultMessage="Users" />
								</Typography>
							</Grid>
							<Grid item>
								<Button variant="contained" color="primary" onClick={onAddUser}>
									<FormattedMessage id="Admin.User.add" defaultMessage="Add user" />
								</Button>
							</Grid>
						</Grid>
						<Grid item xs={12}>
							<TextField
								id="filter"
								label={<FormattedMessage id="Admin.User.search" defaultMessage="Search" />}
								fullWidth
								value={filterText}
								onChange={(event) => setTextFilter(event.target.value)}
							/>
						</Grid>
						<Grid item xs={12} style={{ overflowX: 'auto', width: '0px' }}>
							<UserTable
								users={users}
								onDeleteUser={(userId) => dispatch({ type: 'set_user_id', data: userId })}
								onSelectUser={(userId) => onSelectUser(userId)}
								onSort={(field) => {
									const direction = field === sort.field && sort.direction === 'asc' ? 'desc' : 'asc';
									setSort({ field, direction });
								}}
								sortBy={sort.field}
								sortDirection={sort.direction}
								loading={state.loading}
							/>
						</Grid>
						{!state.loading && users.length === 0 && (
							<Grid item xs={12} style={{ textAlign: 'center' }}>
								<Typography variant="body1">No Users Found</Typography>
							</Grid>
						)}
						{state.loading && (
							<Grid container style={{ minHeight: '200px' }} justify="center" alignItems="center">
								<Grid item>
									<CircularProgress />
								</Grid>
							</Grid>
						)}
					</Grid>
					{state.pending && (
						<Overlay>
							<CircularProgress style={{ width: '24px', height: '24px' }} />
						</Overlay>
					)}
					{state.reloading && (
						<Overlay>
							<CheckIcon color="primary" />
						</Overlay>
					)}
				</Paper>
			</div>
			<Dialog open={!!state.userId && !state.pending && !state.deleted}>
				<DialogTitle>
					<FormattedMessage id="Admin.userDelete" defaultMessage="Delete User" />
				</DialogTitle>
				<DialogContent
					style={{
						marginTop: '20px'
					}}
				>
					<DialogContentText>
						<FormattedMessage
							id="Admin.deleteUserMessage"
							defaultMessage="Please confirm to delete this user."
						/>
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => dispatch({ type: 'cancel_delete' })} color="primary">
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button data-action="delete" onClick={() => deleteUser()} color="primary" autoFocus>
						<FormattedMessage id="Delete" defaultMessage="Delete" />
					</Button>
				</DialogActions>
			</Dialog>
		</AdminPageLayout>
	);
};

UserTablePageComponent.propTypes = {
	onAddUser: PropTypes.func.isRequired,
	onSelectUser: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
	onAddUser: () => openPage(Path.user('new')),
	onSelectUser: (userId) => openPage(Path.user(userId))
};

export const UserTablePage = connect(
	null,
	mapDispatchToProps
)(UserTablePageComponent);
