import React from 'react';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from 'react-router-dom';

const MenuEntry = ({ href, selected, children, show }) =>
	show === false ? null : (
		<Link style={{ color: 'inherit', textDecoration: 'none' }} to={href} href={href}>
			<MenuItem dense selected={selected}>
				<ListItemText inset primary={children} />
			</MenuItem>
		</Link>
	);

export default MenuEntry;
