/* eslint-disable react/no-unused-state,react/prop-types */
import List from '@material-ui/core/List';
import { MenuGroup, MenuEntry } from '@cedalo/webui-components';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { IconStream, IconSecurity, IconOrganize } from '../components/icons';
import { AdminNavigationExtensions } from '@cedalo/webui-extensions';
import { Path } from '../helper/Path';

export const AdminNavigation = connect(({ user, router }) => ({
	rights: user.rights,
	hash: router.location.hash
}))((props) => {
	const [isStreamsOpen, setStreamsOpen] = useState(true);
	const [isOrganizeOpen, setOrganizeOpen] = useState(true);
	const [isPluginsOpen, setPluginsOpen] = useState(true);
	const [isSecurityOpen, setSecurityOpen] = useState(true);

	const isSelected = (pageOrGroup) => props.selection === pageOrGroup;

	return (
		<List component="nav" style={{ padding: 0 }}>
			<MenuGroup
				show={props.rights.includes('stream')}
				// show={false}
				open={isStreamsOpen}
				label={<FormattedMessage id="Dashboard.manage" defaultMessage="Streams" />}
				icon={<IconStream />}
				onClick={() => setStreamsOpen(!isStreamsOpen)}
			>
				<MenuEntry href={Path.connectors()} selected={isSelected('connectors')}>
					<FormattedMessage id="Dashboard.connectors" defaultMessage="Connectors" />
				</MenuEntry>
				<MenuEntry href={Path.consumers()} selected={isSelected('consumers')}>
					<FormattedMessage id="Dashboard.consumers" defaultMessage="Consumers" />
				</MenuEntry>
				<MenuEntry href={Path.producers()} selected={isSelected('producers')}>
					<FormattedMessage id="Dashboard.producers" defaultMessage="Producers" />
				</MenuEntry>
			</MenuGroup>

			<MenuGroup
				open={isSecurityOpen}
				onClick={() => setSecurityOpen(!isSecurityOpen)}
				label={<FormattedMessage id="Dashboard.security" defaultMessage="Security" />}
				icon={<IconSecurity />}
			>
				<MenuEntry show={props.rights.includes('user.view')} href={Path.users()} selected={isSelected('users')}>
					<FormattedMessage id="Dashboard.users" defaultMessage="Users" />
				</MenuEntry>

				<MenuEntry
					show={props.rights.includes('workspace')}
					href={Path.workspaces()}
					selected={isSelected('workspaces')}
				>
					<FormattedMessage id="Dashboard.workspaces" defaultMessage="Workspaces" />
				</MenuEntry>
			</MenuGroup>

			<MenuGroup
				open={isOrganizeOpen}
				onClick={() => setOrganizeOpen(!isOrganizeOpen)}
				label={<FormattedMessage id="Dashboard.organisation" defaultMessage="Organization" />}
				icon={<IconOrganize />}
			>
				<MenuEntry
					show={props.rights.includes('database')}
					href={Path.database()}
					selected={isSelected('database')}
				>
					<FormattedMessage id="Dashboard.database" defaultMessage="Database" />
				</MenuEntry>
			</MenuGroup>

			<AdminNavigationExtensions open={isPluginsOpen} isSelected={isSelected} setPluginsOpen={setPluginsOpen} />
		</List>
	);
});
