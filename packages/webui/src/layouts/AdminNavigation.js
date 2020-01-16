/* eslint-disable react/no-unused-state,react/prop-types */
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
// import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { accessManager } from '../helper/AccessManager';
import { IconStream, IconSecurity, IconOrganize } from '../components/icons';

const { RESOURCE_TYPES, RESOURCE_ACTIONS } = accessManager;

const MenuGroup = ({ open, label, icon, onClick, show, children }) => {
	const entries = Array.isArray(children) ? children : [children];
	const shownEntries = entries.filter((entry) => entry.props.show !== false);
	const selected = shownEntries.some((entry) => entry.props.selected);
	return show === false || shownEntries === 0 ? null : (
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

const MenuEntry = ({ href, selected, children, show }) =>
	show === false ? null : (
		<Link style={{ textDecoration: 'none' }} to={href} href={href}>
			<MenuItem dense selected={selected}>
				<ListItemText inset primary={children} />
			</MenuItem>
		</Link>
	);

export const AdminNavigation = (props) => {
	const [isStreamsOpen, setStreamsOpen] = useState(true);
	const [isOrganizeOpen, setOrganizeOpen] = useState(true);
	const [isSecurityOpen, setSecurityOpen] = useState(true);

	const isSelected = (pageOrGroup) => props.selection === pageOrGroup;

	return (
		<List component="nav" style={{ padding: 0 }}>
			<MenuGroup
				show={accessManager.can(RESOURCE_TYPES.STREAM, RESOURCE_ACTIONS.VIEW)}
				// show={false}
				open={isStreamsOpen}
				label={<FormattedMessage id="Dashboard.manage" defaultMessage="Streams" />}
				icon={<IconStream />}
				onClick={() => setStreamsOpen(!isStreamsOpen)}
			>
				<MenuEntry href="/administration/connectors" selected={isSelected('connectors')}>
					<FormattedMessage id="Dashboard.connectors" defaultMessage="Connectors" />
				</MenuEntry>
				<MenuEntry href="/administration/consumers" selected={isSelected('consumers')}>
					<FormattedMessage id="Dashboard.consumers" defaultMessage="Consumers" />
				</MenuEntry>
				<MenuEntry href="/administration/producers" selected={isSelected('producers')}>
					<FormattedMessage id="Dashboard.producers" defaultMessage="Producers" />
				</MenuEntry>
			</MenuGroup>

			<MenuGroup
				show={accessManager.can(RESOURCE_TYPES.SECURITY, RESOURCE_ACTIONS.VIEW)}
				open={isSecurityOpen}
				onClick={() => setSecurityOpen(!isSecurityOpen)}
				label={<FormattedMessage id="Dashboard.security" defaultMessage="Security" />}
				icon={<IconSecurity />}
			>
				<MenuEntry href="/administration/users" selected={isSelected('users')}>
					<FormattedMessage id="Dashboard.users" defaultMessage="Users" />
				</MenuEntry>
			</MenuGroup>

			<MenuGroup
				show={accessManager.can(
					RESOURCE_TYPES.STREAM || accessManager.can(RESOURCE_TYPES.LABEL, RESOURCE_ACTIONS.EDIT),
					RESOURCE_ACTIONS.VIEW
				)}
				open={isOrganizeOpen}
				onClick={() => setOrganizeOpen(!isOrganizeOpen)}
				label={<FormattedMessage id="Dashboard.organisation" defaultMessage="Organization" />}
				icon={<IconOrganize />}
			>
				<MenuEntry href="/administration/database" selected={isSelected('database')}>
					<FormattedMessage id="Dashboard.database" defaultMessage="Database" />
				</MenuEntry>
			</MenuGroup>
		</List>
	);
};
