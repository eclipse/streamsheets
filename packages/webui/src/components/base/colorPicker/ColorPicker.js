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
/* eslint-disable react/prop-types,jsx-a11y/click-events-have-key-events
 */

import React from 'react';
import PropTypes from 'prop-types';
import Popover from '@material-ui/core/Popover';
import { SketchPicker } from 'react-color';

const rgba = color => `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

class ColorPicker extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			displayPicker: false,
		};
	}

	handleColorClick = (event) => {
		// This prevents ghost click.
		event.preventDefault();
		const { disabled } = this.props;
		if (!disabled) {
			this.setState({
				displayPicker: true,
				anchorEl: event.currentTarget,
			});
		}
	};

	handleColorClose = () => {
		this.setState({ displayPicker: false });
	};

	handleChange = (color) => {
		const c = rgba(color.rgb);
		this.props.onChange(c);
	};

	render() {
		const { color = {}, label } = this.props;
		const color_ = color.rgb ? rgba(color) : color;
		return (
			<div>
				<p>{label}</p>
				<div
					style={{
						marginTop: '20px',
						width: '100%',
						height: '40px',
						borderRadius: '12px',
						borderColor: 'black',
						borderStyle: 'outset',
						borderWidth: '1px',
						backgroundColor: color_,
					}}
					onClick={this.handleColorClick}
				/>

				<Popover
					open={this.state.displayPicker}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					onClose={this.handleColorClose}
				>
					<SketchPicker
						color={color}
						onChange={this.handleChange}
					/>
				</Popover>
			</div>
		);
	}
}
ColorPicker.propTypes = {
	color: PropTypes.string.isRequired,
	label: PropTypes.element.isRequired,
	onChange: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
};

ColorPicker.defaultProps = {
	disabled: false,
};

export default (ColorPicker);
