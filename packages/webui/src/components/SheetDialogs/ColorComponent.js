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
/* eslint-disable react/jsx-no-comment-textnodes,jsx-a11y/click-events-have-key-events,no-bitwise */
import React from 'react';
import PropTypes from 'prop-types';
import Popover from '@material-ui/core/Popover';
import { SketchPicker } from 'react-color';
import {withStyles} from "@material-ui/core/styles";

/* eslint-disable react/forbid-prop-types */
class ColorComponent extends React.Component {
	static propTypes = {
		color: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
		label: PropTypes.object,
		width: PropTypes.number,
		labelFontSize: PropTypes.string,
		transparent: PropTypes.bool,
		disableAlpha: PropTypes.bool,
		onChange: PropTypes.func.isRequired,
	}

	static defaultProps = {
		width: 100,
		labelFontSize: '0.75rem',
		label: undefined,
		transparent: false,
		disableAlpha: true,
	};

	constructor(props) {
		super(props);

		this.state = {
			displayPicker: false,
			color: props.color,
			label: props.label,
		};
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ color: nextProps.color });
	}

	handleColorClick = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			displayPicker: true,
			anchorEl: event.currentTarget,
		});
	};

	handleColorClose = () => {
		this.setState({ displayPicker: false });
	};

	handleColorChange = (color) => {
		if (this.props.disableAlpha) {
			this.setState({color: color.hex});
			this.props.onChange(color.hex);
		} else {
			this.setState({color: color.rgb});
			this.props.onChange(color.rgb);
		}
	};

	getBackground() {
		if (this.state.color === undefined) {
			return 'white';
		}
		return this.state.color.a !== undefined ? `rgba(${this.state.color.r},
											${this.state.color.g}, ${this.state.color.b},
											${this.state.color.a})` : this.state.color;
	}

	getPresetColors() {
		const colors =
			["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
				"#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
				"#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
				"#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
				"#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0",
				"#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79",
				"#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47",
				"#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"];

		if (this.props.transparent) {
			colors.push({title: 'None', color: 'transparent'});
		}

		return colors;
	}

	render() {
		return (
			<div>
				{this.state.label ? (
				<div
					style={{
						fontSize: this.props.labelFontSize,
						transform: 'scale(0.75)',
						transformOrigin: 'left top',
					}}
				>
					{this.state.label}
				</div> ) : null}
				<div
					style={{
						display: 'inline-block',
						width: `${this.props.width}px`,
						height: '21px',
						border: `1px solid ${this.props.theme.palette.text.primary}`,
						padding: '3px',
						// margin: '4px',
					}}
					onClick={this.handleColorClick}
				>
					<div
						style={{
							width: '100%',
							height: '100%',
							borderRadius: '2px',
							background: this.getBackground(),
						}}
					/>
				</div>
				<Popover
					open={this.state.displayPicker}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					// targetOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.handleColorClose}
				>
					<SketchPicker
						disableAlpha={this.props.disableAlpha}
						width={250}
						color={this.state.color}
						presetColors={this.getPresetColors()}
						onChange={this.handleColorChange}
					/>
				</Popover>
			</div>
		);
	}
}

export default withStyles({}, {withTheme: true})(ColorComponent);
