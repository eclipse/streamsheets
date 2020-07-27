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
import jp from 'jsonpath';
import {
	Field,
} from '@cedalo/sdk-streams';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import NamedListInput from '../base/listInput/NamedListInput';
import styles from '../Admin/styles';
import StreamHelper from '../../helper/StreamHelper';
import AdminConstants from '../../constants/AdminConstants';
import MultipleTextField from '../base/multipleTextField/MultipleTextField';
import gatewayClient from '../../helper/GatewayClient';
import { AdminField } from '../Admin/AdminField';

const VALIDATION_QUERY = `
	query ValidateStream($provider: String!, type: String!, streamConfig: JSON!) {
		validateStream(provider: $provider, type: $type, streamConfig: $streamConfig) {
			valid
			fieldErrors
			config
		}
	}
`;


/**
 * usage: validate('@cedalo/stream-mqtt', 'consumer', {topic: 'test'});
 */
const validate = async (provider, type, streamConfig) => {
	try {
		const { validateStream } = await gatewayClient.graphql(VALIDATION_QUERY, { provider, type, streamConfig });
		return validateStream;
	} catch (error) {
		console.error(error);
	}
	return { valid: true, fieldErrors: {}, config: streamConfig };
};

export default class StreamFieldComponents {
	constructor(props) {
		this.props = { ...props };
		this.locale = this.props.locale || 'en';
		this.errorsMap = new Map();

		this.handler = this.handler.bind(this);
		this.unFocus = this.unFocus.bind(this);
		this.save = this.save.bind(this);
		this.onStreamCommand = this.onStreamCommand.bind(this);
	}

	getComponents(configuration, disabled = false) {
		const { definition } = configuration.provider;
		let fields = [];

		this.configuration = configuration;

		switch (configuration.className) {
		case AdminConstants.CONFIG_CLASS.ConsumerConfiguration:
			fields = [...definition.consumer];
			break;
		case AdminConstants.CONFIG_CLASS.ProducerConfiguration:
			fields = [...definition.producer];
			break;
		case AdminConstants.CONFIG_CLASS.ConnectorConfiguration:
			fields = [...definition.connector];
			break;
		default:
		}

		const components = {
			main: [],
			advanced: []
		};
		if (fields && Array.isArray(fields)) {
			fields.forEach((field) => {
				if (field.isShow(configuration)) {
					const value = configuration.fields[field.id];
					field.value = value;
					const component = this.getComponent(field, value, !!field.disabled || disabled);
					if (component) {
						if(field.advanced === true) {
							components.advanced.push(component);
						} else {
							components.main.push(component);
						}
					}
				}
			});
		}

		const mime = this.getSelect(
			new Field({
				id: 'mimeType',
				label: {
					en: 'Data Format',
					de: 'Datei Format',
				},
				options: [
					{
						label: 'Auto',
						value: 'auto',
					},
					{
						label: 'JSON',
						value: 'application/json',
					},
					{
						label: 'XML',
						value: 'application/xml',
					},
					{
						label: 'STRING',
						value: 'text/plain',
					},
				],
				defaultValue: 'auto',
			}),
			configuration.mimeType || 'auto', false
		);
		components.advanced.push(mime);

		return components;
	}

	getComponent(field, value, disabled) {
		switch (field.type || Field.TYPES.TEXT) {
		case Field.TYPES.TEXT: {
			return this.getTextField(field, field.value, disabled);
		}
		case Field.TYPES.SELECT: {
			return this.getSelect(field, field.value, disabled, undefined);
		}
		case Field.TYPES.SELECT_NUM: {
			return this.getSelect(field, field.value, disabled, undefined);
		}
		case Field.TYPES.MULTISELECT: {
			return this.getSelect(field, field.value, disabled, true);
		}
		case Field.TYPES.FILESECRET: {
			return this.getFileSecret(field, field.value, disabled);
		}
		case Field.TYPES.CHECKBOX: {
			return this.getCheckBox(field, field.value, disabled);
		}
		case Field.TYPES.BUTTON: {
			return this.getButton(field, field.value, disabled);
		}
		case Field.TYPES.MULTILINETEXT: {
			return this.getTextArea(field, field.value, disabled);
		}
		case Field.TYPES.TEXTLIST: {
			return this.getMultiTextField(field, field.value, disabled);
		}
		case Field.TYPES.MULTITEXTFIELDPAIRS: {
			return <AdminField field={field} locale={this.locale} onChange={this.onChange} value={value} disabled={disabled} />
		}
		case Field.TYPES.RANDOM_STRING: {
			return <AdminField field={field} locale={this.locale} onChange={this.onChange} value={value} disabled={disabled} />
		}
		case Field.TYPES.PASSWORD: {
			return <AdminField field={field} locale={this.locale} onChange={this.onChange} value={value} disabled={disabled} />
		}
		default: {
			return this.getTextField(field, field.value, disabled);
		}
		}
	}

