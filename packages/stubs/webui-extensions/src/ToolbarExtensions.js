/* eslint-disable react/prop-types */
/* eslint-disable no-bitwise */

import React, { Component } from 'react';
import { connect } from 'react-redux';

// eslint-disable-next-line react/prefer-stateless-function
export class ToolbarExtensions extends Component {

	render() {
		return (
			<div
				style={{
					position: 'absolute',
					right: '10px',
				}}
			>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		appState: state.appState,
		machineId: state.monitor.machine.id,
	};
}

export default connect(
	mapStateToProps,
)(ToolbarExtensions);
