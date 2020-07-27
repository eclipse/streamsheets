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
import Tooltip from '@material-ui/core/Tooltip';
import React, {useState} from 'react';
import { FormattedMessage } from 'react-intl';
import IconViewGrid from '@material-ui/icons/ViewModule';
import IconViewList from '@material-ui/icons/ViewList';
import IconButton from '@material-ui/core/IconButton';

const PREF_KEY_LAYOUT = 'streamsheets-prefs-listing-layout';

export default function GridViewButton(props) {
	const { onUpdateLayout } = props;
	const [ layout, setLayout] = useState(localStorage.getItem(PREF_KEY_LAYOUT) || 'grid');

	const handleLayoutChange = (lay) => {
		setLayout(lay);
		onUpdateLayout(lay);
		localStorage.setItem(PREF_KEY_LAYOUT, lay);
	};
	return (
		<div>
			{layout === 'list' ? (
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.ViewGrid" defaultMessage="View Grid" />}
				>
					<IconButton color="primary" aria-label="Menu" onClick={() => handleLayoutChange('grid')}>
						<IconViewGrid />
					</IconButton>
				</Tooltip>
			) : (
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.ViewList" defaultMessage="View List" />}
				>
					<IconButton color="primary" aria-label="Menu" onClick={() => handleLayoutChange('list')}>
						<IconViewList />
					</IconButton>
				</Tooltip>
			)}
		</div>
	);
}
