import React, {Component} from 'react';
import PropTypes from 'prop-types';

export class ChartExtensions extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static propTypes = {
		// eslint-disable-next-line react/no-unused-prop-types
		onCreatePlot: PropTypes.func.isRequired,
	};

	render() {
		return <div />;
	}
};
