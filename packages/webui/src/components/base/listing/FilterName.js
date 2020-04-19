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
