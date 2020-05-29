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
import TextField from '@material-ui/core/TextField';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import FormHelperText from '@material-ui/core/FormHelperText';

const styles = {
	fieldSet: {
		margin: '20px 0px',
		display: 'flex',
		flexDirection: 'row'
	},
	legend: {
	},
	fab: {
		width: '25px',
		height: '20px',
		minHeight: '25px',
		marginTop: '15px',
		marginLeft: '10px',
	},
	textField: {
		display: 'inline',
		minWidth: '150px',
		width: 'calc(50% - 15px)',
		marginLeft: '5px'
	},
};

export default class MultiTextFieldPairs extends Component {
	static propTypes = {
		// eslint-disable-next-line react/forbid-prop-types
		value: PropTypes.object,
		onChange: PropTypes.func,
		label: PropTypes.element,
		name: PropTypes.string,
		disabled: PropTypes.bool,
	};

	static defaultProps = {
		label: undefined,
		value: [],
		onChange: undefined,
		name: new Date().getMilliseconds(),
		disabled: false,
	};

	constructor(props) {
		super(props);
		this.errors = [];
		this.state = {
			pairs: props.value || {},
		};
	}

	onChangeKey = (idx, pair) => (event) => {
		const prop = Object.keys(pair)[0];
		const newProp = event.target.value;
		const newPairs = {...this.state.pairs};
		newPairs[newProp] = pair[prop];
		delete newPairs[prop];
		if (typeof this.props.onChange === 'function') {
			const fakeEvent = {
				target: {
					name: this.props.name,
					value: newPairs,
					type: 'TextFieldsPair',
				},
			};
			this.props.onChange(fakeEvent, newPairs, idx, event);
		}
		this.setState({ pairs: newPairs });
	};

	onChangeValue = (idx, pair) => (event) => {
		const prop = Object.keys(pair)[0];
		const newPairs = {...this.state.pairs};
		newPairs[prop] = event.target.value;
		if (typeof this.props.onChange === 'function') {
			const fakeEvent = {
				target: {
					name: this.props.name,
					value: newPairs,
					type: 'TextFieldsPair',
				},
			};
			this.props.onChange(fakeEvent, newPairs, idx, event);
		}
		this.setState({ pairs: newPairs });
	};

	handleAddItem = () => {
		const pairs = {
			...this.state.pairs,
			'': ''
		};
		if (typeof this.props.onChange === 'function') {
			const fakeEvent = {
				target: {
					name: this.props.name,
					value: pairs,
					type: 'TextFieldsPair',
				},
			};
			this.props.onChange(fakeEvent, pairs, Object.keys(this.state.pairs).length);
		}
		this.setState({
			pairs,
		});
	};

	handleRemoveItem = (idx, pair) => () => {
		const prop = Object.keys(pair)[0];
		const pairs = {...this.state.pairs};
		delete pairs[prop];
		this.setState({
			pairs,
		});
		if (typeof this.props.onChange === 'function') {
			const fakeEvent = {
				target: {
					name: this.props.name,
					value: pairs,
					type: 'TextFieldsPair',
				},
			};
			this.props.onChange(fakeEvent, pairs, idx);
		}

	};

	render() {
		const { label, name, disabled } = this.props;
		const { pairs } = this.state;
		return (
			<fieldset style={styles.fieldSet}>
				<legend style={styles.legend}>{label}</legend>
				{Object.keys(pairs).map(k => ({ [k]: pairs[k] })).map((pair, idx) => (
					<div style={{display: 'flex'}}>
						<TextField
							disabled={disabled}
							name={`${name}_key`}
							error={!!this.errors[idx]}
							value={Object.keys(pair)[0] || ''}
							onChange={this.onChangeKey(idx, pair)}
							style={styles.textField}
							InputProps={{
								style: {
									width: '90%',
									minWidth: '150px',
								},
							}}
						/>
						<TextField
							disabled={disabled}
							name={`${name}_value`}
							error={!!this.errors[idx]}
							value={Object.values(pair)[0] || ''}
							onChange={this.onChangeValue(idx, pair)}
							style={styles.textField}
							InputProps={{
								style: {
									width: '90%',
									minWidth: '150px',
								},
							}}
						/>
						<Fab
							size="small"
							onClick={this.handleRemoveItem(idx, pair)}
							aria-label="Add"
							style={styles.fab}
						>
							<DeleteIcon/>
						</Fab>
						{this.errors[idx]
							?
							<FormHelperText>{this.errors[idx]}</FormHelperText>
							: null}
					</div>
				))}
				<Fab
					size="small"
					onClick={this.handleAddItem}
					aria-label="Remove"
					style={{
						...styles.fab,
						marginTop: '10px',
					}}

				>
					<AddIcon/>
				</Fab>
			</fieldset>
		);
	}
}
