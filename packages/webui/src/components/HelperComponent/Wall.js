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
import { withTheme } from '@material-ui/core/styles';

function WithTheme(props) {
	const { theme } = props;
	const { overflow } = props;

	const styles = {
		root: {
			backgroundColor: theme.wall.backgroundColor,
			overflowY: overflow ? 'overflowY' : 'inherit',
			height: overflow ? '100%' : 'inherit',
		},
	};

	return (
		<div
			{...props}
			style={styles.root}
		/>
	);
}

WithTheme.propTypes = {
	theme: PropTypes.object.isRequired,
	overflow: PropTypes.bool,
};

WithTheme.defaultProps = {
	overflow: false,
};

export default withTheme()(WithTheme); // Let's get the theme as a property

