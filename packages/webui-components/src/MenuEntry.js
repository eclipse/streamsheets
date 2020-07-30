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
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from 'react-router-dom';

const MenuEntry = ({ href, selected, children, show }) =>
	show === false ? null : (
		<Link style={{ color: 'inherit', textDecoration: 'none' }} to={href} href={href}>
			<MenuItem selected={selected}>
				<ListItemText inset primary={children} />
			</MenuItem>
		</Link>
	);

export default MenuEntry;
