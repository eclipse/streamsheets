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
	Field
} from '@cedalo/sdk-streams';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Tooltip from '@material-ui/core/Tooltip';
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
import { AdminField } from '../Admin/AdminField';

export default class StreamFieldComponents {
	constructor(props, fieldErrors) {
		this.props = { ...props };
		this.locale = this.props.locale || 'en';

		this.state = {
			fieldErrors
		};

		this.onStreamCommand = this.onStreamCommand.bind(this);
	}

	getComponents(configuration, disabled = false) {
		const { definition } = configuration.provider;
		let fields = [];
		const errors = this.state.fieldErrors;

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
			main: [], advanced: []
		};
		if (fields && Array.isArray(fields)) {
			fields.forEach((field) => {
				const fieldValues = {
					...configuration.fields,
					connector: configuration.connector ? configuration.connector.fields : undefined
				};
				if (field.isShow(fieldValues)) {
					const value = configuration.fields[field.id];
					field.value = value;
					field.baseValue = field.getBaseValue(configuration);
					const component = this.getComponent(field, value, !!field.disabled || disabled,
						errors ? errors[field.id] : undefined);
					if (component) {
						if (field.advanced === true) {
							components.advanced.push(component);
						} else {
							components.main.push(component);
						}
					}
				}
			});
		}

		const mime = this.getSelect(new Field({
			id: 'mimeType', label: {
				en: 'Data Format', de: 'Datei Format'
			}, options: [{
				label: 'Auto', value: 'auto'
			}, {
				label: 'JSON', value: 'application/json'
			}, {
				label: 'XML', value: 'application/xml'
			}, {
				label: 'STRING', value: 'text/plain'
			}, {
				label: 'Buffer', value: 'buffer'
			}, 
			],
			help: {
				en: 'Data Format of payload',
				de: 'Payload Datenformat',
			},
			defaultValue: 'auto'
		}), configuration.mimeType || 'auto', false);
		components.advanced.push(mime);

