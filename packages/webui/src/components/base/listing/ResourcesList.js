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
/* eslint-disable  */
import React  from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import jsonpath from 'jsonpath';
import Chip from '@material-ui/core/Chip';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import styles from './styles';
import ResourceMenu from './ResourceMenu';

const MAX_LENGTH = 20;

const DEF_STYLES = {
	wrapper: {
		height: '100%',
		overflowY: 'overlay',
	},
};

class ResourcesList extends React.Component {
	static propTypes = {
		label: PropTypes.element.isRequired,
		menuOptions: PropTypes.array.isRequired,
		fields: PropTypes.array.isRequired,
		resources: PropTypes.array.isRequired,
		onMenuSelect: PropTypes.func,
		onResourceOpen: PropTypes.func.isRequired,
		classes: PropTypes.object.isRequired,
		icon: PropTypes.element,
		handleResourceDetails: PropTypes.func,
		titleAttribute: PropTypes.string.isRequired,
		headerBackgroundColor: PropTypes.string,
		onChecked: PropTypes.func,
		disabled: PropTypes.bool,
	};

	static defaultProps = {
		headerBackgroundColor: '#8BC34A',
		handleResourceDetails: undefined,
		onChecked: undefined,
		disabled: false,
		icon: undefined,
		onMenuSelect: undefined,
	};

	constructor(props) {
		super(props);
		this.state = {
			anchorEl: null,
			resourceId: null,
			checked: [...props.checked] || [],
		};
	}

	jsonPath(resource, key) {
		const value = jsonpath.query(resource, key);
		return Array.isArray(value) ? value.join() : value;
	}

	shorten(value) {
		let ret = Array.isArray(value) ? value.join() : value;
		if (ret.length > MAX_LENGTH) {
			ret = `${ret.substr(0, MAX_LENGTH - 3)}...`;
		}
		return ret;
	}

	handleChecked = (resourceId) => () => {
		const { checked } = this.state;
		const index = checked.indexOf(resourceId);
		if (index >= 0) {
			checked.splice(index, 1);
		} else {
			checked.push(resourceId);
		}
		this.setState({
			checked,
		});
		this.props.onChecked(resourceId, checked);
	};

	render() {
		const {
			resources,
			menuOptions,
			fields,
			label,
			onMenuSelect,
			onResourceOpen = () => {},
			titleAttribute,
			onChecked,
			disabled
		} = this.props;
		const rStyles = { ...DEF_STYLES, ...this.props.styles };
		return (
			<div style={rStyles.wrapper}>
				<Table style={{ background: 'white', minWidth: '700' }}>
					<TableHead>
						<TableRow>
							{!onChecked ? null : <TableCell>Checked</TableCell>}
							<TableCell key={"head1"}>Name</TableCell>
							{fields.map((field, i) => (
								<TableCell key={i}>{field.label}</TableCell>
							))}
							<TableCell />
						</TableRow>
					</TableHead>

					<TableBody>
						{!resources
							? null
							: resources.map((resource) => (
									<TableRow hover key={`${label}-${resource.id}`} style={{
										textDecoration: resource.disabled ? 'line-through' : 'inherit',
										backgroundColor: resource.disabled ? '#c0c0c0' : 'inherit',
									}}>
										{!onChecked ? null : (
											<TableCell>
												<Checkbox
													checked={this.state.checked.includes(
														resource.id,
													)}
													disabled={disabled || resource.protected}
													onChange={this.handleChecked(resource.id)}
												/>
											</TableCell>
										)}
										<TableCell
											onClick={() => onResourceOpen(resource)}
											style={{
												cursor: 'pointer',
											}}
											key="head2"
										>
											<strong>
												{this.jsonPath(resource, titleAttribute) ||
													resource.name}
											</strong>
										</TableCell>
										{fields.map((field,i) => {
											let value = jsonpath.query(resource, field.key);
											if (Array.isArray(value) && value.length === 1) {
												// eslint-disable-next-line prefer-destructuring
												value = value[0];
											}
											value = value || '';
											if (!(typeof value === 'object' && value.error)) {
												value = Array.isArray(value) ? value.join() : value;
											}
											value =
												typeof value === 'object' && !value.error
													? JSON.stringify(value)
													: value;
											const text = !value.error ? (
												this.shorten(value)
											) : (
												<span style={{ color: 'red' }}>
													{this.shorten(value.error)}
												</span>
											);
											return (
												<TableCell key={i} title={value.error || value}>
													{text}
												</TableCell>
											);
										})}
										{!menuOptions ? null : (
											<TableCell>
												<ResourceMenu
													handleOpenMenu={onResourceOpen}
													menuOptions={menuOptions}
													resourceId={resource.id}
													onMenuSelect={onMenuSelect}
													styles={{
														icon: {
															color: 'black',
														},
													}}
												/>
											</TableCell>
										)}
									</TableRow>
							  ))}
					</TableBody>
				</Table>
			</div>
		);
	}
}

export default withStyles(styles)(ResourcesList);
