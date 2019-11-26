/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import FontComponent from './FontComponent';
import CellRangeComponent from './CellRangeComponent';


export default class AxisComponent extends React.Component {
	static propTypes = {
		axis: PropTypes.object.isRequired,
		// eslint-disable-next-line react/no-unused-prop-types
		chartNode: PropTypes.object.isRequired,
		sheetView: PropTypes.object.isRequired,
		handler: PropTypes.func.isRequired,
		chartType: PropTypes.string.isRequired,
	};

	static getDerivedStateFromProps(props, state) {
		if (state.id !== props.axis.id || state.chartid !== props.chartNode.getId()) {
			let set;

			if (props.axis.type === 'time') {
				set = props.axis.time || {};
			} else {
				set = props.axis.ticks;
			}

			let font = {
				fontName: 'Verdana', fontSize: '9', bold: false, italic: false, color: '#000000',
			};
			let titleFont = {
				fontName: 'Verdana', fontSize: '9', bold: false, italic: false, color: '#000000',
			};

			if (props.axis.ticks.fontFamily) {
				font = {
					fontName: props.axis.ticks.fontFamily,
					fontSize: props.axis.ticks.fontSize,
					color: props.axis.ticks.fontColor,
					bold: props.axis.ticks.fontStyle.includes('bold'),
					italic: props.axis.ticks.fontStyle.includes('italic'),
				};
			}
			if (props.axis.scaleLabel && props.axis.scaleLabel.fontFamily) {
				titleFont = {
					fontName: props.axis.scaleLabel.fontFamily,
					fontSize: props.axis.scaleLabel.fontSize,
					color: props.axis.scaleLabel.fontColor,
					bold: props.axis.scaleLabel.fontStyle.includes('bold'),
					italic: props.axis.scaleLabel.fontStyle.includes('italic'),
				};
			}
			let tickRotation = 'auto';
			if (props.axis.ticks.maxRotation === 0 && props.axis.ticks.minRotation === 0) {
				tickRotation = 'horizontal'
			} else if (props.axis.ticks.maxRotation === 90 && props.axis.ticks.minRotation === 90) {
				tickRotation = 'vertical'
			}

			return {
				id: props.axis.id,
				chartid: props.chartNode.getId(),
				font,
				titleFont,
				min: set.min === undefined ? '' : set.min,
				max: set.max === undefined ? '' : set.max,
				step: set.stepSize,
				tickRotation,
				title: props.axis.scaleLabel ? props.axis.scaleLabel.labelString || '' : '',
				reverse: props.axis.ticks.reverse,
			};
		}
		return null;
	}

	constructor(props) {
		super(props);

		let set;

		if (props.axis.type === 'time') {
			set = props.axis.time || {};
		} else {
			set = props.axis.ticks;
		}

		let font = {
			fontName: 'Verdana', fontSize: '9', bold: false, italic: false, color: '#000000',
		};
		let titleFont = {
			fontName: 'Verdana', fontSize: '9', bold: false, italic: false, color: '#000000',
		};

		if (props.axis.ticks.fontFamily) {
			font = {
				fontName: props.axis.ticks.fontFamily,
				fontSize: props.axis.ticks.fontSize,
				color: props.axis.ticks.fontColor,
				bold: props.axis.ticks.fontStyle.includes('bold'),
				italic: props.axis.ticks.fontStyle.includes('italic'),
			};
		}
		if (props.axis.scaleLabel && props.axis.scaleLabel.fontFamily) {
			titleFont = {
				fontName: props.axis.scaleLabel.fontFamily,
				fontSize: props.axis.scaleLabel.fontSize,
				color: props.axis.scaleLabel.fontColor,
				bold: props.axis.scaleLabel.fontStyle.includes('bold'),
				italic: props.axis.scaleLabel.fontStyle.includes('italic'),
			};
		}

		let tickRotation = 'auto';
		if (props.axis.ticks.maxRotation === 0 && props.axis.ticks.minRotation === 0) {
			tickRotation = 'horizontal'
		} else if (props.axis.ticks.maxRotation === 90 && props.axis.ticks.minRotation === 90) {
			tickRotation = 'vertical'
		}

		this.state = {
			// eslint-disable-next-line react/no-unused-state
			id: props.axis.id,
			font,
			titleFont,
			min: set.min === undefined ? '' : set.min,
			max: set.max === undefined ? '' : set.max,
			step: set.stepSize,
			tickRotation,
			title: props.axis.scaleLabel ? props.axis.scaleLabel.labelString || '' : '',
			reverse: props.axis.ticks.reverse,
		};
	}

