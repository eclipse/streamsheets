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
/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types,jsx-a11y/click-events-have-key-events  */
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import jsonpath from 'jsonpath';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Popover from '@material-ui/core/Popover';
import Checkbox from '@material-ui/core/Checkbox';
import styles from './styles';
import ResourceCardHeader from './ResourceCardHeader';
import { shorten } from './Utils';

const DEF_STYLES = {
	wrapper: {
		height: '100%',
		overflowY: 'auto',
	},
	MuiGridList: {
		marginLeft: 0,
	}
};

class ResourcesGrid extends React.Component {
	static propTypes = {
		label: PropTypes.object.isRequired,
		disabled: PropTypes.bool,
		fields: PropTypes.array.isRequired,
		menuOptions: PropTypes.array.isRequired,
		resources: PropTypes.array.isRequired,
		onMenuSelect: PropTypes.func,
		onResourceOpen: PropTypes.func.isRequired,
		classes: PropTypes.object.isRequired,
		icon: PropTypes.element,
		headerIcons: PropTypes.arrayOf(PropTypes.object),
		images: PropTypes.bool,
		gridWidth: PropTypes.number,
		handleResourceDetails: PropTypes.func,
		titleAttribute: PropTypes.string.isRequired,
		headerBackgroundColor: PropTypes.string,
		styles: PropTypes.object,
		onChecked: PropTypes.func,
		checked: PropTypes.arrayOf(PropTypes.string),
		showControlButtons: PropTypes.bool,
	};

	static defaultProps = {
		headerBackgroundColor: '#8BC34A',
		disabled: false,
		images: false,
		handleResourceDetails: undefined,
		headerIcons: [],
		icon: undefined,
		styles: DEF_STYLES,
		onChecked: undefined,
		checked: [],
		gridWidth: 0,
		showControlButtons: true,
		onMenuSelect: undefined,
	};

	constructor(props) {
		super(props);
		this.state = {
			openImage: false,
			anchorReference: 'anchorEl',
			anchorElZoom: null,
			activeResource: null,
			checked: [...props.checked] || [],
		};
		this.gridRef = React.createRef();
	}

