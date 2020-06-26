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
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import List from '@material-ui/core/List';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';

const MenuGroup = ({ open, label, icon, onClick, show, children }) => {
	const entries = Array.isArray(children) ? children : [children];
	const shownEntries = entries.filter((entry) => entry.props.show !== false);
	const selected = shownEntries.some((entry) => entry.props.selected);
	return show === false || shownEntries.length === 0 ? null : (
		<React.Fragment>
			<MenuItem onClick={onClick} selected={selected}>
				<ListItemIcon>{icon}</ListItemIcon>
				<ListItemText primary={label} style={{ padding: 0 }} />
				{open ? <ExpandLess /> : <ExpandMore />}
			</MenuItem>
			<Collapse in={open} timeout="auto" unmountOnExit key={2}>
				<List component="div" disablePadding>
					{children}
				</List>
			</Collapse>
		</React.Fragment>
	);
};

export default MenuGroup;
