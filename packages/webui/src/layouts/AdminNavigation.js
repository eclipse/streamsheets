/* eslint-disable react/no-unused-state,react/prop-types */
import List from '@material-ui/core/List';
import { MenuGroup, MenuEntry } from '@cedalo/webui-components';
import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
// import { connect } from 'react-redux';
import { accessManager } from '../helper/AccessManager';
import { IconStream, IconSecurity, IconOrganize } from '../components/icons';

const { RESOURCE_TYPES, RESOURCE_ACTIONS } = accessManager;

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
