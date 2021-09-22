/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import React, { useState } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import MenuItem from '@material-ui/core/MenuItem';

export default function MenuItemWithTooltip(props) {
	const [showTooltip, setShowTooltip] = useState(false);

	return (
		<Tooltip title={props.tooltipTitle} open={showTooltip}>
			<span onMouseEnter={() => setShowTooltip(!!props.tooltipTitle)} onMouseLeave={() => setShowTooltip(false)}>
				<MenuItem onClick={props.onClick} {...props.MenuItemProps}>
					{props.children}
				</MenuItem>
			</span>
		</Tooltip>
	);
}
