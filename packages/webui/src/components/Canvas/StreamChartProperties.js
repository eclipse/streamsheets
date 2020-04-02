/* eslint-disable react/prop-types, react/forbid-prop-types */
/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
import {
	Slide,
	RadioGroup,
	FormGroup,
	MenuItem,
	FormControlLabel,
	IconButton,
	FormLabel,
	FormControl,
	Radio,
	Checkbox,
	InputLabel,
	Select,
	Input,
	Button,
	TextField,
	Typography
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CloseIcon from '@material-ui/icons/Close';
import JSG from '@cedalo/jsg-ui';

import CellRangeComponent from './CellRangeComponent';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import ColorComponent from '../SheetDialogs/ColorComponent';

const markerSizes = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export class StreamChartProperties extends Component {
	static propTypes = {
		title: PropTypes.string.isRequired,
		dummy: PropTypes.string
	};

	static defaultProps = {
		dummy: ''
	};

	constructor(props) {
		super(props);
		this.escFunction = this.escFunction.bind(this);
	}

	state = {
		plotView: undefined
	};

	componentDidMount() {
		document.addEventListener('keydown', this.escFunction, false);
	}

	componentWillReceiveProps(nextProps) {
		// You don't have to do this check first, but it can help prevent an unneeded render
		if (nextProps.showStreamChartProperties === true) {
			this.updateState();
		}
	}

	componentWillUnmount() {
		document.removeEventListener('keydown', this.escFunction, false);
	}

	getSheetView() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection === undefined || selection.length !== 1) {
			return undefined;
		}

		let controller = selection[0].getParent();
		while (controller && !(controller.getModel() instanceof JSG.StreamSheet)) {
			controller = controller.getParent();
		}

		return controller ? controller.getView() : undefined;
	}

	getPlotView() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection === undefined || selection.length !== 1) {
			return undefined;
		}
		const item = selection[0].getModel();
		return item instanceof JSG.SheetPlotNode ? selection[0].getView() : undefined;
	}

	getSheet(chart) {
		let ws = chart.getParent();
		while (ws && !(ws instanceof JSG.StreamSheet)) {
			ws = ws.getParent();
		}

		return ws;
	}

	escFunction(event) {
		if (event.keyCode === 27 && event.target && event.target.contentEditable !== 'true') {
			this.props.setAppState({ showStreamChartProperties: false });
		}
	}

	updateState() {
		const view = this.getPlotView();
		if (view === undefined) {
			return;
		}

		this.setState({
			plotView: view
		});
	}

	handleClose = () => {
		this.props.setAppState({ showStreamChartProperties: false });
	};

	prepareCommand(key) {
		const item = this.state.plotView.getItem();
		return item.prepareCommand(key);
	}

	getData() {
		const selection = this.state.plotView.chartSelection;
		return this.state.plotView.getItem().getDataFromSelection(selection);
	}

	finishCommand(cmd, key) {
		const item = this.state.plotView.getItem();
		item.finishCommand(cmd, key);
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.execute(cmd);
		this.updateState();
	}

	handleDataModeChange = (event) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.dataMode = event.target.value;
		this.finishCommand(cmd, 'chart');
	};

	handleChartStackedChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.stacked = state;
		if (state === false) {
			data.relative = false;
		}
		this.finishCommand(cmd, 'chart');
	};

	handleChartHundredPercentChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.relative = state;
		if (state === true) {
			data.stacked = true;
		}
		this.finishCommand(cmd, 'chart');
	};

	handleChartRotationChange = (event) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.rotation = JSG.MathUtils.toRadians(Math.max(10, event.target.value));
		this.finishCommand(cmd, 'chart');
	};

	handleChartHoleChange = (event) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.hole = event.target.value / 100;
		this.finishCommand(cmd, 'chart');
	};

	handleChartStartAngleChange = (event) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.startAngle = Math.min(data.endAngle, JSG.MathUtils.toRadians(event.target.value));
		this.finishCommand(cmd, 'chart');
	};

	handleChartEndAngleChange = (event) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.endAngle = Math.max(data.startAngle, JSG.MathUtils.toRadians(event.target.value));
		this.finishCommand(cmd, 'chart');
	};

	handleTooltipsChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.tooltips = state
		this.finishCommand(cmd, 'chart');
	};

	handleVisibleChange = (event, state, data, id) => {
		const cmd = this.prepareCommand(id);
		data.visible = state;
		this.finishCommand(cmd, id);
	};

	handleTemplateChange = (event) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.template = event.target.value;
		this.finishCommand(cmd, 'chart');

		const attributesMap = new JSG.Dictionary();
		attributesMap.put(
			JSG.FormatAttributes.FILLCOLOR,
			JSG.SheetPlotNode.templates[data.template].chart.format.fillColor
		);
		attributesMap.put(JSG.FormatAttributes.FILLSTYLE, JSG.FormatAttributes.FillStyle.SOLID);

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.applyFormatMap(attributesMap);
	};

	handleLegendAlignChange = (event, value) => {
		const cmd = this.prepareCommand('legend');
		const data = this.getData();
		data.align = value;
		this.finishCommand(cmd, 'legend');
	};

	handleSeriesFormulaBlur = (event, series) => {
		const cmd = this.prepareCommand('series');

		series.formula = new JSG.Expression(0, event.target.textContent.replace(/^=/, ''));

		this.finishCommand(cmd, 'series');
	};

	handleGridlineVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.gridVisible = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.visible = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisTypeChange = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.type = event.target.value;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisTitleVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.title.visible = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisInvertChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.invert = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisAutoZeroChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.autoZero = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisAllowZoomChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.allowZoom = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisUpdateZoomChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.updateZoom = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisAlignChange = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.align = event.target.value;
		this.finishCommand(cmd, 'axes');
	};

	handleAddAxis = () => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		const selection = this.state.plotView.chartSelection;
		const item = this.state.plotView.getItem();
		const name = item.getUniqueAxisName(selection.element);
		const axis = new JSG.ChartAxis(name, data.type, data.align, 500);

		if (selection.element === 'xAxis') {
			axis.align = item.xAxes.length % 2 ? 'top' : 'bottom';
			item.xAxes.push(axis);
		} else {
			axis.align = item.yAxes.length % 2 ? 'right' : 'left';
			item.yAxes.push(axis);
		}
		this.finishCommand(cmd, 'axes');
	};

	handleSeriesXAxisChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.xAxis = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesYAxisChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.yAxis = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerStyleChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.marker._style = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerSizeChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.marker._size = Number(event.target.value);
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerFillColorChange = (color) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.marker.fillColor = color;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerLineColorChange = (color) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.marker.lineColor = color;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesSmoothChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.smooth = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesDataLabelsChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.dataLabel.visible = state;
		this.finishCommand(cmd, 'series');
	};

	translateTitle(title) {
		const data = this.getData();

		switch (title) {
			case 'title':
				return 'Title';
			case 'plot':
				return 'Plot';
			case 'legend':
				return 'Legend';
			case 'xAxis':
			case 'yAxis':
				return `Axis: ${data.name}`;
			case 'xAxisGrid':
			case 'yAxisGrid':
				return 'Grid';
			case 'xAxisTitle':
			case 'yAxisTitle':
				return 'Axis Title';
			case 'series':
				return 'Series';
			case 'serieslabel':
				return 'Series Label';
			default:
				return title;
		}
	}

	isVerticalChart() {
		const item = this.state.plotView.getItem();
		const serie = item.series[0];

		return serie.type === 'bar' || serie.type === 'profile';
	}

	getLabel(series) {
		const item = this.state.plotView.getItem();
		const ref = item.getDataSourceInfo(series.formula);
		if (ref && ref.yName !== undefined) {
			return ref.yName;
		}

		return String(item.series.indexOf(series));
	}

	render() {
		// const { expanded } = this.state;
		if (!this.state.plotView) {
			return <div />;
		}
		const selection = this.state.plotView.chartSelection;
		const data = this.getData();
		const item = this.state.plotView.getItem();
		const sheetView = this.getSheetView();
		return (
			<Slide direction="left" in={this.props.showStreamChartProperties} mountOnEnter unmountOnExit>
				<div
					style={{
						backgroundColor: '#FFFFFF',
						border: '1px solid grey',
						position: 'absolute',
						top: '-1px',
						right: '0px',
						width: '300px',
						height: '100%',
						visibility: this.props.showStreamChartProperties ? 'visible' : 'hidden',
						overflowX: 'hidden',
						overflowY: 'auto',
						zIndex: '1250'
					}}
				>
					<div
						id={this.props.dummy}
						style={{
							width: '100%',
							height: '48px',
							backgroundColor: 'grey',
							display: 'flex',
							justifyContent: 'space-between'
						}}
					>
						<Typography
							style={{
								color: 'white',
								padding: '12px 0px 12px 12px',
								display: 'inline-block',
								fontSize: '12pt'
							}}
						>
							{this.translateTitle(this.props.title)}
						</Typography>
						<IconButton
							style={{
								display: 'inline',
								color: 'white',
								padding: '12px'
							}}
							onClick={() => this.handleClose()}
						>
							<CloseIcon fontSize="inherit" />
						</IconButton>
					</div>
					{!selection ? (
						<div>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="template">
									<FormattedMessage id="StreamChartProperties.template" defaultMessage="Template" />
								</InputLabel>
								<Select
									id="templates"
									value={String(item.chart.template)}
									onChange={this.handleTemplateChange}
									input={<Input name="template" id="template" />}
								>
									{Object.keys(JSG.SheetPlotNode.templates).map((key) => (
										<MenuItem value={key} key={key}>
											{key}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="hide-empty">
									<FormattedMessage
										id="StreamChartProperties.DataHandling"
										defaultMessage="Missing Data"
									/>
								</InputLabel>
								<Select
									id="hide-empty"
									value={data.dataMode}
									onChange={this.handleDataModeChange}
									input={<Input name="hide-empty" id="hide-empty" />}
								>
									<MenuItem value="datazero" key={1}>
										<FormattedMessage
											id="StreamChartProperties.DataZero"
											defaultMessage="Display as zero"
										/>
									</MenuItem>
									<MenuItem value="dataignore" key={2}>
										<FormattedMessage
											id="StreamChartProperties.DataIgnore"
											defaultMessage="Do not display"
										/>
									</MenuItem>
									<MenuItem value="datainterrupt" key={3}>
										<FormattedMessage
											id="StreamChartProperties.DataInterrupt"
											defaultMessage="Interrupt line"
										/>
									</MenuItem>
								</Select>
							</FormControl>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<FormGroup>
									<FormLabel
										component="legend"
										style={{
											marginTop: '7px',
											marginBottom: '7px'
										}}
									>
										Visible
									</FormLabel>
									<FormControlLabel
										control={
											<Checkbox
												checked={item.title.visible}
												onChange={(event, state) =>
													this.handleVisibleChange(event, state, item.title, 'title')
												}
											/>
										}
										label={
											<FormattedMessage id="StreamChartProperties.title" defaultMessage="Title" />
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={item.legend.visible}
												onChange={(event, state) =>
													this.handleVisibleChange(event, state, item.legend, 'legend')
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.legend"
												defaultMessage="Legend"
											/>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.tooltips}
												onChange={(event, state) =>
													this.handleTooltipsChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.tooltips"
												defaultMessage="Tooltips"
											/>
										}
									/>
								</FormGroup>
							</FormControl>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<FormGroup>
									<FormLabel
										component="legend"
										style={{
											marginTop: '7px',
											marginBottom: '7px'
										}}
									>
										Settings
									</FormLabel>
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.stacked}
												onChange={(event, state) =>
													this.handleChartStackedChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage id="StreamChartProperties.Stacked" defaultMessage="Stacked" />
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.relative}
												onChange={(event, state) =>
													this.handleChartHundredPercentChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.HundredPercent"
												defaultMessage="100%"
											/>
										}
									/>
									<div
										style={{
											flexDirection: 'row'
										}}
									>
										<TextField
											style={{
												width: '120px',
											}}
											id="number"
											label={<FormattedMessage id="StreamChartSettings.Rotation" defaultMessage="Rotation (Degrees)" />}
											inputProps={{
												min: 10,
												max: 90,
												step: 5,
											}}
											error={item.chart.rotation > Math.PI_2 || item.chart.rotation < 0}
											helperText={
												item.chart.rotation > Math.PI_2 || item.chart.rotation < 0 ? (
													<FormattedMessage
														id="StreamChartSettings.InvalidAngle"
														defaultMessage="Angle must be between 0 and 90 degrees!"
													/>
												) : (
													''
												)
											}
											value={JSG.MathUtils.toDegrees(item.chart.rotation, 0)}
											onChange={(event) => this.handleChartRotationChange(event)}
											type="number"
											margin="normal"
										/>
										<TextField
											style={{
												width: '152px',
												marginLeft: '10px',
											}}
											id="number"
											label={<FormattedMessage id="StreamChartSettings.DoughnutHole" defaultMessage="Doughnut Hole (Percent)" />}
											inputProps={{
												min: 0,
												max: 80,
												step: 1,
											}}
											error={item.chart.hole > 0.8 || item.chart.hole < 0}
											helperText={
												item.chart.hole > 0.8 || item.chart.hole < 0 ? (
													<FormattedMessage
														id="StreamChartSettings.InvalidDoughnutHole"
														defaultMessage="The hole value must be between 0 and 80 percent!"
													/>
												) : (
													''
												)
											}
											value={item.chart.hole * 100}
											onChange={(event) => this.handleChartHoleChange(event)}
											type="number"
											margin="normal"
										/>
									</div>
									<div
										style={{
											flexDirection: 'row'
										}}
									>
										<TextField
											style={{
												width: '135px',
											}}
											id="number"
											label={<FormattedMessage id="StreamChartSettings.StartAngle" defaultMessage="Pie Start (Degrees)" />}
											inputProps={{
												min: 0,
												max: 360,
												step: 5,
											}}
											error={item.chart.startAngle > Math.PI * 2 || item.chart.startAngle < 0}
											helperText={
												item.chart.startAngle > Math.PI * 2  || item.chart.startAngle < 0 ? (
													<FormattedMessage
														id="StreamChartSettings.InvalidAngle360"
														defaultMessage="Angle must be between 0 and 360 degrees!"
													/>
												) : (
													''
												)
											}
											value={JSG.MathUtils.toDegrees(item.chart.startAngle, 0)}
											onChange={(event) => this.handleChartStartAngleChange(event)}
											type="number"
											margin="normal"
										/>
										<TextField
											style={{
												width: '135px',
												marginLeft: '10px'
											}}
											id="number"
											label={<FormattedMessage id="StreamChartSettings.EndAngle" defaultMessage="Pie End (Degrees)" />}
											inputProps={{
												min: 0,
												max: 540,
												step: 5,
											}}
											error={item.chart.endAngle > Math.PI * 3 || item.chart.endAngle < 0}
											helperText={
												item.chart.endAngle > Math.PI * 3 || item.chart.endAngle < 0 ? (
													<FormattedMessage
														id="StreamChartSettings.InvalidAngle540"
														defaultMessage="Angle must be between 0 and 540 degrees!"
													/>
												) : (
													''
												)
											}
											value={JSG.MathUtils.toDegrees(item.chart.endAngle, 0)}
											onChange={(event) => this.handleChartEndAngleChange(event)}
											type="number"
											margin="normal"
										/>
									</div>
								</FormGroup>
							</FormControl>
						</div>
					) : null}
					{selection && selection.element === 'legend' ? (
						<FormControl
							style={{
								width: '95%',
								margin: '8px'
							}}
						>
							<RadioGroup name="type" value={data.align} onChange={this.handleLegendAlignChange}>
								<FormLabel
									component="legend"
									style={{
										marginBottom: '7px'
									}}
								>
									Position
								</FormLabel>
								<FormControlLabel
									value="left"
									control={<Radio />}
									label={<FormattedMessage id="StreamChartProperties.left" defaultMessage="Left" />}
								/>
								<FormControlLabel
									value="middleleft"
									control={<Radio />}
									label={<FormattedMessage id="StreamChartProperties.middleleft" defaultMessage="Middle Left" />}
								/>
								<FormControlLabel
									value="top"
									control={<Radio />}
									label={<FormattedMessage id="StreamChartProperties.top" defaultMessage="Top" />}
								/>
								<FormControlLabel
									value="right"
									control={<Radio />}
									label={<FormattedMessage id="StreamChartProperties.right" defaultMessage="Right" />}
								/>
								<FormControlLabel
									value="middleright"
									control={<Radio />}
									label={<FormattedMessage id="StreamChartProperties.middleright" defaultMessage="Middle Right" />}
								/>
								<FormControlLabel
									value="bottom"
									control={<Radio />}
									label={
										<FormattedMessage id="StreamChartProperties.bottom" defaultMessage="Bottom" />
									}
								/>
							</RadioGroup>
						</FormControl>
					) : null}
					{selection && selection.element === 'plot' ? (
						<div>
							<FormLabel
								component="legend"
								style={{
									margin: '7px'
								}}
							>
								Series
							</FormLabel>
							{item.series.map((series, index) => (
								<FormControl
									/* eslint-disable-next-line react/no-array-index-key */
									key={`s${index}`}
									style={{
										width: '95%',
										margin: '7px',
										fontSize: '8pt'
									}}
								>
									<CellRangeComponent
										label={this.getLabel(series)}
										sheetView={sheetView}
										fontSize="9pt"
										range={`=${series.formula.getFormula()}`}
										// onChange={this.handleDataRange}
										onBlur={(event) => this.handleSeriesFormulaBlur(event, series)}
										onKeyPress={(ev) => {
											if (ev.key === 'Enter') {
												this.handleDataRangeBlur(ev);
											}
										}}
									/>
								</FormControl>
							))}
						</div>
					) : null}
					{selection && (selection.element === 'xAxis' || selection.element === 'yAxis') ? (
						<div>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="axis-type">
									<FormattedMessage id="ChartProperties.axisType" defaultMessage="Axis Type" />
								</InputLabel>
								<Select
									id="chart-type"
									value={data.type}
									onChange={this.handleAxisTypeChange}
									input={<Input name="chart-type" id="chart-type" />}
								>
									{selection.element === 'xAxis' ?
										<MenuItem value="category" key={0}>
											<FormattedMessage id="ChartProperties.axisTypeCategory" defaultMessage="Category" />
										</MenuItem>
									: null}
									<MenuItem value="linear" key={1}>
										<FormattedMessage id="ChartProperties.axisTypeLinear" defaultMessage="Linear" />
									</MenuItem>
									<MenuItem value="time" key={2}>
										<FormattedMessage id="ChartProperties.axisTypeTime" defaultMessage="Time" />
									</MenuItem>
									<MenuItem value="logarithmic" key={3}>
										<FormattedMessage
											id="ChartProperties.axisTypeLogarithmic"
											defaultMessage="Logarithmic"
										/>
									</MenuItem>
								</Select>
							</FormControl>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<FormGroup>
									<FormLabel
										component="legend"
										style={{
											marginTop: '7px',
											marginBottom: '7px'
										}}
									>
										Visible
									</FormLabel>
									<FormControlLabel
										control={
											<Checkbox
												checked={data.visible}
												onChange={(event, state) =>
													this.handleAxisVisibleChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.Axis"
												defaultMessage="Axis"
											/>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={data.gridVisible}
												onChange={(event, state) =>
													this.handleGridlineVisibleChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.grid"
												defaultMessage="Gridline"
											/>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={data.title.visible}
												onChange={(event, state) =>
													this.handleAxisTitleVisibleChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.AxisTitle"
												defaultMessage="Axis title"
											/>
										}
									/>
									<FormLabel
										component="legend"
										style={{
											marginTop: '12px',
											marginBottom: '7px'
										}}
									>
										Settings
									</FormLabel>
									<FormControlLabel
										control={
											<Checkbox
												checked={data.invert}
												onChange={(event, state) => this.handleAxisInvertChange(event, state)}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.Invert"
												defaultMessage="Invert"
											/>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={data.autoZero}
												onChange={(event, state) => this.handleAxisAutoZeroChange(event, state)}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.AutoZero"
												defaultMessage="Start at Zero automatically"
											/>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={data.updateZoom}
												onChange={(event, state) =>
													this.handleAxisUpdateZoomChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.UpdateZoom"
												defaultMessage="Update Zoom by ellapsing time"
											/>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={data.allowZoom}
												onChange={(event, state) =>
													this.handleAxisAllowZoomChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.AllowZoom"
												defaultMessage="Allow to zoom by mouse"
											/>
										}
									/>
								</FormGroup>

							</FormControl>
							<FormControl
								style={{
									width: '95%',
									display: 'inline-flex',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="axis-position">
									<FormattedMessage id="StreamChartProperties.AxisPosition" defaultMessage="Position" />
								</InputLabel>
								<Select
									id="axis-position"
									value={data.align}
									onChange={this.handleAxisAlignChange}
									input={<Input name="axis-position" id="axis-position" />}
								>
									{((this.isVerticalChart() && selection.element === 'xAxis') ||
									selection.element === 'yAxis') ? (
										<MenuItem value="left" key={1}>
											<FormattedMessage id="StreamChartProperties.AxisLeft"
															  defaultMessage="Left"/>
										</MenuItem>
									) : (
										< MenuItem value="bottom" key={4}>
											<FormattedMessage id="StreamChartProperties.AxisBottom" defaultMessage="Bottom" />
										</MenuItem>
									)}
									{((this.isVerticalChart() && selection.element === 'xAxis') ||
										selection.element === 'yAxis') ? (
											< MenuItem value="right" key={2}>
												<FormattedMessage id="StreamChartProperties.AxisRight" defaultMessage="Right" />
											</MenuItem>
										) : (
											<MenuItem value="top" key={3}>
												<FormattedMessage id="StreamChartProperties.AxisTop"
												defaultMessage="Top"/>
											</MenuItem>
										)}
								</Select>
							</FormControl>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<Button style={{}} onClick={this.handleAddAxis} color="primary">
									<FormattedMessage id="StreamChartProperties.AddAxis" defaultMessage="Add Axis" />
								</Button>
							</FormControl>
						</div>
					) : null}
					{selection && selection.element === 'series' ? (
						<div>
							<FormLabel
								component="legend"
								style={{
									margin: '8px'
								}}
							>
								Marker
							</FormLabel>
							<FormControl
								style={{
									width: '55%',
									display: 'inline-flex',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="series-marker">
									<FormattedMessage id="StreamChartProperties.Style" defaultMessage="Style" />
								</InputLabel>
								<Select
									id="series-marker"
									value={data.marker.style}
									onChange={this.handleSeriesMarkerStyleChange}
									input={<Input name="series-marker" id="series-marker" />}
								>
									<MenuItem value="none" key={1}>
										<FormattedMessage id="ChartProperties.none" defaultMessage="None" />
									</MenuItem>
									<MenuItem value="circle" key={2}>
										<FormattedMessage id="ChartProperties.circle" defaultMessage="Circle" />
									</MenuItem>
									<MenuItem value="cross" key={3}>
										<FormattedMessage id="ChartProperties.cross" defaultMessage="Cross" />
									</MenuItem>
									<MenuItem value="crossRot" key={4}>
										<FormattedMessage
											id="ChartProperties.rotatedCross"
											defaultMessage="Rotated Cross"
										/>
									</MenuItem>
									<MenuItem value="dash" key={5}>
										<FormattedMessage id="ChartProperties.dash" defaultMessage="Dash" />
									</MenuItem>
									<MenuItem value="line" key={6}>
										<FormattedMessage id="ChartProperties.line" defaultMessage="Line" />
									</MenuItem>
									<MenuItem value="rect" key={7}>
										<FormattedMessage id="ChartProperties.rectangle" defaultMessage="Rectangle" />
									</MenuItem>
									<MenuItem value="rectRot" key={9}>
										<FormattedMessage id="ChartProperties.diamond" defaultMessage="Diamond" />
									</MenuItem>
									<MenuItem value="star" key={10}>
										<FormattedMessage id="ChartProperties.star" defaultMessage="Star" />
									</MenuItem>
									<MenuItem value="triangle" key={11}>
										<FormattedMessage id="ChartProperties.triangle" defaultMessage="Triangle" />
									</MenuItem>
								</Select>
							</FormControl>
							<FormControl
								style={{
									width: '29%',
									display: 'inline-flex',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="template">
									<FormattedMessage id="StreamChartProperties.MarkerSize" defaultMessage="Size" />
								</InputLabel>
								<Select
									id="templates"
									value={data.marker.size}
									onChange={this.handleSeriesMarkerSizeChange}
									input={<Input name="template" id="template" />}
								>
									{Object.values(markerSizes).map((key) => (
										<MenuItem value={key} key={key}>
											{key}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl
								style={{
									width: '45%',
									margin: '8px'
								}}
							>
								<ColorComponent
									label={
										<FormattedMessage
											id="StreamChartProperties.FillColor"
											defaultMessage="Fill Color"
										/>
									}
									width={110}
									transparent
									color={data.marker.fillColor || item.getTemplate().series.getFillForIndex(selection.index)}
									onChange={(color) => this.handleSeriesMarkerFillColorChange(color)}
								/>
							</FormControl>
							<FormControl
								style={{
									display: 'inline-flex',
									width: '44%',
									margin: '8px'
								}}
							>
								<ColorComponent
									label={
										<FormattedMessage
											id="StreamChartProperties.LineColor"
											defaultMessage="Line Color"
										/>
									}
									width={110}
									transparent
									color={data.marker.lineColor || item.getTemplate().series.line[selection.index]}
									onChange={(color) => this.handleSeriesMarkerLineColorChange(color)}
								/>
							</FormControl>
							<FormLabel
								component="legend"
								style={{
									margin: '8px'
								}}
							>
								Axis Assignment
							</FormLabel>
							<FormControl
								style={{
									width: '43%',
									display: 'inline-flex',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="template">
									<FormattedMessage id="StreamChartProperties.XAxis" defaultMessage="XAxis" />
								</InputLabel>
								<Select
									id="templates"
									value={data.xAxis}
									onChange={this.handleSeriesXAxisChange}
									input={<Input name="template" id="template" />}
								>
									{item.xAxes.map((axis) => (
										<MenuItem value={axis.name} key={axis.name}>
											{axis.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl
								style={{
									width: '43%',
									display: 'inline-flex',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="template">
									<FormattedMessage id="StreamChartProperties.YAxis" defaultMessage="YAxis" />
								</InputLabel>
								<Select
									id="templates"
									value={data.yAxis}
									onChange={this.handleSeriesYAxisChange}
									input={<Input name="template" id="template" />}
								>
									{item.yAxes.map((axis) => (
										<MenuItem value={axis.name} key={axis.name}>
											{axis.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormGroup
								style={{
									margin: '8px'
								}}
							>
								<FormLabel
									component="legend"
									style={{
										marginTop: '12px',
										marginBottom: '7px'
									}}
								>
									Settings
								</FormLabel>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.smooth}
											onChange={(event, state) => this.handleSeriesSmoothChange(event, state)}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.SmoothLine"
											defaultMessage="Smooth Line"
										/>
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.dataLabel.visible}
											onChange={(event, state) => this.handleSeriesDataLabelsChange(event, state)}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.ShowDataLabels"
											defaultMessage="Show Data Labels"
										/>
									}
								/>
							</FormGroup>
						</div>
					) : null}
				</div>
			</Slide>
		);
	}
}

function mapStateToProps(state) {
	return {
		showStreamChartProperties: state.appState.showStreamChartProperties
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(StreamChartProperties);
