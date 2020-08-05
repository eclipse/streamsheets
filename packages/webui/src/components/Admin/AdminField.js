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
/* eslint-disable react/forbid-prop-types */
import React, {useState} from 'react';
import MaterialIconButton from '@material-ui/core/IconButton';
import MaterialTextField from '@material-ui/core/TextField';
import IconReload from '@material-ui/icons/Autorenew';

import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import { Field } from '@cedalo/sdk-streams';
import PropTypes from 'prop-types';
import MultiTextFieldPairs
	from '../base/multiTextFieldPairs/MultiTextFieldPairs';

const DEF_FIELD_PROPS = {
	field: PropTypes.object.isRequired,
	locale: PropTypes.string.isRequired,
	value: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	disabled: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	styles: PropTypes.object,
};

const DEF_FIELD_DEFAULT_PROPS = {
	styles: {
	},
};

export function PasswordField(props) {
	const {
		field, value, locale = 'en', onChange, styles, disabled = false
	} = props;
	const name = field.id;
	const id = `password-id-${field.id}`;
	const [password, setPassword] = useState(value);
	const [showPassword, setShowPassword] = useState(false);

	const handleChange  = event => {
		const pass = event.target.value;
		setPassword(pass);
		onChange({
			target: {
				name: field.id,
				value: pass,
				type: 'PasswordField',
			}
		});
	};

	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleMouseDownPassword = event => {
		event.preventDefault();
	};

	return (
			<FormControl fullWidth>
				<InputLabel htmlFor={id}>{field.getLabel(locale)}</InputLabel>
				<Input
					name={name}
					style={styles}
					disabled={disabled}
					id={id}
					autoComplete="new-password"
					inputProps= {{
						autoComplete:"new-password"
					}}
					type={showPassword ? 'text' : 'password'}
					value={password}
					onChange={handleChange}
					endAdornment={
						<InputAdornment position="end">
							<MaterialIconButton
								aria-label="toggle password visibility"
								onClick={handleClickShowPassword}
								onMouseDown={handleMouseDownPassword}
							>
								{showPassword ? <Visibility /> : <VisibilityOff />}
							</MaterialIconButton>
						</InputAdornment>
					}
				/>
			</FormControl>
	);
}
PasswordField.propTypes = {
	...DEF_FIELD_PROPS
};

PasswordField.defaultProps = {
	...DEF_FIELD_DEFAULT_PROPS
};

export function MultipleTextFieldPairs(props) {
	const {
		field, value, locale = 'en', onChange, styles, disabled = false
	} = props;

	return (<MultiTextFieldPairs
		name={field.id}
		style={styles}
		disabled={disabled}
		value={value}
		label={field.getLabel(locale)}
		onChange={onChange}
	/>);
}

MultipleTextFieldPairs.propTypes = {
	...DEF_FIELD_PROPS
};

MultipleTextFieldPairs.defaultProps = {
	...DEF_FIELD_DEFAULT_PROPS
};

export class RandomStringField extends React.Component {
	static propTypes = {
		...DEF_FIELD_PROPS,
	};

	static defaultProps = {
		...DEF_FIELD_DEFAULT_PROPS,
	};

	onChange = (event) => {
		const {field} = this.props;
		const {value} = event.target;
		this.props.onChange({
			target: {
				name: field.id,
				value,
				type: 'RandomStringField',
			}
		});
	};

	generate = () => {
		const {field} = this.props;
		const value = Field.generateRandom();
		field.value = value;
		this.props.onChange({
			target: {
				name: field.id,
				value,
				type: 'RandomStringField',
			}
		});
	};

	render() {
		const {
			field = new Field({
				type: Field.TYPES.TEXT
			}), value, locale = 'en', styles, disabled = false
		} = this.props;
		return (
			<React.Fragment>
				<MaterialTextField
					name={field.id}
					cols={80}
					style={{width: '80%', ...styles}}
					helperText={field.getHelp(locale)}
					disabled={disabled}
					value={value}
					label={field.getLabel(locale)}
					onChange={this.onChange}
				/>
				<MaterialIconButton
					size="small"
					name={`${field.id}button`}
					htmlFor={field.id}
					variant="outlined"
					onClick={this.generate}
				>
					<IconReload/>
				</MaterialIconButton>
			</React.Fragment>
		);
	}
}


export function TextField(props) {
	const {
		field = new Field({
			type: Field.TYPES.TEXT
		}), value, locale = 'en', onChange, styles, disabled = false
	} = props;

	return (<TextField
		label={field.getLabel(locale)}
		id={field.id}
		name={field.id}
		fullWidth
		margin="normal"
		disabled={disabled}
		helperText={field.getHelp(locale)}
		defaultValue={`${value || ''}`}
		onChange={onChange}
		style={styles.textField}
	/>);
}

TextField.propTypes = {
	...DEF_FIELD_PROPS
};

TextField.defaultProps = {
	...DEF_FIELD_DEFAULT_PROPS
};

export function AdminField(props) {
	switch (props.field.type) {
	case Field.TYPES.MULTITEXTFIELDPAIRS:
		return <MultipleTextFieldPairs field={props.field} locale={props.locale} onChange={props.onChange} value={props.value} disabled={props.disabled} />;
	case Field.TYPES.RANDOM_STRING:
		return <RandomStringField field={props.field} locale={props.locale} onChange={props.onChange} value={props.value} disabled={props.disabled} />;
	case Field.TYPES.PASSWORD:
		return <PasswordField field={props.field} locale={props.locale} onChange={props.onChange} value={props.value} disabled={props.disabled} />;
	default:
		return <TextField field={props.field} locale={props.locale} onChange={props.onChange} value={props.value} disabled={props.disabled}/>;
	}
}

AdminField.propTypes = {
	...DEF_FIELD_PROPS
};