	async save(model, name) {
		const { save } = this.props;
		// const res = await validate(model, name, model[name]);
		// if(res.length>0) {
		// 	this.errorsMap.set(name, res[0]);
		// } else {
		// 	this.errorsMap.delete(name);
		// }
		const saveObject = {
			id: model._id || model.id,
			type: model.className,
			error: this.errorsMap.size>0,
			$set: {
				[name]: jp.value(model, name),
			},
		};
		save(saveObject, this.props);
	}

	async unFocus() {
		// const { name } = event.target;
		validate('@cedalo/stream-mqtt', 'consumer', this.configuration).then(result => {
			console.log(result);
		});
	}

	handler(event) {
		const { target } = event;
		const isCheckBox = target.type === 'checkbox';
		const value = (isCheckBox ? target.checked : target.value);
		// let  model = { ...this.props.model, connector: { ...this.props.model.connector} };
		const configuration = this.configuration; // StreamHelper.getInstanceFromObject(model, this.props);

		if (target.name === 'connector.id') {
			const newConnector = this.props.streams[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
				.filter(a => a.id === value)[0];
			configuration.connector.name = newConnector.name;
			configuration.connector.id = newConnector.id;
			configuration.connector._id = newConnector.id;
			this.configuration = StreamHelper.getInstanceFromObject(configuration, this.props);
			// model = configuration.toJSON();
		} else if (configuration.fields && Object.keys(configuration.fields).includes(target.name)) {
			configuration.setFieldValue(target.name, value);
			// model = configuration.toJSON();
			// jp.value(model, target.name, model[target.name]);
		} else {
			configuration[target.name] = configuration[target.name] || {};
			jp.value(configuration, target.name, value);
		}

		// this.model = model;
		this.props.handleChange(this.configuration);
		this.unFocus(event);
	}

	onChange = (event) => {
		this.handler(event);
		// this.unFocus(event);
	};

	onStreamCommand = (event, field) => {
		this.props.executeStreamCommand({
			cmdType: 'custom',
			value: event.target.value,
			cmdId: field.id,
			streamId: this.model.id,
			className: this.model.className
		});
	};

	/* eslint-disable no-unused-vars */
	toggleInherited(event) {
		// event.target.disabled = !event.target.disabled;
	}

	getNamedList(field, value, disabled) {
		value = (!value || !Array.isArray(value)) ? [] : value;
		return (
			<FormControl
				disabled={disabled}
				fullWidth
				style={{
					marginTop: '30px',
				}}
			>
				<fieldset>
					<legend>{field.getLabel(this.locale)}</legend>
					<NamedListInput
						items={value}
						onChange={this.onChange}
						name={field.id}
					/>
				</fieldset>
			</FormControl>
		);
	}

	getMultiTextField(field, value, disabled = false){
		return <MultipleTextField
			label={field.getLabel(this.locale)}
			disabled={disabled}
			name={field.id}
			onChange={this.handler}
			values={value}
		/>
	}

	getCheckBox(field, value, disabled = false) {
		return (<FormControlLabel
			style={{
				// marginTop: '20px',
				display: 'flex',
			}}
			disabled={disabled}
			control={
				<Checkbox
					checked={!!value}
					onChange={this.handler}
					value={`${value}`}
					id={field.id}
					name={field.id}
					disabled={disabled}
				/>
			}
			label={field.getLabel(this.locale)}
		/>);
	}

	getFileTextInput(field, valueObj, disabled) {
		const pathId = `path${field.id}`;
		const { path, value } = valueObj;
		return (
			<FormControl
				disabled={disabled}
				fullWidth
				style={{
					marginTop: '30px',
				}}
			>
				<label htmlFor={field.id} style={styles.label}><strong>{field.getLabel(this.locale)}: </strong>
					<span id={pathId} style={{ fontWeight: 'normal', fontSize: '90%' }}>{path}</span>
				</label>
				<Input
					type="file"
					id={field.id}
					name={field.id}
					style={{
						float: 'right',
					}}
					onChange={this.handleFileRead}
				/>
			</FormControl>);
	}

	getFileSecret(field, valueObj, disabled = false) {
		const pathId = `path${field.id}`;
		let path = '';
		let value = '';
		if (valueObj) {
			(((((({ path, value } = valueObj))))));
		}
		return (
			<FormControl
				fullWidth
				style={{
					display: 'grid',
					marginTop: '30px',
				}}
			>
				<label htmlFor={field.id} style={styles.label}><strong>{field.getLabel(this.locale)}: </strong>
					<span id={pathId} style={{ fontWeight: 'normal', fontSize: '90%' }}>{path}</span>
				</label>
				<Input
					disabled={disabled}
					type="file"
					id={field.id}
					name={field.id}
					style={{
						float: 'right',
					}}
					onChange={this.handleFileRead}
				/>
			</FormControl>);
	}

	getTextField(field, value, disabled = false) {
		value = value || '';
		return (
			<div>
				<TextField
					label={field.getLabel(this.locale)}
					id={field.id}
					name={field.id}
					fullWidth
					margin="normal"
					disabled={disabled}
					helperText={field.getHelp(this.locale)}
					defaultValue={`${value}`}
					onChange={this.handler}
					style={styles.textField}
				/>
			</div>
		);
	}

	getNumberField(field, value, disabled = false) {
		value = value || '';
		return (
			<div>
				<TextField
					type="number"
					inputProps={{ min: '0' }}
					label={field.getLabel(this.locale)}
					id={field.id}
					name={field.id}
					fullWidth
					margin="normal"
					disabled={disabled}
					defaultValue={`${value}`}
					onChange={this.handler}
					// "Machine Service 3",
					onDoubleClick={this.toggleInherited}
					style={styles.textField}
				/>
			</div>
		);
	}

	getTextArea(field, value, disabled = false) {
		value = value || '';
		return (
			<div>
				<TextField
					label={field.getLabel(this.locale)}
					multiline
					rowsMax="4"
					fullWidth
					margin="normal"
					id={field.id}
					name={field.id}
					defaultValue={`${value}`}
					style={styles.textField}
					disabled={disabled}
					onChange={this.handler}
				/>
			</div>);
	}

	getSelect(field, value, disabled = false, multiple) {
		if (value === undefined || value === null) value = '';
		const getOptionLabel = (option, locale = 'en') => {
			if (option) {
				if (typeof option === 'string') {
					return option;
				}
				return option[locale];
			}
			return null;
		};
		field.options = field.options || [];
		return (
			<FormControl
				fullWidth
				margin="normal"
				disabled={disabled}
			>
				<InputLabel htmlFor={field.id} style={styles.label}>{field.getLabel(this.locale)}</InputLabel>
				<Select
					multiple={multiple}
					autoWidth
					name={field.id}
					fullWidth
					value={value}
					onChange={this.onChange}
					input={<Input id={field.id} />}
				>
					{field.options.map(option =>
						(
							<MenuItem
								key={option.value}
								value={option.value}
							>
								{getOptionLabel(option.label, this.locale)}
							</MenuItem>
						))}
				</Select>
			</FormControl>
		);
	}

	getButton(field, value, disabled = false) {
		value = value || '';
		return (
			<FormControl style={{
				paddingTop: '20px',
			}}
			>
				<Button
					name={field.id}
					value={value}
					htmlFor={field.id}
					variant="outlined"
					onClick={event => this.onStreamCommand(event, field)}
				>
					{field.getLabel(this.locale)}
				</Button>
			</FormControl>
		);
	}
}