	handleChecked = (resourceId) => () => {
		const checked = [...this.state.checked];
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

	handleOpenClick = (resource) => {
		if (this.props.onResourceOpen) {
			this.props.onResourceOpen(resource, true);
		}
	};

	handleContextMenu = (event, resource) => {
		this.props.onResourceOpen(resource, true);
		event.stopPropagation();
		event.preventDefault();
	};

	handleZoom = (event, resource) => {
		this.setState({
			anchorElZoom: event.target,
			openImage: true,
			activeResource: resource,
		});
	};

	handleZoomClose = () => {
		this.setState({ openImage: false });
	};

	render() {
		const {
			resources,
			menuOptions,
			fields,
			label,
			images,
			icon,
			titleAttribute,
			headerBackgroundColor,
			gridWidth,
			classes,
			onMenuSelect,
			onChecked,
			showControlButtons,
			disabled
		} = this.props;

		const rStyles = { ...DEF_STYLES, ...this.props.styles };
		// to force render
		// let dims = this.state.gridWidth;
		// dims = this.getDimensions();
		const width = gridWidth;
		return (
			<div
				style={{
					height: '100%',
				}}
			>
				<Popover
					open={this.state.openImage}
					anchorPosition={{ top: 0, left: 0 }}
					anchorEl={this.state.anchorElZoom}
					onClose={this.handleZoomClose}
					anchorReference={this.state.anchorReference}
					anchorOrigin={{
						vertical: 'top',
						horizontal: 'left',
					}}
					transformOrigin={{
						vertical: 'top',
						horizontal: 'left',
					}}
				>
					<div
						style={{
							width: '500px',
							height: '500px',
							// eslint-disable-next-line
							backgroundImage: `url(${
								(this.state.activeResource && this.state.activeResource.titleImage) 
								|| (this.state.activeResource && this.state.activeResource.previewImage) 
								|| 'images/preview.png'})`,
							backgroundSize: '100%',
						}}
					/>
				</Popover>
				<div
					style={rStyles.wrapper}
				>
					<GridList
						ref={this.gridRef}
						cols={5}
						id='coreGrid'
						spacing={25}
						cellHeight={150}
						style={{
							marginLeft: `${Math.max(0, Math.floor((width - Math.floor(width / 300) * 300) / 2))}px`,
							marginRight: `${Math.max(0, Math.floor((width - Math.floor(width / 300) * 300) / 2))}px`,
						}}
					>
						{!resources
							? null
							: resources.map((resource) => (
									<GridListTile
										key={`${label.key || label}-${
											resource.id
										}`}
										cols={1}
										spacing={5}
										style={{
											height: '245px',
											width: '300px',
										}}
									>
										<Card
											elevation={0}
											className={classes.card}
										>
											<ResourceCardHeader
												{...this.props}
												handleClicked={onMenuSelect}
												resource={resource}
												onResourceOpen={
													this.handleOpenClick
												}
												titleAttribute={titleAttribute}
												headerBackgroundColor={
													headerBackgroundColor
												}
												headerIcons={
													this.props.headerIcons
												}
												icon={icon}
												menuOptions={menuOptions}
												onMenuSelect={onMenuSelect}
												titleMaxLength={15}
												disabled={!showControlButtons || disabled}
											/>
											<CardContent
												style={{
													cursor: 'pointer',
													padding: '15px',
												}}
												onContextMenu={(event) =>
													this.handleContextMenu(
														event,
														resource,
													)
												}
											>
												{!onChecked ? null : (
													<div
														style={{
															float: 'right',
															position:
																'relative',
															left: '25px',
															top: '130px',
														}}
													>
														<Checkbox
															color="default"
															value="checkedG"
															checked={this.state.checked.includes(
																resource.id,
															)}
															onChange={this.handleChecked(
																resource.id,
															)}
															disabled={disabled || resource.protected}
														/>
													</div>
												)}
												<div
													onClick={() =>
														this.handleOpenClick(
															resource,
														)
													}
												>
													{images ? (
														<div
															style={{
																width: '245px',
																height: '120px',
																// eslint-disable-next-line
																backgroundImage: `url(${
																	resource.titleImage
																	|| resource.previewImage
																	|| 'images/preview.png'})`,
																backgroundSize: '245px 120px',
																marginBottom:
																	'10px',
															}}
														/>
													) : null}
													<Typography
														// key={field.id}
														component="div"
														// title={!value.error ? value : value.error}
													>
														<table
															// key={field.id}

															style={{
																lineHeight: '1',
																fontSize: '8pt',
																tableLayout: 'fixed',
															}}
														>
															<colgroup>
																<col width="95px" />
																<col width="10px" />
																<col width="130px" />
															</colgroup>
															<tbody>
																{fields.map(
																	(field) => {
																		let value = jsonpath.query(
																			resource,
																			field.key,
																		);
																		if (
																			Array.isArray(
																				value,
																			) &&
																			value.length ===
																				1
																		) {
																			// eslint-disable-next-line prefer-destructuring
																			value =
																				value[0];
																		}
																		value =
																			value ||
																			'';
																		if (
																			!(
																				typeof value ===
																					'object' &&
																				value.error
																			)
																		) {
																			value = Array.isArray(
																				value,
																			)
																				? value.join()
																				: value;
																		}
																		value =
																			typeof value ===
																				'object' &&
																			!value.error
																				? JSON.stringify(
																						value,
																				  )
																				: value;
																		return value ? (
																			<tr
																				key={
																					field.key
																				}
																			>
																				<th>
																					{
																						field.label
																					}
																					:
																				</th>
																				<td />
																				<td
																					style={{
																						textOverflow: 'ellipsis',
																						overflow: 'hidden',
																						maxWidth: '130px',
																					}}
																				>
																					{!value.error ? (
																						shorten(
																							value,
																						)
																					) : (
																						<span
																							style={{
																								color:
																									'red',
																							}}
																						>
																							{shorten(
																								value.error,
																							)}
																						</span>
																					)}
																				</td>
																			</tr>
																		) : null;
																	},
																)}
															</tbody>
														</table>
													</Typography>
												</div>
											</CardContent>
										</Card>
									</GridListTile>
							  ))}
					</GridList>
				</div>
			</div>
		);
	}
}

export default withStyles(styles)(ResourcesGrid);
