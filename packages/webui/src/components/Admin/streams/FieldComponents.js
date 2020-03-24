import React from 'react';
import jp from 'jsonpath';
import {
	ProviderConfiguration,
	ConsumerConfiguration,
	ConnectorConfiguration,
	ProducerConfiguration,
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
import NamedListInput from '../../base/listInput/NamedListInput';
import styles from '../styles';
import StreamHelper from '../../../helper/StreamHelper';
import AdminConstants from '../../../constants/AdminConstants';
import MultipleTextField from '../../base/multipleTextField/MultipleTextField';
import { AdminField } from '../AdminField';

export default class FieldComponents {
	constructor(props, model) {
		this.id = null;
		this.props = { ...props };
		this.model = this.props.model;
		this.locale = this.props.locale || 'en';
		this.handler = this.handler.bind(this);
		this.unFocus = this.unFocus.bind(this);
		this.save = this.save.bind(this);
		this.handleFileRead = this.handleFileRead.bind(this);
		this.onStreamCommand = this.onStreamCommand.bind(this);
		this.savedConfiguration = {...model};
		this.model = {...model};
		this.errorsMap = new Map();
	}

	getComponents(model, disabled = false) {
		this.id = model.id;
		const provider = StreamHelper.getProviderForModel(model, this.props);
		const providerConfiguration = new ProviderConfiguration(provider);
		let configuration;
		if (model.className === 'ConnectorConfiguration') {
			configuration = new ConnectorConfiguration(model, providerConfiguration);
		} else if (model.className === AdminConstants.CONFIG_CLASS.ConsumerConfiguration) {
			configuration = new ConsumerConfiguration(
				model,
				new ConnectorConfiguration(model.connector), providerConfiguration,
			);
		} else if (model.className === 'ProducerConfiguration') {
			configuration = new ProducerConfiguration(
				model,
				new ConnectorConfiguration(model.connector), providerConfiguration,
			);
		}
		const { definition } = providerConfiguration;
		let fields = [];
		if (configuration.className === AdminConstants.CONFIG_CLASS.ConsumerConfiguration) {
			fields = [...definition.consumer];
			model.connector = StreamHelper.getConfiguration(this.props, model.connector.id);
		} else if (configuration.className === 'ProducerConfiguration') {
			fields = [...definition.producer];
			model.connector = StreamHelper.getConfiguration(this.props, model.connector.id);
		} else if (configuration.className === 'ConnectorConfiguration') {
			fields = [...definition.connector];
		}
		const components = {
			main: [],
			advanced: []
		};
		if (fields && Array.isArray(fields)) {
			fields.forEach((field) => {
				if (field.isShow(model)) {
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
		const { validate, save } = this.props;
		const res = await validate(model, name, model[name]);
		if(res.length>0) {
			this.errorsMap.set(name, res[0]);
		} else {
			this.errorsMap.delete(name);
		}
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

	async unFocus(event) {
		const { name } = event.target;
		return this.save(this.model, name);
	}

	handler(event) {
		const { target } = event;
		const isCheckBox = target.type === 'checkbox';
		const value = (isCheckBox ? target.checked : target.value);
		let  model = { ...this.props.model, connector: { ...this.props.model.connector} };
		if (target.name === 'connector.id') {
			const newConnector = this.props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
				.filter(a => a.id === value)[0];
			model.connector.name = newConnector.name;
			model.connector.id = newConnector.id;
			model.connector._id = newConnector.id;
			const configuration = StreamHelper.getInstanceFromObject(model, this.props);
			model = configuration.toJSON();
		} else {
			const configuration = StreamHelper.getInstanceFromObject(model, this.props);
			if (configuration.fields && Object.keys(configuration.fields).includes(target.name)) {
				configuration.setFieldValue(target.name, value);
				model = configuration.toJSON();
				jp.value(model, target.name, model[target.name]);
			} else {
				model[target.name] = model[target.name] || {};
				jp.value(model, target.name, value);
			}
		}
		this.model = model;
		this.props.handle(model);
		this.unFocus(event);
	}

	onChange = (event) => {
		this.handler(event);
		this.unFocus(event);
	};

	onStreamCommand = (event, field) => {
		this.props.executeStreamCommand({
			cmdType: 'custom',
			value: event.target.value,
			cmdId: field.id,
			streamId: this.id,
			className: this.model.className
		});
	};

	/* eslint-disable no-unused-vars */
	toggleInherited(event) {
		// event.target.disabled = !event.target.disabled;
	}

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
					path: file.name,
					value: newValue,
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
						id: model._id || model.id,
						type: model.className,
						$set: {
							[name]: valueObj,
						},
					};
					save(saveObject, this.props);
				}
			};
			reader.readAsText(file);
		}
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
				marginTop: '20px',
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
				<InputLabel fullWidth htmlFor={field.id} style={styles.label}>{field.getLabel(this.locale)}</InputLabel>
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
