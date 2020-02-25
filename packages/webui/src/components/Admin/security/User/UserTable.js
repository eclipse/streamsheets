import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import DeleteIcon from '@material-ui/icons/Delete';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { DynamicFormattedMessage } from '../../../HelperComponent/DynamicFormattedMessage';
import { userShape } from './UserPropTypes';

const USER_TABLE_COLUMNS = [
	{ id: 'username', key: 'Admin.User.username' },
	{ id: 'email', key: 'Admin.User.email' },
	{ id: 'firstName', key: 'Admin.User.firstName' },
	{ id: 'lastName', key: 'Admin.User.lastName' },
	{ id: 'lastModified', key: 'Admin.User.lastModified' }
];

export const UserTable = (props) => {
	const { users, onDeleteUser, onSelectUser, onSort, sortBy, sortDirection } = props;

	return (
		<Table>
			<TableHead>
				<TableRow>
					{USER_TABLE_COLUMNS.map((column) => (
						<TableCell
							padding="checkbox"
							key={column.id}
							sortDirection={sortBy === column.id ? sortDirection : false}
						>
							<TableSortLabel
								active={sortBy === column.id}
								direction={sortDirection}
								onClick={() => onSort(column.id)}
							>
								<DynamicFormattedMessage id={column.key} defaultMessage={column.key} />
							</TableSortLabel>
						</TableCell>
					))}
					<TableCell />
				</TableRow>
			</TableHead>
			<TableBody>
				{users.map((user) => (
					<TableRow hover key={user.id} onClick={() => onSelectUser(user.id)} style={{ cursor: 'pointer' }}>
						<TableCell>
							<b>{user.username}</b>
						</TableCell>
						<TableCell>{user.email}</TableCell>
						<TableCell>{user.firstName}</TableCell>
						<TableCell>{user.lastName}</TableCell>
						<TableCell>{moment(user.lastModified).fromNow()}</TableCell>
						<TableCell>
							{user.canDelete ? (
								<IconButton
									style={{ color: '#FF0022' }}
									onClick={(event) => {
										event.stopPropagation();
										onDeleteUser(user.id);
									}}
								>
									<DeleteIcon />
								</IconButton>
							) : null}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

UserTable.propTypes = {
	users: PropTypes.arrayOf(userShape).isRequired,
	sortBy: PropTypes.string,
	sortDirection: PropTypes.string,
	onDeleteUser: PropTypes.func.isRequired,
	onSelectUser: PropTypes.func.isRequired,
	onSort: PropTypes.func.isRequired
};

UserTable.defaultProps = {
	sortBy: undefined,
	sortDirection: undefined
};
