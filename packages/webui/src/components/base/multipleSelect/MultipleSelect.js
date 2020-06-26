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
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Popover from '@material-ui/core/Popover';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import CheckToogleIcon from '@material-ui/icons/IndeterminateCheckBox';

import CustomTooltip from '../customTooltip/CustomTooltip';

let loaded = false;
let isSet = false;

class MultipleSelect extends React.Component {
	static getDerivedStateFromProps(nextProps, prevState) {
		if (!loaded) {
			const {options} = nextProps;
			const {selectedOptions} = prevState;
			if (selectedOptions || options) {
				loaded = true;
				isSet = !isSet;
				return {...prevState, selectedOptions, options};
			}
		}
		return {...prevState};
	}

	constructor(props) {
		super(props);
		this.handleClose = this.handleClose.bind(this);
		loaded = false;
		this.state = {
			anchorEl: null,
			selectedOptions: props.selectedOptions,
			options: props.options,
			disabled: props.disabled,
			dirty: false,
			filter: '',
		};
	}

	onMenuItemClicked = m => (event) => {
		this.props.onMenuItemClicked(m, event);
	};

	handleClick = (event) => {
		isSet = true;
		this.setState({
			anchorEl: event.currentTarget,
		});
	};

	handleClose = () => {
		this.props.onUpdateSelected(this.state.selectedOptions, this.state.dirty);
		isSet = true;
		this.setState({
			anchorEl: null,
		});
	};

	handleToggle = label => () => {
		const {selectedOptions, disabled} = this.state;
		if(disabled) return;
		const currentIndex = selectedOptions.indexOf(label);
		let newChecked = [...selectedOptions];

		if (currentIndex === -1) {
			newChecked.push(label);
			if (typeof this.props.onAdd === 'function') this.props.onAdd(label);
		} else {
			newChecked.splice(currentIndex, 1);
			if (typeof this.props.onRemove === 'function') this.props.onRemove(label);
		}
		if (this.props.getMoreSelected) {
			newChecked = this.props.getMoreSelected(newChecked);
		}

		this.setState({
			selectedOptions: newChecked,
			dirty: true,
		});
	};

	handleToggleAll = () => {
		const {selectedOptions, disabled} = this.state;
		if(!disabled) {
			const {options} = this.props;
			const newChecked = options.filter(o => !selectedOptions.includes(o));
			this.setState({
				selectedOptions: newChecked,
				dirty: true,
			});
		}
	};

	handleFilter = (event) => {
		this.setState({
			filter: event.target.value,
		});
	};

	render() {
		const {
			anchorEl, selectedOptions, options, disabled,
		} = this.state;
		const filteredOptions = options.filter(
				o => o.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0);
		const {label} = this.props;
		return (
				<div>
					{this.props.selectIcon ? (
									<CustomTooltip header="Tooltip.SelectLabelsHeader" message="Tooltip.SelectLabelsMessage">
										<div>
											<IconButton
													size="small"
													onClick={this.handleClick}
											>
												{this.props.selectIcon}
											</IconButton>
										</div>
									</CustomTooltip>)
							: (
									<TextField
											disabled
											fullWidth
											id="name"
											label={label || ''}
											value={selectedOptions.join(',')}
											title={selectedOptions.join(',')}
											onClick={this.handleClick}
											margin="normal"
											style={{
												marginTop: '0px',
											}}
									/>
							)
					}
					<Popover
							open={Boolean(anchorEl)}
							anchorEl={anchorEl}
							onClose={this.handleClose}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'center',
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'center',
							}}
					>
						<TextField
								type="filter"
								label="Filter"
								onChange={this.handleFilter}
								style={{
									padding: '3px',
									marginLeft: '10px',
								}}
						/>
						<Button size="small">
							<CheckToogleIcon onClick={this.handleToggleAll}/>
						</Button>
						<List>
							<div style={{maxHeight: '250px', overflowY: 'scroll'}}>
								{filteredOptions.map(label_ => (
										<ListItem
												key={label_}
												role={undefined}
												dense
												button
												disabled={disabled}
												onClick={this.handleToggle(label_)}
										>
											<Checkbox
													checked={!!selectedOptions.find(l => l === label_)}
													tabIndex={-1}
													disabled={disabled}
													disableRipple
											/>
											<ListItemText primary={label_}/>
										</ListItem>
								))}
							</div>
							{this.props.menuItems.length > 0 ? <Divider/> : null}
							{this.props.menuItems.map(menuItem => (
									<ListItem
											key={`label-create-manage${menuItem.id}`}
											role={undefined}
											dense
											button
											onClick={this.onMenuItemClicked(menuItem)}
									>
										<ListItemText primary={menuItem.text}/>
									</ListItem>
							))}
						</List>
					</Popover>
				</div>
		);
	}
}

MultipleSelect.propTypes = {
	onRemove: PropTypes.func,
	onAdd: PropTypes.func,
	getMoreSelected: PropTypes.func,
	onMenuItemClicked: PropTypes.func,
	onUpdateSelected: PropTypes.func.isRequired,
	selectedOptions: PropTypes.arrayOf(PropTypes.string),
	options: PropTypes.arrayOf(PropTypes.string),
	menuItems: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string,
		text: PropTypes.string,
		href: PropTypes.string,
	})),
	label: PropTypes.string,
	selectIcon: PropTypes.element,
	disabled: PropTypes.bool,
};

MultipleSelect.defaultProps = {
	selectedOptions: [],
	options: ['ROOT'],
	menuItems: [],
	getMoreSelected: undefined,
	label: null,
	onAdd: undefined,
	onRemove: undefined,
	onMenuItemClicked: undefined,
	selectIcon: undefined,
	disabled: false,
};

export default MultipleSelect;
