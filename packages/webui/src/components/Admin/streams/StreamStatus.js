/* eslint-disable react/forbid-prop-types,no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';

const improveStatus = status => status.toUpperCase().replace('CONNECTOR_', '');
const extractStatus = (status) => {
	if (status) {
		if (typeof status === 'string') {
			return improveStatus(status);
		} else if (status.streamEventType) {
			return improveStatus(status.streamEventType);
		}
	}
	return 'UNDEFINED';
};
// TODO: rethink - if we need or we keep state in header
class StreamStatus extends React.Component {
	static propTypes = {
		model: PropTypes.object.isRequired,
		style: PropTypes.object,
	};
	static defaultProps = {
		style: {
			content: {
				margin: '20px 10px 10px 5px',
			},
			title: {
			},
		},
	};

	render() {
		const {
			style, model,
		} = this.props;
		const status = extractStatus(model.state);
		return null;
		/* (
			<div style={style}>
				<p>State: { status }</p>
			</div>
		); */
	}
}
export default StreamStatus;
