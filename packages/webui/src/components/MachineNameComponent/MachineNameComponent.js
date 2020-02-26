/* eslint-disable react/prop-types */
import React from 'react';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import { FormattedMessage } from 'react-intl';
import ErrorIcon from '@material-ui/icons/Error';
import * as Colors from '@material-ui/core/colors/index';
import MachineHelper from '../../helper/MachineHelper';
import * as Actions from '../../actions/actions';

const styles = {
	default: {
		color: 'white',
		marginTop: '4px',
	},
	focus: {
		color: 'black',
		marginTop: '4px',
		backgroundColor: 'white',
	},
	underline: {
		backgroundColor: 'white',
	},
};

class MachineNameComponent extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			machine: props.monitor.machine,
			styles: 'default',
		};
		this.handleFocus = this.handleFocus.bind(this);
		this.handleKeyPress = this.handleKeyPress.bind(this);
		this.handleSaveMachineName = this.handleSaveMachineName.bind(this);
		this.handleChangeMachineName = this.handleChangeMachineName.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		this.setState({
			machine: nextProps.monitor.machine,
		});
	}

	handleFocus() {
		this.setState({
			styles: 'focus',
		});
	}

	handleKeyPress(event) {
		if (event.key === 'Enter') {
			this.unfocus();
			event.preventDefault();
		}
	}

	unfocus() {
		if (document.activeElement) {
			document.activeElement.blur();
		}
	}


	handleSaveMachineName(/* event */) {
		// if (this.verifyName(this.state.machine.name)) {
		this.props.rename(this.props.monitor.machine.id, this.props.monitor.machine.name);
		this.setState({
			styles: 'default',
		});
		// } else {
		// 	this.setState({
		// 		machine: this.props.monitor.machine,
		// 	});
		// }
	}

	handleChangeMachineName(event) {
		const { machine } = this.props.monitor;
		machine.name = event.target.value;
		this.setState({
			machine,
		});
	}

	// verifyName(name) {
	// 	const referenceIdentifierRegEx = /^[\w]+$/;
	// 	return referenceIdentifierRegEx.test(name);
	// }
	//
	render() {
		return (
			MachineHelper.isMachineDetailsPage() ?
				<div>
					<Tooltip
						enterDelay={300}
						title={
							<FormattedMessage
								id="Tooltip.EditName"
								defaultMessage="Edit Machine Name"
							/>}
					>
						<TextField
							error={/* !this.verifyName(this.state.machine.name) || */ !this.props.monitor.machineNameSaved}
							id="machine-name"
							disabled={!!this.props.disabled}
							value={this.state.machine.name || ''}
							onBlur={this.handleSaveMachineName}
							onChange={this.handleChangeMachineName}
							onFocus={this.handleFocus}
							onKeyPress={this.handleKeyPress}
							InputProps={!this.props.monitor.machineNameSaved ? {
								style: styles[this.state.styles],
								endAdornment: (
									<InputAdornment position="end">
										<ErrorIcon color={Colors.red[100]} />
									</InputAdornment>
								),
							} : {
								style: styles[this.state.styles],
							}}
						/>
					</Tooltip>
				</div> : null
		);
	}
}

function mapStateToProps(state) {
	return {
		monitor: state.monitor,
		machine: state.machine,
	};
}


function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(MachineNameComponent));
