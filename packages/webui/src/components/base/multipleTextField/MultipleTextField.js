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
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton, FormHelperText, TextField, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Clear';
import { FormattedMessage } from 'react-intl';

const styles = {
	fab: {
		width: '25px',
		height: '20px',
		minHeight: '25px',
		marginTop: '5px',
		marginLeft: '10px',
	},
	textField: {
		width: 'calc(60%)',
		marginLeft: '10px',
	},
};
export default class MultipleTextField extends Component {
	static propTypes = {
		values: PropTypes.arrayOf(PropTypes.string),
		onChange: PropTypes.func,
		label: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
		name: PropTypes.string,
		disabled: PropTypes.bool,
	};

	static defaultProps = {
		label: undefined,
		values: [],
		onChange: undefined,
		name: new Date().getMilliseconds(),
		disabled: false,
	};

	constructor(props) {
		super(props);
		this.errors = [];
		this.state = {
			values: props.values || [],
		};
	}

	onChangeData = idx => (event) => {
		const newValues = this.state.values.map((value, sidx) => {
			if (idx !== sidx) return value;
			this.errors[idx] = null;
			return event.target.value;
		});
		this.setState({ values: newValues });
	};

	onBlur = idx => (event) => {
		const newValues = this.state.values.map((value, sidx) => {
			if (idx !== sidx) return value;
			this.errors[idx] = null;
			return event.target.value;
		});
		if (typeof this.props.onChange === 'function') {
			const fakeEvent = {
				target: {
					name: this.props.name,
					value: newValues,
					type: 'multitextfield',
				},
			};
			this.props.onChange(fakeEvent, newValues, idx, event);
		}
		this.setState({ values: newValues });
	};

	handleAddItem = () => {
		const values = this.state.values.concat(['']);
		if (typeof this.props.onChange === 'function') {
			const fakeEvent = {
				target: {
					name: this.props.name,
					value: values,
					type: 'multitextfield',
				},
			};
			this.props.onChange(fakeEvent, values, this.state.values.length);
		}
		this.setState({
			values,
		});
	};

	handleRemoveItem = idx => () => {
		const values = this.state.values.filter((s, sidx) => idx !== sidx);
		this.setState({
			values,
		});
		if (typeof this.props.onChange === 'function') {
			const fakeEvent = {
				target: {
					name: this.props.name,
					value: values,
					type: 'multitextfield',
				},
			};
			this.props.onChange(fakeEvent, values, idx);
		}

	};

	render() {
		const { label, name, disabled } = this.props;
		const { values } = this.state;
		return (
			<div style={{
				marginTop: '15px',
			}}>
				<Typography variant="subtitle1" style={{marginTop: '10px', marginBottom: '8px'}}>{label}</Typography>
				{values.map((value, idx) => (
					<div
						key={`mtf-${Math.random()}`}
						style={{
							marginBottom: '5px',
						}}
					>
						<TextField
							disabled={disabled}
							name={name}
							error={!!this.errors[idx]}
							defaultValue={value}
							onBlur={this.onBlur(idx)}
							// onChange={this.onChangeData(idx)}
							style={styles.textField}
						/>
						<IconButton
							size="small"
							onClick={this.handleRemoveItem(idx)}
							aria-label="Add"
							style={styles.fab}
						>
							<DeleteIcon/>
						</IconButton>
						{this.errors[idx]
							?
							<FormHelperText>{this.errors[idx]}</FormHelperText>
							: null}
					</div>
				))}
				<Button
					onClick={this.handleAddItem}
					size="small"
					style={{
						marginTop: '5px',
					}}
				>
					<AddIcon
						style={{
							fontSize: '20px',
							marginRight: '5px',
							marginBottom: '4px',
						}}
					/>
					<FormattedMessage id="Stream.AddTopic" defaultMessage="Add Topic"/>
				</Button>
			</div>
		);
	}
}
