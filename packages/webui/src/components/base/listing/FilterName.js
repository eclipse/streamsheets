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
// import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl} from 'react-intl';
import IconSearch from '@material-ui/icons/Search';
import InputAdornment from '@material-ui/core/InputAdornment';
import Input from '@material-ui/core/Input';
import { withStyles } from "@material-ui/core/styles";

const styles = () => ({
	root: {
		width: '90%',
		color: 'white',
		// margin: '12px',
	},
	inputTypeSearch: {
		"&::-webkit-clear-button": {
			display: "none",
		},
	},
	underline: {
		'&::before': {
			borderColor: 'white',
		},
		'&::after': {
			borderColor: 'white',
		},
		"&&&&:hover:before": {
			borderBottom: "2px solid white"
		},
	}
});

class FilterName extends React.Component {
	render() {
		const { classes } = this.props;
		return (
			<Input
				type="search"
				id='resFilterField'
				value={this.props.filter}
				onChange={(event) => this.props.onUpdateFilter(event.target.value)}
				startAdornment={
					<InputAdornment position="start">
						<IconSearch />
					</InputAdornment>
				}
				placeholder={this.props.intl.formatMessage({ id: 'Dashboard.filter' }, {})}
				classes={{
					root: classes.root,
					inputTypeSearch: classes.inputTypeSearch,
					underline: classes.underline,
				}}
			/>
		);
	}
}

export default injectIntl(withStyles(styles)(FilterName));
