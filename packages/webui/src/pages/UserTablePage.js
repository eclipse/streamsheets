import { Button, CircularProgress, Grid, Paper, TextField, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { openPage } from '../actions/actions';
import { UserTable } from '../components/Admin/security/User/UserTable';
import { useGraphQL } from '../helper/Hooks';
import { intl } from '../helper/IntlGlobalProvider';
import { AdminPageLayout } from '../layouts/AdminPageLayout';

const QUERY = `
{
	users {
		id
	  	username
	  	email
	  	lastName
	  	firstName
	  	lastModified
	}
}
`;

const UserTablePageComponent = (props) => {
	const { onAddUser, onSelectUser } = props;
	const [filterText, setTextFilter] = useState('');
	const [sort, setSort] = useState({ field: 'username', direction: 'asc' });

	const { loading, data, errors } = useGraphQL(QUERY);

	const directionMultiplier = sort.direction === 'asc' ? 1 : -1;

	if (errors) {
		return (
			<div
				style={{
					height: '100%',
					padding: '24px',
					backgroundColor: '#EEE',
					boxSizing: 'border-box',
					overflow: 'auto',
				}}
			>
				{errors.join('\n')}
			</div>
		);
	}

	const filterAndSort = () => {
		if (loading) {
			return [];
		}
		const { users = [] } = data || {};
		const shownUsers = filterText
			? users.filter(({ username, email, firstName, lastName }) =>
					Object.values({ username, email, firstName, lastName })
						.join('\n')
						.toLowerCase()
						.match(filterText.toLowerCase()),
			  )
			: users;
		const sortedUsers = shownUsers.sort(
			(a, b) =>
				((a[sort.field] || '').toLowerCase() > (b[sort.field] || '').toLowerCase() ? 1 : -1) *
				directionMultiplier,
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
					boxSizing: 'border-box',
				}}
			>
				<Paper
					style={{
						padding: '32px',
						maxWidth: '960px',
						margin: 'auto',
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
								onSelectUser={(userId) => onSelectUser(userId)}
								onSort={(field) => {
									const direction = field === sort.field && sort.direction === 'asc' ? 'desc' : 'asc';
									setSort({ field, direction });
								}}
								sortBy={sort.field}
								sortDirection={sort.direction}
								loading={loading}
							/>
						</Grid>
						{!loading && users.length === 0 && (
							<Grid item xs={12} style={{ textAlign: 'center' }}>
								<Typography variant="body1">No Users Found</Typography>
							</Grid>
						)}
						{loading && (
							<Grid container style={{ minHeight: '200px' }} justify="center" alignItems="center">
								<Grid item>
									<CircularProgress />
								</Grid>
							</Grid>
						)}
					</Grid>
				</Paper>
			</div>
		</AdminPageLayout>
	);
};

UserTablePageComponent.propTypes = {
	onAddUser: PropTypes.func.isRequired,
	onSelectUser: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
	onAddUser: () => openPage('/administration/users/new'),
	onSelectUser: (userId) => openPage(`/administration/users/${userId}`),
};

export const UserTablePage = connect(
	null,
	mapDispatchToProps,
)(UserTablePageComponent);