		return components;
	}

	getComponent(field, value, disabled, error) {
		switch (field.type || Field.TYPES.TEXT) {
		case Field.TYPES.TEXT: {
			return this.getTextField(field, field.value, disabled, error);
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
			return <AdminField field={field} locale={this.locale} onChange={this.onChange} value={value}
							   disabled={disabled} />;
		}
		case Field.TYPES.RANDOM_STRING: {
			return <AdminField field={field} locale={this.locale} onChange={this.onChange} value={value}
							   disabled={disabled} />;
		}
		case Field.TYPES.PASSWORD: {
			return <AdminField
					field={field}
					locale={this.locale} onChange={this.onChange} value={value} disabled={disabled} />
		}
		default: {
			return this.getTextField(field, field.value, disabled, error);
		}
		}
	}

	handler = (event) => {
		const { target } = event;
		const isCheckBox = target.type === 'checkbox';
		const value = (isCheckBox ? target.checked : target.value);
		const configuration = this.configuration;

		if (target.name === 'connector.id') {
			const newConnector = this.props.streams[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
				.filter(a => a.id === value)[0];
			configuration.connector = StreamHelper.getInstanceFromObject(newConnector, this.props.streams);
		} else if (configuration.fields && Object.keys(configuration.fields).includes(target.name)) {
			configuration.setFieldValue(target.name, value);
			const fieldErrors = this.state.fieldErrors;
			if (fieldErrors && fieldErrors[target.name] !== undefined) {
				fieldErrors[target.name] = undefined;
			}
		} else {
			configuration[target.name] = configuration[target.name] || {};
			jp.value(configuration, target.name, value);
		}

		this.props.handleChange(this.configuration);
	};

	async handleFileRead(event) {
		const { model } = { ...this.props };
		const { save, validate } = { ...this.props };
		const file = event.target.files[0];
		const name = `${event.target.name}`;
		// if (file.type.endsWith('ca-cert')) {
		if (file) {
			this.props.handle(model);
			const reader = new FileReader();
			reader.onload = async () => {
				// convert appropriate for json
				let newValue = reader.result.replace(/(\r\n|\n|\r)/gm, '\\n');
				if (newValue.lastIndexOf('\\n') === newValue.length - 2) {
					newValue = newValue.slice(0, -2);
				}
				const valueObj = {
					path: file.name, value: newValue
				};
				try {
					jp.value(model, name, valueObj);
				} catch (e) {
					model[name] = model[name] || {};
					jp.value(model, name, valueObj);
				}
				this.props.handle(model);
				const res = await validate(model, name, newValue);
				if (res.length === 0) {
					const saveObject = {
						id: model._id || model.id, type: model.className, $set: {
							[name]: valueObj
						}
					};
					save(saveObject, this.props);
				}
			};
			reader.readAsText(file);
		}
	}

	onChange = (event) => {
		this.handler(event);
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

	getNamedList(field, value, disabled) {
		value = (!value || !Array.isArray(value)) ? [] : value;
		return (<FormControl
			disabled={disabled}
			fullWidth
			style={{
				marginTop: '30px'
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
		</FormControl>);
	}

	getMultiTextField(field, value, disabled = false) {
		return <MultipleTextField
			label={field.getLabel(this.locale)}
			disabled={disabled}
			key={field.id}
			name={field.id}
			baseValue={field.baseValue}
			onChange={this.handler}
			values={value}
		/>;
	}

	getCheckBox(field, value, disabled = false) {
		return (<Tooltip
			title={field.getHelp(this.locale)} placement='top-start'
		>
			<FormControlLabel
				style={{
					marginTop: '5px', display: 'flex'
				}}
				key={field.id}
				disabled={disabled}
				control={<Checkbox
					checked={!!value}
					onChange={this.handler}
					value={`${value}`}
					id={field.id}
					name={field.id}
					disabled={disabled}
				/>}
				label={field.getLabel(this.locale)}
			/>
		</Tooltip>);
	}

	getFileTextInput(field, valueObj, disabled) {
		const pathId = `path${field.id}`;
		const { path } = valueObj;
		return (<FormControl
			disabled={disabled}
			fullWidth
			key={field.id}
			style={{
				marginTop: '30px'
			}}
		>
			<label htmlFor={field.id} style={styles.label}><strong>{field.getLabel(this.locale)}: </strong>
				<span id={pathId} style={{ fontWeight: 'normal', fontSize: '90%' }}>{path}</span>
			</label>
			<Input
				type='file'
				id={field.id}
				name={field.id}
				style={{
					float: 'right'
				}}
				onChange={this.handleFileRead}
			/>
		</FormControl>);
	}

	getFileSecret(field, valueObj, disabled = false) {
		// const pathId = `path${field.id}`;
		// let path = '';
		// if (valueObj) {
		// 	(((((({ path } = valueObj))))));
		// }
		return (<FormControl
			fullWidth
			key={field.id}
			style={{
				display: 'flex', flexDirection: 'column'
			}}
		>
			<InputLabel style={{ position: 'relative', marginBottom: '10px' }} htmlFor={field.id}>{field.getLabel(
				this.locale)}</InputLabel>

			{/*<label htmlFor={field.id} style={styles.label}><strong>{field.getLabel(this.locale)}: </strong>*/}
			{/*	<span id={pathId} style={{ fontWeight: 'normal', fontSize: '90%' }}>{path}</span>*/}
			{/*</label>*/}
			<Input
				disabled={disabled}
				type='file'
				id={field.id}
				name={field.id}
				style={{
					float: 'right'
				}}
				onChange={this.handleFileRead}
			/>
		</FormControl>);
	}

	getTextField(field, value, disabled = false, error) {
		value = value || '';
		return (<div
			key={field.id}
		>
			<Tooltip
				title={field.getHelp(this.locale)} placement='top-start'
			>
				<TextField
					label={field.getLabel(this.locale)}
					variant='outlined'
					size='small'
					id={field.id}
					name={field.id}
					fullWidth
					error={error}
					margin='normal'
					disabled={disabled}
					helperText={error}
					defaultValue={`${value}`}
					onBlur={this.handler}
					style={styles.textField}
				/>
			</Tooltip>
		</div>);
	}

	getNumberField(field, value, disabled = false) {
		value = value || '';
		return (<div
			key={field.id}
		>
			<Tooltip
				title={field.getHelp(this.locale)} placement='top-start'
			>
				<TextField
					type='number'
					variant='outlined'
					size='small'
					inputProps={{ min: '0' }}
					label={field.getLabel(this.locale)}
					id={field.id}
					name={field.id}
					fullWidth
					margin='normal'
					disabled={disabled}
					defaultValue={`${value}`}
					onChange={this.handler}
					style={styles.textField}
				/>
			</Tooltip>
		</div>);
	}

	getTextArea(field, value, disabled = false) {
		value = value || '';
		return (<div
			key={field.id}
		>
			<Tooltip
				title={field.getHelp(this.locale)} placement='top-start'
			>
				<TextField
					label={field.getLabel(this.locale)}
					variant='outlined'
					size='small'
					multiline
					rowsMax='4'
					fullWidth
					margin='normal'
					id={field.id}
					name={field.id}
					defaultValue={`${value}`}
					style={styles.textField}
					disabled={disabled}
					onChange={this.handler}
				/>
			</Tooltip>
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
		return (<div
			key={field.id}
		>
			<Tooltip
				title={field.getHelp(this.locale)} placement='top-start'
			>
				<TextField
					select
					label={field.getLabel(this.locale)}
					fullWidth
					margin='normal'
					disabled={disabled}
					variant='outlined'
					size='small'
					multiple={multiple}
					autoWidth
					name={field.id}
					value={value}
					onChange={this.onChange}
					input={<Input id={field.id} />}
				>
					{field.options.map(option => (<MenuItem
						key={option.value}
						value={option.value}
					>
						{getOptionLabel(option.label, this.locale)}
					</MenuItem>))}
				</TextField>
			</Tooltip>
		</div>);
	}

	getButton(field, value, disabled = false) {
		value = value || '';
		return (<FormControl
			key={field.id}
			style={{
				paddingTop: '20px'
			}}
		>
			<Button
				name={field.id}
				disabled={disabled}
				value={value}
				htmlFor={field.id}
				variant='outlined'
				onClick={event => this.onStreamCommand(event, field)}
			>
				{field.getLabel(this.locale)}
			</Button>
		</FormControl>);
	}
}
