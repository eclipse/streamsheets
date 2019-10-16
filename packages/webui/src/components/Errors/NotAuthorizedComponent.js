/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import LinearProgress from '@material-ui/core/LinearProgress';
import { accessManager } from '../../helper/AccessManager';


class NotAuthorizedComponent extends React.Component {
	static propTypes = {
		style: PropTypes.object,
	//	target: PropTypes.string.isRequired,
	};
	static defaultProps = {
		style: {
			fontSize: '2rem',
			textAlign: 'center',
			color: 'red',
			border: 'red dotted',
			padding: '5px',
			margin: '15px',
		},
	};

	render() {
		if (!accessManager.ready) return (<LinearProgress />);
		return (
			<div style={this.props.style}>
				<FormattedMessage
					id="Admin.notAuthorized"
					defaultMessage="Not Authorized"
				/>
			</div>
		);
	}
}
export default NotAuthorizedComponent;
