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
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';

export default class NamedListInput extends Component {
	static propTypes = {
		items: PropTypes.array.isRequired,
		onChange: PropTypes.func.isRequired,
		name: PropTypes.string.isRequired,
	};

	constructor(props) {
		super(props);
		this.errors = [];
		const items = props.items.map((i) => {
			try {
				return {
					name: i.name,
					data: JSON.stringify(i.data),
				};
			} catch (e) {
				return null;
			}
		});
		this.state = {
			items,
		};
	}

	onChangeName = idx => (event) => {
		const newItems = this.state.items.map((item, sidx) => {
			if (idx !== sidx) return item;
			return { ...item, name: event.target.value };
		});

		this.setState({ items: newItems });
	};

	onChangeData = idx => (event) => {
		const newItems = this.state.items.map((item, sidx) => {
			if (idx !== sidx) return item;
			this.errors[idx] = null;
			try {
				JSON.parse(event.target.value);
			} catch (e) {
				this.errors[idx] = e.message;
			}
			return { ...item, data: event.target.value };
		});

		this.setState({ items: newItems });
	};

	onBlur = (event, items) => {
		items = items || this.state.items;
		try {
			items = items.map(i => ({
				name: i.name,
				data: JSON.parse(i.data),
			}));
			this.props.onChange({
				target: {
					name: this.props.name,
					type: 'namedlistinput',
					value: items,
				},
			});
		} catch (e) {
			console.warn(e);
		}
	};

	handleAddItem = () => {
		this.setState({
			items: this.state.items.concat([{ name: '', data: '{"prop": "value"}' }]),
		});
	};

	handleRemoveItem = idx => () => {
		const items = this.state.items.filter((s, sidx) => idx !== sidx);
		this.setState({
			items,
		});
		this.onBlur(null, items);
	};

	render() {
		return (
			<div>
				{this.state.items.map((item, idx) => (
					<div className="item">
						<TextField
							label="Name"
							onBlur={this.onBlur}
							value={`${item.name}`}
							onChange={this.onChangeName(idx)}
						/>
						<TextField
							label="JSON"
							multiline
							rows="2"
							error={!!this.errors[idx]}
							cols="80"
							onBlur={this.onBlur}
							value={item.data}
							onChange={this.onChangeData(idx)}
						/>
						<button type="button" onClick={this.handleRemoveItem(idx)} className="small">-</button>
						{ this.errors[idx] ? <FormHelperText>{this.errors[idx]}</FormHelperText> : null}
					</div>
				))}
				<button type="button" onClick={this.handleAddItem} className="small">+</button>
			</div>
		);
	}
}
