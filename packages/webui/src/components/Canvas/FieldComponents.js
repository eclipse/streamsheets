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
import MaterialCheckbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import MaterialTextField from '@material-ui/core/TextField';
import { Field } from '@cedalo/sdk-streams';
import PropTypes from 'prop-types';
import React from 'react';
import { graphManager } from '../../GraphManager';
import CellRangeComponent from './CellRangeComponent';

const getInLocale = (value, locale = 'en') => {
	if (typeof value === 'string') {
		return value;
	}
	return value && value[locale];
};

export function CheckBox(props) {
	const {
		field, value, locale = 'en', onChange, styles, onFocus,
	} = props;

	return (<FormControlLabel
		style={styles.label}
		control={
			<MaterialCheckbox
				checked={!!value}
				value={!!value}
				onChange={onChange}
				onFocus={onFocus}
				id={field.id}
				name={field.id}
			/>
		}
		label={field.getLabel(locale)}
	/>);
}

CheckBox.propTypes = {
	field: PropTypes.object.isRequired,
	locale: PropTypes.string.isRequired,
	value: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	onFocus: PropTypes.func,
	styles: PropTypes.object,
};

CheckBox.defaultProps = {
	onFocus: () => {},
	styles: {
		label: {
			padding: '8px',
		},
	},
};

export function RangeTextField(props) {
	const {
		field, value, disabled = false, locale = 'en', onChange, onBlur, onFocus, styles,
	} = props;
	const _value = value === undefined || value === null ? '' : value;


	return (
		<FormControl
			style={styles.formControl}
		>
			<CellRangeComponent
				sheetView={graphManager.getActiveSheetView()}
				label={field.getLabel(locale)}
				id={field.id}
				name={field.id}
				disabled={disabled}
				helperText={getInLocale(field.help, locale) || ''}
				range={`${_value}`}
				onChange={onChange}
				required={field.required}
				onBlur={onBlur}
				onFocus={onFocus}
				placeholder={field.typeName}
			/>
			</FormControl>
	);
}

RangeTextField.propTypes = {
	field: PropTypes.object.isRequired,
	value: PropTypes.any.isRequired,
	locale: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onFocus: PropTypes.func,
	onBlur: PropTypes.func,
	disabled: PropTypes.bool,
	styles: PropTypes.object,
};

RangeTextField.defaultProps = {
	onBlur: () => { },
	onFocus: () => { },
	disabled: false,
	styles: {
		label: {},
		formControl: {
			width: '95%',
			margin: '8px',
		},
	},
};

export function TextField(props) {
	const {
		field, value, disabled = false, locale = 'en', onChange, onBlur, onFocus, styles,
	} = props;
	const _value = value === undefined || value === null ? '' : value;


	return (
		// <FormControl

		// >
		<MaterialTextField
			style={styles.formControl}
			label={field.getLabel(locale)}
			id={field.id}
			name={field.id}
			disabled={disabled}
			helperText={getInLocale(field.help, locale) || ''}
			value={`${_value}`}
			onChange={onChange}
			required={field.required}
			onBlur={onBlur}
			onFocus={onFocus}
			placeholder={field.typeName}
		/>
		//  </FormControl>
	);
}

TextField.propTypes = {
	field: PropTypes.object.isRequired,
	value: PropTypes.any.isRequired,
	locale: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onFocus: PropTypes.func,
	onBlur: PropTypes.func,
	disabled: PropTypes.bool,
	styles: PropTypes.object,
};

TextField.defaultProps = {
	onBlur: () => { },
	onFocus: () => { },
	disabled: false,
	styles: {
		label: {},
		formControl: {
			width: '95%',
			margin: '8px',
		},
	},
};

export function Select(props) {
	const {
		field, value, locale = 'en', onChange, styles, onFocus,
	} = props;
	const _value = value === undefined || value === null ? '' : value;

	const getOptionLabel = (option) => {
		if (option) {
			if (typeof option === 'string') {
				return option;
			}
			return option[locale];
		}
		return null;
	};
	return (
		<FormControl
			style={styles.formControl}
		>
			<MaterialTextField
				label={field.getLabel(locale)}
				select
				name={field.id}
				fullWidth
				value={_value}
				onChange={onChange}
				onFocus={onFocus}
				input={<Input id={field.id} />}
			>
				{field.options.map(option =>
					(
						<MenuItem
							key={option.value}
							value={option.value}
						>
							{getOptionLabel(option.label)}
						</MenuItem>
					))}
			</MaterialTextField>
		</FormControl>
	);
}

Select.propTypes = {
	field: PropTypes.object.isRequired,
	value: PropTypes.string.isRequired,
	locale: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onFocus: PropTypes.func,
	styles: PropTypes.object,
};

Select.defaultProps = {
	onFocus: () => {},
	styles: {
		formControl: {
			margin: '8px',
			width: '95%',
		},
	},
};

export function FieldComponent(props) {
	switch (props.field.type) {
	case Field.TYPES.CHECKBOX:
		return <CheckBox {...props} />;
	case Field.TYPES.SELECT:
		return <Select {...props} />;
	case Field.TYPES.SHEET_RANGE:
	case Field.TYPES.SHEET_REF:
		return <RangeTextField
			{...props}
		/>;
	default:
		return <TextField {...props} />;
	}
}

FieldComponent.propTypes = {
	field: PropTypes.object.isRequired,
};
