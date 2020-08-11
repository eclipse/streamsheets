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
import Database from '../components/Admin/security/Database';
import { Restricted, NotAllowed } from '../components/HelperComponent/Restricted';
import { FormattedMessage } from 'react-intl';
import { AdminPageLayout } from '../layouts/AdminPageLayout';

const RestrictedWrapper = (props) => (
	<Restricted oneOf={[props.right]}>
		<NotAllowed>
			<div
				style={{
					fontSize: '2rem',
					textAlign: 'center',
					color: 'red',
					// border: 'red dotted',
					padding: '5px',
					margin: '50px'
				}}
			>
				<FormattedMessage id="Admin.notAuthorized" defaultMessage="Not Authorized" />
			</div>
		</NotAllowed>
		{props.children}
	</Restricted>
);

export const DatabasePage = () => (
	<AdminPageLayout page="database" documentTitle={<FormattedMessage id="Administration" default="Administration" />}>
		<div
			style={{
				position: 'relative',
				height: '100%',
				outline: 'none',
				overflow: 'hidden'
			}}
		>
			<RestrictedWrapper right="database">
				<Database />
			</RestrictedWrapper>
		</div>
	</AdminPageLayout>
);
