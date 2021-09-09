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
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import ThemeModeIcon from '@material-ui/icons/Brightness4';
import React from 'react';
import { FormattedMessage } from 'react-intl';

export default function ThemeButton() {

	const handleThemeChange = () => {
		const mode = localStorage.getItem('theme');
		if (mode === 'Default') {
			localStorage.setItem('theme', 'Dark');
		} else {
			localStorage.setItem('theme', 'Default');
		}
		location.reload();
	}

	return (
		<Tooltip enterDelay={300} title={<FormattedMessage id="Tooltip.SwitchMode" defaultMessage="Switch Mode" />}>
			<div>
				<IconButton onClick={handleThemeChange}>
					<ThemeModeIcon style={{ color: 'white' }} />
				</IconButton>
			</div>
		</Tooltip>
	);
}
