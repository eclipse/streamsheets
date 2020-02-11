/* eslint-disable react/prop-types */
/* eslint-disable no-bitwise */

import { Component } from 'react';
import { connect } from 'react-redux';

// eslint-disable-next-line react/prefer-stateless-function
export class PluginExtensions extends Component {

	render() {
		return null;
	}
}

function mapStateToProps(state) {
	return {
		appState: state.appState,
	};
}

export default connect(
	mapStateToProps,
)(PluginExtensions);
