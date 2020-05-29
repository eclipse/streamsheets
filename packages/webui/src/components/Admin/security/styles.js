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
import { blue, red } from '@material-ui/core/colors';

const styles = theme => ({
	toolIcon: {
		color: 'white',
	},
	root: {
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
		overflow: 'hidden',
		backgroundColor: theme.palette.background.paper,
	},
	gridList: {
		width: '100vw',
		height: '100vh',
	},
	gridListTile: {
	},
	icon: {
		color: 'white',
	},
	dsListTileBar: {
		// background: '#c80719',
	},
	listHeader: {
		fontSize: '1.6rem',
	},
	card: {
		maxWidth: 500,
	},
	media: {
		height: 194,
	},
	actions: {
		display: 'flex',
	},
	expand: {
		transform: 'rotate(0deg)',
		transition: theme.transitions.create('transform', {
			duration: theme.transitions.duration.shortest,
		}),
		marginLeft: 'auto',
	},
	expandOpen: {
		transform: 'rotate(180deg)',
	},
	avatar: {
		backgroundColor: red[500],
	},

	appBar: {
		margin: 0,
		padding: 0,
	},
	toolbar: {
		height: '1em',
		background: blue[800],
		margin: 0,
		padding: 0,
		paddingLeft: '10px',
		fontSize: '1.2rem',
	},
	title: {
		color: '#FFFFFF',
		margin: 0,
		padding: 0,
		paddingLeft: '5px',
		marginRight: '50px',
		flex: 1,
		fontSize: '2.2rem',
	},
	toolBarButton: {
		fontSize: '1rem',
		color: 'white',
	},
	tabs: {
		boxShadow: 'inset 0 0 0px #000000',
		backgroundColor: '#EEEEEE',
		borderBottom: '1px solid #AAAAAA',
	},
	tab: {
	},
	textField: {
		padding: '1rem',
		marginTop: '0.5rem',
		marginBottom: '0.5rem',
	},
	label: {
		marginLeft: '-1rem',
	},
	menu: {
		width: 400,
	},
	container: {
		display: 'flex',
		flexWrap: 'wrap',
	},
	formControl: {
		display: 'box',
		padding: '1rem',
		marginTop: '20px',
		marginBottom: '1.5rem',
	},
	select: {
		width: '100%',
	},
	footer: {
		textAlign: 'center',
		borderTop: '1px',
		borderTopColor: 'grey',
		borderTopStyle: 'dotted',
		fontSize: '0.8rem',
	},
	chips: {
		display: 'flex',
		flexWrap: 'wrap',
	},
	chip: {
		margin: theme.spacing.unit / 4,
	},
	fileInput: {

	},
});

export default styles;