	assignFont(font, key, value) {
		switch (key) {
		case 'name':
			font.fontName = value;
			break;
		case 'size':
			font.fontSize = value;
			break;
		case 'color':
			font.color = value;
			break;
		case 'bold':
			font.bold = value;
			break;
		case 'italic':
			font.italic = value;
			break;
		default:
			break;
		}
	}

	handleAxisMinimum = (event) => {
		if (event.target.value === '') {
			this.setState({ min: '' });
			return;
		}

		switch (this.props.axis.type) {
		case 'scale':
		case 'linear':
		case 'logarithmic':
		case 'time':
			this.setState({ min: Number(event.target.value) });
			break;
		case 'category':
			this.setState({ min: event.target.value });
			break;
		default:
			break;
		}
	};

	handleAxisMaximum = (event) => {
		if (event.target.value === '') {
			this.setState({ max: '' });
			return;
		}

		switch (this.props.axis.type) {
		case 'scale':
		case 'linear':
		case 'logarithmic':
		case 'time':
			this.setState({ max: Number(event.target.value) });
			break;
		case 'category':
			this.setState({ max: event.target.value });
			break;
		default:
			break;
		}
	};

	handleAxisStep = (event) => {
		if (event.target.value === '') {
			this.setState({ step: '' });
			return;
		}

		switch (this.props.axis.type) {
		case 'scale':
		case 'linear':
		case 'logarithmic':
		case 'time':
			this.setState({ step: Number(event.target.value) });
			break;
		default:
			break;
		}
	};

	handleAxisTitle = (event) => {
		this.setState({ title: event.target.value });
	};

	handleAxisMinimumBlur = () => {
		this.props.handler('min', this.state.min === '' ? undefined : this.state.min);
	};

	handleAxisMaximumBlur = () => {
		this.props.handler('max', this.state.max === '' ? undefined : this.state.max);
	};

	handleAxisStepBlur = () => {
		this.props.handler('step', this.state.step === '' ? undefined : this.state.step);
	};

	handleReverseChange = (event, state) => {
		this.setState({ reverse: state });
		this.props.handler('reverse', state);
	};

	handleAxisTitleBlur = (event) => {
		this.setState({ title: event.target.textContent });
		this.props.handler('title', event.target.textContent);
	};

	handleAxisTypeChange = (event) => {
		this.props.handler('type', event.target.value);
	};

	handleAxisTickRotationChange = (event) => {
		this.setState({ tickRotation: event.target.value });
		this.props.handler('tickrotation', event.target.value);
	};

	handleAxisFontChange = (key, value) => {
		const font = { ...this.state.font };

		this.assignFont(font, key, value);
		this.setState({ font });
		this.props.handler('font', font);
	};

	handleAxisTitleFontChange = (key, value) => {
		const font = { ...this.state.titleFont };

		this.assignFont(font, key, value);
		this.setState({ titleFont: font });
		this.props.handler('titlefont', font);
	};

