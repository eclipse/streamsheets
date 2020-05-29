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
import { FormattedMessage, injectIntl } from 'react-intl';
import styles from '../styles';

const VALID_CHARS =  'a-zA-Z0-9_';

class NameField extends React.Component{
	constructor(props){
		super(props);
		this.nameRef = React.createRef();
		this.ERROR_MESSAGES = {
			DUPLICATE: this.props.intl.formatMessage({
				id: 'Admin.duplicateName',
				defaultMessage: 'Name already taken, please select unique name',
			}),
			EMPTY: this.props.intl.formatMessage({
				id: 'Admin.emptyName',
				defaultMessage: 'Name cannot be empty',
			})
		};
		this.state = {
			helperText: ''
		};
	}

	componentDidMount() {
		this.validate(this.props.value);
	}

	componentDidUpdate() {
		if(this.start) {
			this.nameRef.selectionStart = this.start;
			this.nameRef.selectionEnd = this.start;
		}
	}

	onChange = (event) => {
		event.preventDefault();
		const {onNameChange} = this.props;
		const newValue = event.target.value
			.replace(' ', '_')
			.replace(/[^a-zA-Z0-9_]/, '');
		this.start = event.target.selectionStart;
		event.target.value = newValue;
		onNameChange(event);
		this.validate(newValue);
	};

	validate = (name) => {
		let res = true;
		let helperText = '';
		if(name.length < 1) {
			helperText = this.ERROR_MESSAGES.EMPTY;
			res = false;
		} else {
			const existing =  this.props.getResources().filter(
				c => c.name.toLowerCase() === name.toLowerCase());
			if(existing.length > 0) {
				helperText = this.ERROR_MESSAGES.DUPLICATE;
				res = false;
			} else if(this.state.helperText.length>0) {
				helperText = '';
			}
		}
		if(!res) {
			helperText = `${helperText} (${VALID_CHARS})`;
		}
		this.setState({helperText});
		this.props.onValidate(res, helperText);
		return res;
	};

	render() {
		const {value} = this.props;

		return (
			<div>
				<TextField
					inputRef={el => {this.nameRef = el}}
					label={<FormattedMessage id="Stream.NameField" defaultMessage="Name" />}
					id="name"
					name="name"
					fullWidth
					margin="normal"
					value={`${value}`}
					style={styles.textField}
					onChange={this.onChange}
					onKeyDown={this.handleKeyDown}
					error={this.state.helperText.length>0}
					helperText={this.state.helperText}
					{...this.props}
				/>
			</div>
		);
	}

}

NameField.propTypes = {
	onNameChange: PropTypes.func.isRequired,
	onValidate: PropTypes.func,
	value: PropTypes.string.isRequired,
	intl:PropTypes.shape({
		formatMessage: PropTypes.func
	}).isRequired,
	getResources: PropTypes.func.isRequired,
};

NameField.defaultProps = {
	onValidate: () => {}
};

export default injectIntl(NameField);
