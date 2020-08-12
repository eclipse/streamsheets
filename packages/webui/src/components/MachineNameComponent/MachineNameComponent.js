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
		fontSize: '1.2rem',
	},
	focus: {
		color: 'white',
		marginTop: '4px',
		fontSize: '1.2rem',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
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

	static getDerivedStateFromProps(props, state) {
		return { ...state, machine: props.monitor.machine };
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
	// 	return referenceIdentifierRegEx.test(name );
	// }
	//
	render() {
		const { classes } = this.props;
		return (
			MachineHelper.isMachineDetailsPage() ?
				<div
					style={{
						width: `${Math.min(100, this.state.machine.name.length * 2)}%`,
						minWidth: '200px'
					}}
				>
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
							fullWidth
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
								classes:{
									underline: classes.underline,
								}
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
