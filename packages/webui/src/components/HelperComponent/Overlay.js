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
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';

export const Overlay = (props) => (
	<Grid
		container
		justify="center"
		alignItems="center"
		style={{
			zIndex: 10000,
			width: '100%',
			height: '100%',
			background: 'rgba(0,0,0,0.1)',
			position: 'absolute',
			top: 0,
			left: 0,
		}}
	>
		<Grid>{props.children}</Grid>
	</Grid>
);

Overlay.propTypes = {
	children: PropTypes.node,
};

Overlay.defaultProps = {
	children: null,
};