	render() {
		return (
			<div>
				<div>
					{this.props.axis.type !== 'category' &&
					!(this.props.chartType === 'radar' || this.props.chartType === 'polarArea') ?
						<FormControl
							style={{
								width: '95%',
								marginBottom: '15px',
							}}
						>
							<InputLabel htmlFor="axis-type">
								<FormattedMessage
									id="ChartProperties.axisType"
									defaultMessage="Axis Type"
								/>
							</InputLabel>
							<Select
								id="chart-type"
								value={this.props.axis.type}
								onChange={this.handleAxisTypeChange}
								input={<Input
									name="chart-type"
									id="chart-type"
								/>}
							>
								<MenuItem value="linear" key={1}>
									<FormattedMessage
										id="ChartProperties.axisTypeLinear"
										defaultMessage="Linear"
									/>
								</MenuItem>
								<MenuItem value="logarithmic" key={2}>
									<FormattedMessage
										id="ChartProperties.axisTypeLogarithmic"
										defaultMessage="Logarithmic"
									/>
								</MenuItem>
							</Select>
						</FormControl> : null
					}
					<FormControl
						style={{
							width: '40%',
							marginRight: '10px',
						}}
					>
						<TextField
							label={<FormattedMessage
								id="ChartProperties.axisMinimum"
								defaultMessage="Minimum"
							/>}
							type={this.props.axis.type === 'category' ? 'string' : 'number'}
							value={this.state.min}
							onChange={event => this.handleAxisMinimum(event)}
							onBlur={event => this.handleAxisMinimumBlur(event)}
							onKeyPress={(event) => {
								if (event.key === 'Enter') {
									this.handleAxisMinimumBlur(event)
								}
							}}
						/>
					</FormControl>
					<FormControl
						style={{
							width: '40%',
							marginRight: '10px',
						}}
					>
						<TextField
							label={<FormattedMessage
								id="ChartProperties.axisMaximum"
								defaultMessage="Maximum"
							/>}
							type={this.props.axis.type === 'category' ? 'string' : 'number'}
							value={this.state.max}
							onChange={event => this.handleAxisMaximum(event)}
							onBlur={event => this.handleAxisMaximumBlur(event)}
							onKeyPress={(event) => {
								if (event.key === 'Enter') {
									this.handleAxisMaximumBlur(event)
								}
							}}
						/>
					</FormControl>
					{this.props.axis.type !== 'category' ?
						<FormControl
							style={{
								marginTop: '15px',
								width: '84%',
							}}
						>
							<TextField
								label={<FormattedMessage
									id="ChartProperties.axisStep"
									defaultMessage="Step"
								/>}
								type={this.props.axis.type === 'category' ? 'string' : 'number'}
								value={this.state.step}
								onChange={event => this.handleAxisStep(event)}
								onBlur={event => this.handleAxisStepBlur(event)}
								onKeyPress={(event) => {
									if (event.key === 'Enter') {
										this.handleAxisStepBlur(event)
									}
								}}
							/>
						</FormControl> : null
					}
					<FormControlLabel
						style={{
							marginTop: '10px',
						}}
						control={<Checkbox
							checked={this.state.reverse}
							onChange={this.handleReverseChange}
						/>}
						label={
							<FormattedMessage
								id="ChartProperties.axisReverse"
								defaultMessage="Invert Axis Labels"
							/>
						}
					/>
					{(this.props.axis.position === 'bottom' || this.props.axis.position === 'top') ?
						<FormControl
							style={{
								width: '95%',
								marginTop: '15px',
							}}
						>
							<InputLabel htmlFor="axis-type">
								<FormattedMessage
									id="ChartProperties.tickRotation"
									defaultMessage="Tick Label Rotation"
								/>
							</InputLabel>
							<Select
								id="chart-tick-rotation"
								value={this.state.tickRotation}
								onChange={this.handleAxisTickRotationChange}
								input={<Input
									name="chart-tick-rotation"
									id="chart-tick-rotation"
								/>}
							>
								<MenuItem value="auto" key={1}>
									<FormattedMessage
										id="ChartProperties.automatic"
										defaultMessage="Automatic"
									/>
								</MenuItem>
								<MenuItem value="horizontal" key={2}>
									<FormattedMessage
										id="ChartProperties.horizontal"
										defaultMessage="Horizontal"
									/>
								</MenuItem>
								<MenuItem value="vertical" key={3}>
									<FormattedMessage
										id="ChartProperties.vertical"
										defaultMessage="Vertical"
									/>
								</MenuItem>
							</Select>
						</FormControl> : null
					}
					<FontComponent
						font={this.state.font}
						handler={(key, value) => this.handleAxisFontChange(key, value)}
					/>
					<Divider style={{ margin: '10px 0px' }} />
					<FormControl
						style={{
							width: '95%',
							marginBottom: this.state.title.length ? '0px' : '15px',
						}}
					>
						<CellRangeComponent
							sheetView={this.props.sheetView}
							label={
								<FormattedMessage
									id="ChartProperties.axisTitle"
									defaultMessage="Axis Title"
								/>
							}
							range={this.state.title}
							onChange={event => this.handleAxisTitle(event)}
							onBlur={event => this.handleAxisTitleBlur(event)}
							onKeyPress={(event) => {
								if (event.key === 'Enter') {
									this.handleAxisTitleBlur(event)
								}
							}}
						/>
					</FormControl>
					<FontComponent
						visible={this.state.title.length > 0}
						font={this.state.titleFont}
						handler={(key, value) => this.handleAxisTitleFontChange(key, value)}
					/>
				</div>
			</div>
		);
	}
}
