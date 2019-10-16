import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';

export const Overlay = (props) => (
	<Grid
		container
		justify="center"
		alignItems="center"
		style={{
			zIndex: 100,
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
