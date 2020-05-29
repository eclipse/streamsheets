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
import React from 'react';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import styles from '../styles';
import Constants from '../../../constants/AdminConstants';

export default class FormElements {
	constructor(props) {
		this.props = { ...props };
		this.handler = this.handler.bind(this);
		this.handleFileRead = this.handleFileRead.bind(this);
	}

	static setValueByPath(model, value, pathS) {
		const path = pathS.split('.');
		if (path.length === 1) model[path[0]] = value;
		else if (path.length === 2) model[path[0]][path[1]] = value;
		else if (path.length === 3) model[path[0]][path[1]][path[2]] = value;
		else model[path[0]] = value;
		return model;
	}

	static getValueByPath(model, pathS) {
		const path = pathS.split('.');
		if (path.length === 1) return model[path[0]];
		else if (path.length === 2) return model[path[0]][path[1]];
		else if (path.length === 3) return [path[0]][path[1]][path[2]];
		return model[path[0]];
	}

	unFocus = async (event) => {
		const { name } = event.target;
		const { model, validate, save } = this.props;
		const res = await validate(model, name, event.target.value);
		if (res.length === 0) {
			save();
		}
	};

	handler(event) {
		const { target } = event;
		const isCheckBox = target.type === 'checkbox';
		const value = (isCheckBox ? target.checked : target.value);
		let { model } = { ...this.props };
		model = FormElements.setValueByPath(model, value, target.name);
		if (target.name === 'expectResponse' && value === false) {
			model.responseTimeout = null;
		}
		if (target.name === 'connector.name') {
			const connectorName = value;
			const newConnector = this.props[Constants.CONFIG_TYPE.ConnectorConfiguration]
				.filter(a => a.name === connectorName)[0];
			model.connector.name = newConnector.name;
			model.connector.id = newConnector.id;
			model.connector._id = newConnector.id;
		}
		this.props.handle(model);
	}

	onChange = (event) => {
		this.handler(event);
		this.unFocus(event);
	};

	/* eslint-disable no-unused-vars */
	toggleInherited(event) {
		// event.target.disabled = !event.target.disabled;
	}

	async handleFileRead(event) {
		let { model } = { ...this.props };
		const { save, validate } = { ...this.props };
		const file = event.target.files[0];
		const inputName = `${event.target.name}Payload`;
		// if (file.type.endsWith('ca-cert')) {
		if (file) {
			model = FormElements.setValueByPath(model, file.name, event.target.name);
			this.props.handle(model);
			const reader = new FileReader();
			reader.onload = async () => {
				// convert appropriate for json
				let newValue = reader.result.replace(/(\r\n|\n|\r)/gm, '\\n');
				if (newValue.lastIndexOf('\\n') === newValue.length - 2) {
					newValue = newValue.slice(0, -2);
				}
				model = FormElements.setValueByPath(model, newValue, inputName);
				this.props.handle(model);
				const res = await validate(model, inputName, newValue);
				if (res.length === 0) {
					save();
				}
			};
			reader.readAsText(file);
		}
		// } else {
		//	model = FormElements.setValueByPath(model, `File ${file.type} not supported!`, inputName);
		// }
	}

	getCheckBox(id, label, value) {
		return (<FormControlLabel
			control={
				<Checkbox
					checked={!!value}
					onChange={this.handler}
					value={!!value}
					onBlur={this.unFocus}
					id={id}
					name={id}
				/>
			}
			label={label}
		/>);
	}

	getFileTextInput(id, label, value) {
		const pathId = `path${id}`;
		const textId = `${id}Payload`;
		return (
			<FormControl
				fullWidth
				style={{
					marginTop: '30px',
				}}
			>
				<label htmlFor={id} style={styles.label}><strong>{label}: </strong>
					<span id={pathId} style={{ fontWeight: 'normal', fontSize: '90%' }}>{value}</span>
				</label>
				<Input
					type="file"
					id={id}
					name={id}
					style={{
						float: 'right',
					}}
					onChange={this.handleFileRead}
				/>
			</FormControl>);
	}

	getTextField(id, label, value, disabled = false, helperText) {
		value = value || '';
		return (
			<TextField
				label={label}
				id={id}
				name={id}
				fullWidth
				disabled={disabled}
				helperText={helperText}
				value={`${value}`}
				onChange={this.handler}
				onBlur={this.unFocus}
				onDoubleClick={this.toggleInherited}
				style={styles.textField}
			/>
		);
	}

	getNumberField(id, label, value, disabled = false) {
		value = value || '';
		return (
			<TextField
				type="number"
				inputProps={{ min: '0' }}
				label={label}
				id={id}
				name={id}
				fullWidth
				disabled={disabled}
				value={`${value}`}
				onBlur={this.unFocus}
				onChange={this.handler}
				onDoubleClick={this.toggleInherited}
				style={styles.textField}
			/>
		);
	}

	getTextArea(id, label, value, disabled = false) {
		value = value || '';
		return (
			<TextField
				label={label}
				multiline
				rowsMax="4"
				fullWidth
				id={id}
				name={id}
				onBlur={this.unFocus}
				value={`${value}`}
				style={styles.textField}
				disabled={disabled}
				onChange={this.handler}
			/>);
	}

	getSelect(id, label, value, options) {
		value = value || '';
		return (
			<FormControl fullWidth style={styles.formControl}>
				<InputLabel fullWidth htmlFor={id} style={styles.label}>{label}</InputLabel>
				<Select
					autoWidth
					name={id}
					fullWidth
					value={value}
					onChange={this.onChange}
					input={<Input id={id} />}
				>
					{options.map(option =>
						<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
				</Select>
			</FormControl>
		);
	}
}
