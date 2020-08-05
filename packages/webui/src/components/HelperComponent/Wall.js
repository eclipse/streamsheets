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
import { withTheme } from '@material-ui/core/styles';

function Wall(props) {
	const { theme } = props;

	const styles = {
		root: {
			backgroundColor: theme.wall.backgroundColor,
			overflowY: 'overflowY',
			height: '100%',
		},
	};

	return (
		<div
			{...props}
			style={styles.root}
		/>
	);
}

export default withTheme()(Wall); // Let's get the theme as a property

