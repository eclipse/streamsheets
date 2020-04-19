/* eslint-disable react/jsx-no-comment-textnodes,jsx-a11y/click-events-have-key-events */
import React from 'react';
import PropTypes from 'prop-types';
import Popover from '@material-ui/core/Popover';
import { SketchPicker } from 'react-color';
import { intl } from '../../helper/IntlGlobalProvider';

/* eslint-disable react/forbid-prop-types */
export default class ColorComponent extends React.Component {
	static propTypes = {
		color: PropTypes.string.isRequired,
		label: PropTypes.object.isRequired,
		width: PropTypes.number,
		transparent: PropTypes.bool,
		onChange: PropTypes.func.isRequired,
		onClose: PropTypes.func,
	}

	static defaultProps = {
		width: 100,
		transparent: false,
		onClose: () => {}
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

	handleColorClose = color => () => {
		this.setState({ displayPicker: false });
		this.props.onClose(color);
	};

	handleColorChange = (color) => {
		this.setState({ color: color.hex });
		this.props.onChange(color.hex);
	};

	render() {
		return (
			<div>
				<div
					style={{
						color: 'rgba(0, 0, 0, 0.54)',
						fontSize: '1rem',
						transform: 'scale(0.75)',
						transformOrigin: 'left top',
					}}
				>
					{this.state.label}
				</div>
				<div
					style={{
						display: 'inline-block',
						width: `${this.props.width}px`,
						height: '21px',
						border: 'solid 1px rgba(0, 0, 0, 0.3)',
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
							background: this.state.color,
							// ? `rgba(${this.state.color.r},
							// 				${this.state.color.g}, ${this.state.color.b},
							// 				${this.state.color.a})` : 'white',
						}}
					/>
				</div>
				<Popover
					open={this.state.displayPicker}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					// targetOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.handleColorClose(this.state.color)}
				>
					<SketchPicker
						disableAlpha
						color={this.state.color}
						presetColors={this.props.transparent ? [
							'#D0021B',
							'#F5A623',
							'#F8E71C',
							'#8B572A',
							'#7ED321',
							'#417505',
							'#BD10E0',
							'#9013FE',
							'#4A90E2',
							'#50E3C2',
							'#B8E986',
							'#000000',
							'#4A4A4A',
							'#9B9B9B',
							'#FFFFFF',
							{title: intl.formatMessage({ id: 'Reset' }, {}), color: 'transparent'},
						] : undefined}
						onChange={this.handleColorChange}
					/>
				</Popover>
			</div>
		);
	}
}

