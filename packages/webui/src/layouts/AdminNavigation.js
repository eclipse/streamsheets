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
/* eslint-disable react/no-unused-state,react/prop-types */
import List from '@material-ui/core/List';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { AdminNavigationExtensions } from '@cedalo/webui-extensions';
import { Path } from '../helper/Path';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { Storage, People, GroupWork } from '@material-ui/icons';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from 'react-router-dom';
import ListItemText from '@material-ui/core/ListItemText';

export const AdminNavigation = connect(({ user, router }) => ({
	rights: user.rights,
	hash: router.location.hash
}))((props) => {
	const [isPluginsOpen, setPluginsOpen] = useState(true);
	const isSelected = (pageOrGroup) => props.selection === pageOrGroup;

	return (
		<List component="nav" style={{ padding: 0 }}>
			{props.rights.includes('user.view') || props.rights.includes('self.view') ? (
				<Link
					replace
					style={{ color: 'inherit', textDecoration: 'none' }}
					to={Path.users()}
					href={Path.users()}
				>
					<MenuItem dense selected={isSelected('users')} style={{ height: '50px' }}>
						<ListItemIcon>
							<People />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="Dashboard.users" defaultMessage="Users" />} />
					</MenuItem>
				</Link>
			) : null}
			{props.rights.includes('workspace') ? (
				<Link
					replace
					style={{ color: 'inherit', textDecoration: 'none' }}
					to={Path.workspaces()}
					href={Path.workspaces()}
				>
					<MenuItem dense selected={isSelected('workspaces')} style={{ height: '50px' }}>
						<ListItemIcon>
							<GroupWork />
						</ListItemIcon>
						<ListItemText
							primary={<FormattedMessage id="Dashboard.workspaces" defaultMessage="Workspaces" />}
						/>
					</MenuItem>
				</Link>
			) : null}
			{props.rights.includes('database') ? (
				<Link
					style={{ color: 'inherit', textDecoration: 'none' }}
					to={Path.database()}
					href={Path.database()}
					replace
				>
					<MenuItem dense selected={isSelected('database')} style={{ height: '50px' }}>
						<ListItemIcon>
							<Storage />
						</ListItemIcon>
						<ListItemText
							primary={<FormattedMessage id="Dashboard.database" defaultMessage="Database" />}
						/>
					</MenuItem>
				</Link>
			) : null}

			<AdminNavigationExtensions open={isPluginsOpen} isSelected={isSelected} setPluginsOpen={setPluginsOpen} />
		</List>
	);
});
