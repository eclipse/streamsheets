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
import TextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const createNameFilter = (textToFilter) => (resources) => {
	if (textToFilter && textToFilter.length > 0) {
		return resources.filter(
			(resource) =>
				resource.name
					.toLowerCase()
					.indexOf(textToFilter.toLowerCase()) >= 0,
		);
	}
	return resources;
};

class FilterName extends React.Component {
	onTextChange = (text) => {
		this.props.onUpdateFilter(createNameFilter(text));
	};

	render() {
		return (
			<TextField
				fullWidth
				type="search"
				label={
					<FormattedMessage
						id="Dashboard.textFilter"
						defaultMessage="Filter"
					/>
				}
				onChange={(event) => this.onTextChange(event.target.value)}
				style={Object.assign({ minWidth: '30pt' }, this.props.styles)}
			/>
		);
	}
}

FilterName.propTypes = {
	onUpdateFilter: PropTypes.func.isRequired,
	// eslint-disable-next-line react/forbid-prop-types
	styles: PropTypes.object,
};

FilterName.defaultProps = {
	styles: {},
};

export default FilterName;
