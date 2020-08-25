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

/* eslint-disable react/prop-types, react/forbid-prop-types */
/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
import {
	Slide,
	RadioGroup,
	FormGroup,
	MenuItem,
	FormControlLabel,
	AppBar,
	IconButton,
	FormLabel,
	FormControl,
	Radio,
	Paper,
	Checkbox,
	InputAdornment,
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
import DeleteIcon from '@material-ui/icons/Delete';
import JSG from '@cedalo/jsg-ui';

import CellRangeComponent from './CellRangeComponent';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import ColorComponent from '../SheetDialogs/ColorComponent';
import { intl } from '../../helper/IntlGlobalProvider';
import SvgIcon from '@material-ui/core/SvgIcon';
import ValueRangesDialog from '../SheetDialogs/ValueRangesDialog';

const markerSizes = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export class StreamChartProperties extends Component {
	static propTypes = {
		title: PropTypes.string.isRequired,
		dummy: PropTypes.string,
	};

	static defaultProps = {
		dummy: ''
	};

	constructor(props) {
		super(props);
		this.escFunction = this.escFunction.bind(this);

		this.state.showValueRanges = false;
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

	handleChartCoharentChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();
		item.chart.coharentData = state;
		this.finishCommand(cmd, 'chart');
	};

	handleChartFormulaBlur = (event) => {
		const formula = event.target.textContent.replace(/^=/, '');
		const cmdChart = this.prepareCommand('chart');

		this.updateFormulas(formula, cmdChart);
	};

	updateFormulas(formula, cmdChart) {
		const item = this.state.plotView.getItem();
		const viewer = graphManager.getGraphViewer();
		item.updateFormulas(viewer, formula, cmdChart);
		this.updateState();
	}

	handleChartDataInRowsChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();

		item.chart.dataInRows = state;

		this.updateFormulas(item.chart.formula.getFormula(), cmd);
	};

	handleChartFirstSeriesLabelsChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();
		item.chart.firstSeriesLabels = state;
		this.updateFormulas(item.chart.formula.getFormula(), cmd);
		this.updateState();
	};

	handleChartFirstCategoryLabelsChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();
		item.chart.firstCategoryLabels = state;
		this.updateFormulas(item.chart.formula.getFormula(), cmd);
		this.updateState();
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

	handleChartStepChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.step = state;
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
		data.tooltips = state;
		this.finishCommand(cmd, 'chart');
	};

	handleVisibleChange = (event, state, data, id) => {
		const cmd = this.prepareCommand(id);
		data.visible = state;
		this.finishCommand(cmd, id);
	};

	handleUpDownBarsChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();
		item.chart.upBars.visible = state;
		item.chart.downBars.visible = state;
		this.finishCommand(cmd, 'chart');
	};

	handleVaryByCategoriesChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();
		item.chart.varyByCategories = state;
		this.finishCommand(cmd, 'chart');
	};

	handleVaryByThresholdChange = (event) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();
		item.chart.varyByThreshold = event.target.value;
		this.finishCommand(cmd, 'chart');
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

	handleTitleAlignChange = (event, value) => {
		const cmd = this.prepareCommand('title');
		const data = this.getData();
		data.align = value;
		this.finishCommand(cmd, 'title');
	};

	handleSeriesFormulaBlur = (event, series) => {
		const cmd = this.prepareCommand('series');
		const item = this.state.plotView.getItem();
		const newFormula = event.target.textContent.replace(/^=/, '');

		if (series.formula && newFormula !== series.formula.getFormula()) {
			item.chart.formula = new JSG.Expression('');
		}

		series.formula = new JSG.Expression(0, newFormula);

		this.finishCommand(cmd, 'series');
	};

	handleSeriesDuplicate = (index) => {
		const cmd = this.prepareCommand('series');
		const item = this.state.plotView.getItem();

		const copy = item.series[index].copy();
		JSG.Arrays.insertAt(item.series, index, copy);

		this.finishCommand(cmd, 'series');
	};

	handleSeriesDelete = (index) => {
		const cmd = this.prepareCommand('series');
		const item = this.state.plotView.getItem();

		JSG.Arrays.removeAt(item.series, index);

		this.finishCommand(cmd, 'series');
	};

	handleSeriesMoveDown = (index) => {
		const cmd = this.prepareCommand('series');
		const item = this.state.plotView.getItem();

		JSG.Arrays.move(item.series, index, index + 1);

		this.finishCommand(cmd, 'series');
	};

	handleSeriesMoveUp = (index) => {
		const cmd = this.prepareCommand('series');
		const item = this.state.plotView.getItem();

		JSG.Arrays.move(item.series, index, index - 1);

		this.finishCommand(cmd, 'series');
	};

	handleGridlineVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.gridVisible = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisLabelRotationChange = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.format.fontRotation = event.target.value;
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

	handleAxisNumberformatLinkChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.format.linkNumberFormat = state;
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

	handleAxisZoomGroupChange = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.zoomGroup = event.target.value;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisAlignChange = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.align = event.target.value;
		this.finishCommand(cmd, 'axes');
	};

	handleEditValueRanges = (state, ranges) => {
		this.setState({
			showValueRanges: state
		})
		if (ranges !== undefined) {
			const cmd = this.prepareCommand('axes');
			const data = this.getData();
			data.valueRanges = ranges;
			this.finishCommand(cmd, 'axes');
		}
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

	handleShowSeries = () => {
		const cmd = this.prepareCommand('series');
		const item = this.state.plotView.getItem();

		item.series.forEach((serie) => {
			serie.visible = true;
		});

		this.finishCommand(cmd, 'series');
	};

	handleSeriesYAxisChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.yAxis = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesTypeChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.type = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerStyleChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.marker.style = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerSizeChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.marker.size = Number(event.target.value);
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerFillColorChange = (color) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.marker.fillColor = color.hex;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerLineColorChange = (color) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.marker.lineColor = color.hex;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesSmoothChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.smooth = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.visible = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesDataLabelsChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.dataLabel.visible = state;
		if (
			data.dataLabel.visible &&
			!data.dataLabel.content.x &&
			!data.dataLabel.content.y &&
			!data.dataLabel.content.radius &&
			!data.dataLabel.content.state &&
			!data.dataLabel.content.series
		) {
			data.dataLabel.content.y = true;
		}
		this.finishCommand(cmd, 'series');
	};

	handleSeriesDataLabelRotationChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.dataLabel.format.fontRotation = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesDataLabelsContentChange = (event, type, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.dataLabel.content[type] = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesDataLabelsSeparatorChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.dataLabel.separator = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesDataLabelsPositionChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.dataLabel.position = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesDataLabelsLinkChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.dataLabel.format.linkNumberFormat = state;
		this.finishCommand(cmd, 'series');
	};

	translateTitle(title) {
		const data = this.getData();

		switch (title) {
			case 'Chart':
				return intl.formatMessage({ id: 'StreamChartProperties.Chart' }, {});
			case 'title':
				return intl.formatMessage({ id: 'StreamChartProperties.Title' }, {});
			case 'plot':
				return intl.formatMessage({ id: 'StreamChartProperties.Plot' }, {});
			case 'legend':
				return intl.formatMessage({ id: 'StreamChartProperties.Legend' }, {});
			case 'xAxis':
			case 'yAxis':
				return intl.formatMessage({ id: 'StreamChartProperties.AxisProperties' }, { name: data.name });
			case 'xAxisGrid':
			case 'yAxisGrid':
				return intl.formatMessage({ id: 'StreamChartProperties.Grid' }, {});
			case 'xAxisTitle':
			case 'yAxisTitle':
				return intl.formatMessage({ id: 'StreamChartProperties.AxisTitle' }, {});
			case 'series':
				return intl.formatMessage({ id: 'StreamChartProperties.Series' }, {});
			case 'serieslabel':
				return intl.formatMessage({ id: 'StreamChartProperties.SeriesLabel' }, {});
			case 'downbars':
				return intl.formatMessage({ id: 'StreamChartProperties.DownBars' }, {});
			case 'upbars':
				return intl.formatMessage({ id: 'StreamChartProperties.UpBars' }, {});
			case 'hilolines':
				return intl.formatMessage({ id: 'StreamChartProperties.HiLoLines' }, {});
			default:
				return title;
		}
	}

	isHorizontalChart() {
		const item = this.state.plotView.getItem();
		return item.isHorizontalChart();
	}

	isLineChart() {
		const item = this.state.plotView.getItem();

		return !!item.getFirstSerieOfType('line');
	}

	getLabel(series) {
		const item = this.state.plotView.getItem();
		const ref = item.getDataSourceInfo(series.formula);
		if (ref && ref.yName !== undefined) {
			return ref.yName;
		}

		return String(item.series.indexOf(series) + 1);
	}

	render() {
		if (!this.state.plotView) {
			return <div />;
		}
		const selection = this.state.plotView.chartSelection;
		const data = this.getData();
		const item = this.state.plotView.getItem();
		const sheetView = this.getSheetView();
		return (
			<Slide direction="left" in={this.props.showStreamChartProperties} mountOnEnter unmountOnExit>
				<Paper
					square
					elevation={0}
					style={{
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
					<AppBar
						color='inherit'
						elevation={0}
						id={this.props.dummy}
						style={{
							backgroundColor: 'dimgrey',
							width: '100%',
							height: '48px',
							display: 'flex',
							flexDirection: 'row',
							position: 'relative',
							justifyContent: 'space-between'
						}}
					>
						<Typography
							style={{
								padding: '12px 0px 12px 8px',
								display: 'inline-block',
								fontSize: '12pt',
								color: 'white',
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
					</AppBar>
					<div
						style={{
							position: 'relative',
						}}
					>
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
											{intl.formatMessage({ id: `StreamChartProperties.Template${key}` }, {})}
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
									{item.xAxes[0].type === 'category' ? (
									<MenuItem value="hideempty" key={4}>
										<FormattedMessage
											id="StreamChartProperties.HideEmpty"
											defaultMessage="Hide empty Categories"
										/>
									</MenuItem>) : null}
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
										<FormattedMessage id="StreamChartProperties.Visible" defaultMessage="Visible" />
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
												checked={item.chart.seriesLines.visible}
												onChange={(event, state) =>
													this.handleVisibleChange(event, state, item.chart.seriesLines, 'chart')
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.SeriesLines"
												defaultMessage="Series Lines"
											/>
										}
									/>
									{this.isLineChart() ? (
										<FormControlLabel
											control={
												<Checkbox
													checked={item.chart.hiLoLines.visible}
													onChange={(event, state) =>
														this.handleVisibleChange(event, state, item.chart.hiLoLines, 'chart')
													}
												/>
											}
											label={
												<FormattedMessage
													id="StreamChartProperties.HiLoLines"
													defaultMessage="High Low Lines"
												/>
											}
										/>
									) : null}
									{this.isLineChart() ? (
										<FormControlLabel
											control={
												<Checkbox
													checked={item.chart.upBars.visible}
													onChange={(event, state) => this.handleUpDownBarsChange(event, state)}
												/>
											}
											label={
												<FormattedMessage
													id="StreamChartProperties.UpDownBars"
													defaultMessage="Up Down Bars"
												/>
											}
										/>
									) : null}
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.tooltips}
												onChange={(event, state) => this.handleTooltipsChange(event, state)}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.tooltips"
												defaultMessage="Tooltips"
											/>
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.varyByCategories}
												onChange={(event, state) => this.handleVaryByCategoriesChange(event, state)}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.VaryByCategories"
												defaultMessage="Vary Color By Category"
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
									{item.isCircular() ? (
										<div>
											<div
												style={{
													flexDirection: 'row'
												}}
											>
												<TextField
													style={{
														width: '135px'
													}}
													id="number"
													label={
														<FormattedMessage
															id="StreamChartProperties.Rotation"
															defaultMessage="Rotation"
														/>
													}
													InputProps={{
														min: 10,
														max: 90,
														step: 5,
														endAdornment: (
															<InputAdornment position="end">
																<FormattedMessage
																	id="StreamChartProperties.Degrees"
																	defaultMessage="Degrees"
																/>
															</InputAdornment>
														)
													}}
													error={item.chart.rotation > Math.PI_2 || item.chart.rotation < 0}
													helperText={
														item.chart.rotation > Math.PI_2 || item.chart.rotation < 0 ? (
															<FormattedMessage
																id="StreamChartProperties.InvalidAngle"
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
														width: '135px',
														marginLeft: '10px'
													}}
													id="number"
													label={
														<FormattedMessage
															id="StreamChartProperties.DoughnutHole"
															defaultMessage="Doughnut Hole (Percent)"
														/>
													}
													InputProps={{
														min: 0,
														max: 80,
														step: 1,
														endAdornment: <InputAdornment position="end">%</InputAdornment>
													}}
													error={item.chart.hole > 0.8 || item.chart.hole < 0}
													helperText={
														item.chart.hole > 0.8 || item.chart.hole < 0 ? (
															<FormattedMessage
																id="StreamChartProperties.InvalidDoughnutHole"
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
														width: '135px'
													}}
													id="number"
													label={
														<FormattedMessage
															id="StreamChartProperties.StartAngle"
															defaultMessage="Pie Start"
														/>
													}
													InputProps={{
														min: 0,
														max: 360,
														step: 5,
														endAdornment: (
															<InputAdornment position="end">
																<FormattedMessage
																	id="StreamChartProperties.Degrees"
																	defaultMessage="Degrees"
																/>
															</InputAdornment>
														)
													}}
													error={
														item.chart.startAngle > Math.PI * 2 || item.chart.startAngle < 0
													}
													helperText={
														item.chart.startAngle > Math.PI * 2 ||
														item.chart.startAngle < 0 ? (
															<FormattedMessage
																id="StreamChartProperties.InvalidAngle360"
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
													label={
														<FormattedMessage
															id="StreamChartProperties.EndAngle"
															defaultMessage="Pie End"
														/>
													}
													InputProps={{
														min: 0,
														max: 540,
														step: 5,
														endAdornment: (
															<InputAdornment position="end">
																<FormattedMessage
																	id="StreamChartProperties.Degrees"
																	defaultMessage="Degrees"
																/>
															</InputAdornment>
														)
													}}
													error={item.chart.endAngle > Math.PI * 3 || item.chart.endAngle < 0}
													helperText={
														item.chart.endAngle > Math.PI * 3 || item.chart.endAngle < 0 ? (
															<FormattedMessage
																id="StreamChartProperties.InvalidAngle540"
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
										</div>
									) : (
										<div>
											<FormLabel
												component="legend"
												style={{
													marginTop: '7px',
													marginBottom: '7px'
												}}
											>
												<FormattedMessage
													id="StreamChartProperties.Settings"
													defaultMessage="Settings"
												/>
											</FormLabel>
											<FormGroup>
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
														<FormattedMessage
															id="StreamChartProperties.Stacked"
															defaultMessage="Stacked"
														/>
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
												{this.isLineChart() ? (
													<FormControlLabel
														control={
															<Checkbox
																checked={item.chart.step}
																onChange={(event, state) =>
																	this.handleChartStepChange(event, state)
																}
															/>
														}
														label={
															<FormattedMessage
																id="StreamChartProperties.Step"
																defaultMessage="Step"
															/>
														}
													/>) : null}
												<FormControl
													style={{
														width: '95%',
														margin: '8px'
													}}
												>
													<InputLabel htmlFor="treshold">
														<FormattedMessage id="StreamChartProperties.ThresholdStyle" defaultMessage="Treshold Style" />
													</InputLabel>
													<Select
														id="tr"
														value={item.chart.varyByThreshold}
														onChange={this.handleVaryByThresholdChange}
														input={<Input name="threshold" id="threshold" />}
													>
														<MenuItem value="colorchange" key={1}>
															<FormattedMessage id="StreamChartProperties.ColorChange" defaultMessage="Color Change" />
														</MenuItem>
														<MenuItem value="gradient" key={2}>
															<FormattedMessage id="StreamChartProperties.Gradient" defaultMessage="Gradient" />
														</MenuItem>
													</Select>
												</FormControl>
											</FormGroup>
										</div>
									)}
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
									<FormattedMessage id="StreamChartProperties.Position" defaultMessage="Position" />
								</FormLabel>
								<FormControlLabel
									value="left"
									control={<Radio />}
									label={<FormattedMessage id="StreamChartProperties.left" defaultMessage="Left" />}
								/>
								<FormControlLabel
									value="middleleft"
									control={<Radio />}
									label={
										<FormattedMessage
											id="StreamChartProperties.middleleft"
											defaultMessage="Middle Left"
										/>
									}
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
									label={
										<FormattedMessage
											id="StreamChartProperties.middleright"
											defaultMessage="Middle Right"
										/>
									}
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
					{selection && selection.element === 'title' ? (
						<FormControl
							style={{
								width: '95%',
								margin: '8px'
							}}
						>
							<RadioGroup name="type" value={data.align} onChange={this.handleTitleAlignChange}>
								<FormLabel
									component="legend"
									style={{
										marginBottom: '7px'
									}}
								>
									<FormattedMessage id="StreamChartProperties.Position" defaultMessage="Position" />
								</FormLabel>
								<FormControlLabel
									value="left"
									control={<Radio />}
									label={<FormattedMessage id="StreamChartProperties.left" defaultMessage="Left" />}
								/>
								<FormControlLabel
									value="center"
									control={<Radio />}
									label={
										<FormattedMessage id="StreamChartProperties.center" defaultMessage="Center" />
									}
								/>
								<FormControlLabel
									value="right"
									control={<Radio />}
									label={<FormattedMessage id="StreamChartProperties.right" defaultMessage="Right" />}
								/>
							</RadioGroup>
						</FormControl>
					) : null}
					{selection && selection.element === 'plot' ? (
						<div>
							<FormLabel
								component="legend"
								style={{
									margin: '7px 7px 15px 7px'
								}}
							>
								<FormattedMessage id="StreamChartProperties.Series" defaultMessage="Series" />
							</FormLabel>

							<FormGroup
								style={{
									width: '95%',
									margin: '7px 7px 15px 7px'
								}}
							>
								<FormControlLabel
									control={
										<Checkbox
											checked={item.chart.coharentData}
											onChange={(event, state) => this.handleChartCoharentChange(event, state)}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.DataCoharent"
											defaultMessage="Data Range coharent"
										/>
									}
								/>
							</FormGroup>
							{item.chart.coharentData ? (
								<FormGroup
									style={{
										width: '95%',
										margin: '7px 7px 15px 7px'
									}}
								>
									<FormControl
										style={{
											fontSize: '8pt',
											borderTop: '1px solid #CCCCCC',
											paddingTop: '7px',
											marginBottom: '10px'
										}}
									>
										<CellRangeComponent
											label={
												<FormattedMessage
													id="StreamChartProperties.ChartDataRange"
													defaultMessage="Data Range"
												/>
											}
											sheetView={sheetView}
											onlyReference={false}
											fontSize="9pt"
											range={
												item.chart.formula.getFormula()
													? `=${item.chart.formula.getFormula()}`
													: ''
											}
											onBlur={(event) => this.handleChartFormulaBlur(event)}
											onKeyPress={(event) => {
												if (event.key === 'Enter') {
													this.handleChartFormulaBlur(event);
												}
											}}
										/>
									</FormControl>
									{!item.isTimeBasedChart() ? (
										<div>
											<FormControlLabel
												control={
													<Checkbox
														checked={item.chart.dataInRows}
														onChange={(event, state) =>
															this.handleChartDataInRowsChange(event, state)
														}
													/>
												}
												label={
													<FormattedMessage
														id="StreamChartProperties.DataInRows"
														defaultMessage="Data in Rows"
													/>
												}
											/>
											<FormControlLabel
												control={
													<Checkbox
														checked={item.chart.firstSeriesLabels}
														onChange={(event, state) =>
															this.handleChartFirstSeriesLabelsChange(event, state)
														}
													/>
												}
												label={
													item.chart.dataInRows ? (
														<FormattedMessage
															id="StreamChartProperties.FirstSeriesLabelsRow"
															defaultMessage="First Row has Series Labels"
														/>
													) : (
														<FormattedMessage
															id="StreamChartProperties.FirstSeriesLabelsColumn"
															defaultMessage="First Column has Series Labels"
														/>
													)
												}
											/>
											<FormControlLabel
												control={
													<Checkbox
														checked={item.chart.firstCategoryLabels}
														onChange={(event, state) =>
															this.handleChartFirstCategoryLabelsChange(event, state)
														}
													/>
												}
												label={
													item.chart.dataInRows ? (
														<FormattedMessage
															id="StreamChartProperties.FirstCategoryLabelsColumn"
															defaultMessage="First Colummn has Category Labels"
														/>
													) : (
														<FormattedMessage
															id="StreamChartProperties.FirstCategoryLabelsRow"
															defaultMessage="First Row has Category Labels"
														/>
													)
												}
											/>
										</div>
									) : null}
								</FormGroup>
							) : (
								item.series.map((series, index) => (
									<FormGroup
										style={{
											width: '95%',
											margin: '7px'
										}}
									>
										<FormControl
											/* eslint-disable-next-line react/no-array-index-key */
											key={`s${index}`}
											style={{
												fontSize: '8pt',
												borderTop: '1px solid #CCCCCC',
												paddingTop: '7px'
											}}
										>
											<CellRangeComponent
												label={this.getLabel(series)}
												sheetView={sheetView}
												onlyReference={false}
												fontSize="9pt"
												range={`=${series.formula.getFormula()}`}
												// onChange={this.handleDataRange}
												onBlur={(event) => this.handleSeriesFormulaBlur(event, series)}
												onKeyPress={(event) => {
													if (event.key === 'Enter') {
														this.handleSeriesFormulaBlur(event, series);
													}
												}}
											/>
										</FormControl>
										<FormGroup
											style={{
												width: '95%',
												margin: '0px',
												flexDirection: 'row',
												justifyContent: 'center'
											}}
										>
											<IconButton
												style={{
													display: 'inline'
												}}
												onClick={() => this.handleSeriesDuplicate(index)}
											>
												<SvgIcon viewBox="-3 -3 32 32">
													<path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
												</SvgIcon>
											</IconButton>
											{item.series.length > 1 ? (
												<IconButton
													style={{
														display: 'inline'
													}}
													onClick={() => this.handleSeriesDelete(index)}
												>
													<DeleteIcon fontSize="inherit" />
												</IconButton>
											) : null}
											{index ? (
												<IconButton
													style={{
														display: 'inline'
													}}
													onClick={() => this.handleSeriesMoveUp(index)}
												>
													<SvgIcon>
														<path
															d="M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z"
														/>
													</SvgIcon>
												</IconButton>
											) : null}
											{index < item.series.length - 1 ? (
												<IconButton
													style={{
														display: 'inline'
													}}
													onClick={() => this.handleSeriesMoveDown(index)}
												>
													<SvgIcon>
														<path
															d="M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z"
														/>
													</SvgIcon>
												</IconButton>
											) : null}
										</FormGroup>
									</FormGroup>
								))
							)}
							{item.getVisibleSeries() < item.series.length ? (
								<FormControl
									style={{
										width: '95%',
										margin: '8px'
									}}
								>
									<Button style={{}} onClick={this.handleShowSeries} color="primary">
										<FormattedMessage
											id="StreamChartProperties.ShowAllSeries"
											defaultMessage="Show all Series"
										/>
									</Button>
								</FormControl>
							) : null}
						</div>
					) : null}
					{selection && (selection.element === 'xAxis' || selection.element === 'yAxis') ? (
						<div>
							<ValueRangesDialog sheetView={sheetView} open={this.state.showValueRanges} ranges={data.valueRanges} stateHandler={this.handleEditValueRanges} />
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="axis-type">
									<FormattedMessage id="StreamChartProperties.axisType" defaultMessage="Axis Type" />
								</InputLabel>
								<Select
									id="axis-type"
									value={data.type}
									onChange={this.handleAxisTypeChange}
									input={<Input name="axis-type" id="axis-type" />}
								>
									{selection.element === 'xAxis' ? (
										<MenuItem value="category" key={0}>
											<FormattedMessage
												id="StreamChartProperties.axisTypeCategory"
												defaultMessage="Category"
											/>
										</MenuItem>
									) : null}
									<MenuItem value="linear" key={1}>
										<FormattedMessage
											id="StreamChartProperties.axisTypeLinear"
											defaultMessage="Linear"
										/>
									</MenuItem>
									<MenuItem value="time" key={2}>
										<FormattedMessage
											id="StreamChartProperties.axisTypeTime"
											defaultMessage="Time"
										/>
									</MenuItem>
									<MenuItem value="logarithmic" key={3}>
										<FormattedMessage
											id="StreamChartProperties.axisTypeLogarithmic"
											defaultMessage="Logarithmic"
										/>
									</MenuItem>
								</Select>
								<TextField
									id="number"
									label={
										<FormattedMessage
											id="StreamChartProperties.AxisLabelRotation"
											defaultMessage="Rotate Labels"
										/>
									}
									style={{
										width: '170px'
									}}
									InputProps={{
										min: -90,
										max: 90,
										step: 5,
										endAdornment: (
											<InputAdornment position="end">
												<FormattedMessage
													id="StreamChartProperties.Degrees"
													defaultMessage="Degrees"
												/>
											</InputAdornment>
										)
									}}
									value={data.format.fontRotation === undefined ? 0 : data.format.fontRotation}
									error={data.format.fontRotation > 90 || data.format.fontRotation < -90}
									helperText={
										data.format.fontRotation > 90 || data.format.fontRotation < -90 ? (
											<FormattedMessage
												id="StreamChartProperties.InvalidAngleAxis"
												defaultMessage="Angle must be between -90 and 90 degrees!"
											/>
										) : (
											''
										)
									}
									onChange={(event) => this.handleAxisLabelRotationChange(event)}
									type="number"
									margin="normal"
								/>
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
										<FormattedMessage id="StreamChartProperties.Visible" defaultMessage="Visible" />
									</FormLabel>
									<FormControlLabel
										control={
											<Checkbox
												checked={data.visible}
												onChange={(event, state) => this.handleAxisVisibleChange(event, state)}
											/>
										}
										label={
											<FormattedMessage id="StreamChartProperties.Axis" defaultMessage="Axis" />
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
												defaultMessage="Axis Title"
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
										<FormattedMessage
											id="StreamChartProperties.Settings"
											defaultMessage="Settings"
										/>
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
									{data.type === 'category' ? null : (
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
									)}
									<FormControlLabel
									control={
										<Checkbox
											checked={data.format.linkNumberFormat}
											onChange={(event, state) =>
												this.handleAxisNumberformatLinkChange(event, state)
											}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.LinkNumberFormat"
											defaultMessage="Link Numberformat to Cell"
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
									<TextField
										label={
											<FormattedMessage
												id="StreamChartProperties.ZoomGroup"
												defaultMessage="Zoom Group"
											/>
										}
										value={data.zoomGroup}
										onBlur={(event) => this.handleAxisZoomGroupChange(event)}
										onChange={(event) => this.handleAxisZoomGroupChange(event)}
										margin="normal"
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
									<FormattedMessage
										id="StreamChartProperties.AxisPosition"
										defaultMessage="Position"
									/>
								</InputLabel>
								<Select
									id="axis-position"
									value={data.align}
									onChange={this.handleAxisAlignChange}
									input={<Input name="axis-position" id="axis-position" />}
								>
									{(this.isHorizontalChart() && selection.element === 'xAxis') ||
									(!this.isHorizontalChart() && selection.element === 'yAxis') ? (
										<MenuItem value="left" key={1}>
											<FormattedMessage
												id="StreamChartProperties.AxisLeft"
												defaultMessage="Left"
											/>
										</MenuItem>
									) : (
										<MenuItem value="bottom" key={4}>
											<FormattedMessage
												id="StreamChartProperties.AxisBottom"
												defaultMessage="Bottom"
											/>
										</MenuItem>
									)}
									{(this.isHorizontalChart() && selection.element === 'xAxis') ||
									(!this.isHorizontalChart() && selection.element === 'yAxis') ? (
										<MenuItem value="right" key={2}>
											<FormattedMessage
												id="StreamChartProperties.AxisRight"
												defaultMessage="Right"
											/>
										</MenuItem>
									) : (
										<MenuItem value="top" key={3}>
											<FormattedMessage id="StreamChartProperties.AxisTop" defaultMessage="Top" />
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
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<Button style={{}} onClick={() => this.handleEditValueRanges(true)} color="primary">
									<FormattedMessage
										id="StreamChartProperties.EditValueRanges"
										defaultMessage="Edit Value Ranges"
									/>
								</Button>
							</FormControl>
							<FormLabel
								component="legend"
								style={{
									padding: '2px',
									border: 'grey 1px solid',
									margin: '7px 7px 7px 7px',
									fontSize: '9pt',
									lineHeight: '1.5'
								}}
							>
								<FormattedMessage id="StreamChartProperties.AxisHint" defaultMessage="Axis Hint" />
							</FormLabel>
						</div>
					) : null}
					{selection && selection.element === 'series' ? (
						<div>
							{data.type === 'bar' || data.type === 'profile' || data.type === 'line' ||
							data.type === 'column' || data.type === 'area' ? (
								<FormControl
									style={{
										display: 'inline-flex',
										margin: '8px',
										width: '95%'
									}}
								>
									<InputLabel htmlFor="series-marker">
										<FormattedMessage id="StreamChart.Type" defaultMessage="Series Display Type" />
									</InputLabel>
									{data.type === 'bar' || data.type === 'profile' ? (
										<Select
											id="series-marker"
											value={data.type}
											onChange={this.handleSeriesTypeChange}
											input={<Input name="series-marker" id="series-marker" />}
										>
											<MenuItem value="profile" key={1}>
												<FormattedMessage id="StreamChart.Profile" defaultMessage="Profile" />
											</MenuItem>
											<MenuItem value="bar" key={2}>
												<FormattedMessage id="StreamChart.Bar" defaultMessage="Bar" />
											</MenuItem>
										</Select>
									) : (
										<Select
											id="series-marker"
											value={data.type}
											onChange={this.handleSeriesTypeChange}
											input={<Input name="series-marker" id="series-marker" />}
										>
											<MenuItem value="line" key={1}>
												<FormattedMessage id="StreamChart.Line" defaultMessage="Line" />
											</MenuItem>
											<MenuItem value="column" key={2}>
												<FormattedMessage id="StreamChart.Column" defaultMessage="Column" />
											</MenuItem>
											<MenuItem value="area" key={3}>
												<FormattedMessage id="StreamChart.Area" defaultMessage="Area" />
											</MenuItem>
										</Select>
									)}
								</FormControl>
							) : null}
							<FormLabel
								component="legend"
								style={{
									margin: '8px'
								}}
							>
								<FormattedMessage id="StreamChartProperties.Marker" defaultMessage="Marker" />
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
										<FormattedMessage id="StreamChartProperties.none" defaultMessage="None" />
									</MenuItem>
									<MenuItem value="circle" key={2}>
										<FormattedMessage id="StreamChartProperties.circle" defaultMessage="Circle" />
									</MenuItem>
									<MenuItem value="cross" key={3}>
										<FormattedMessage id="StreamChartProperties.cross" defaultMessage="Cross" />
									</MenuItem>
									<MenuItem value="crossRot" key={4}>
										<FormattedMessage
											id="StreamChartProperties.rotatedCross"
											defaultMessage="Rotated Cross"
										/>
									</MenuItem>
									<MenuItem value="dash" key={5}>
										<FormattedMessage id="StreamChartProperties.dash" defaultMessage="Dash" />
									</MenuItem>
									<MenuItem value="dashright" key={6}>
										<FormattedMessage id="StreamChartProperties.dashright" defaultMessage="Dash Right" />
									</MenuItem>
									<MenuItem value="line" key={7}>
										<FormattedMessage id="StreamChartProperties.line" defaultMessage="Line" />
									</MenuItem>
									<MenuItem value="rect" key={8}>
										<FormattedMessage
											id="StreamChartProperties.rectangle"
											defaultMessage="Rectangle"
										/>
									</MenuItem>
									<MenuItem value="rectRot" key={9}>
										<FormattedMessage id="StreamChartProperties.diamond" defaultMessage="Diamond" />
									</MenuItem>
									<MenuItem value="star" key={10}>
										<FormattedMessage id="StreamChartProperties.star" defaultMessage="Star" />
									</MenuItem>
									<MenuItem value="triangle" key={11}>
										<FormattedMessage
											id="StreamChartProperties.triangle"
											defaultMessage="Triangle"
										/>
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
									labelFontSize='1rem'
									transparent
									color={
										data.marker.fillColor ||
										item.getTemplate().series.getFillForIndex(selection.index)
									}
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
									labelFontSize='1rem'
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
							{item.xAxes.length > 1 || item.yAxes.length > 1 ? (
								<FormLabel
									component="legend"
									style={{
										margin: '8px'
									}}
								>
									<FormattedMessage
										id="StreamChartProperties.AxisAssignment"
										defaultMessage="Axis Assignment"
									/>
								</FormLabel>
							) : null}
							{item.xAxes.length > 1 ? (
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
							) : null}
							{item.yAxes.length > 1 ? (
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
							) : null}
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
									<FormattedMessage id="StreamChartProperties.Settings" defaultMessage="Settings" />
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
											checked={data.visible}
											onChange={(event, state) => this.handleSeriesVisibleChange(event, state)}
										/>
									}
									label={
										<FormattedMessage id="StreamChartProperties.Visible" defaultMessage="Visible" />
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
					{selection && selection.element === 'serieslabel' ? (
						<div>
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
									<FormattedMessage id="StreamChartProperties.Display" defaultMessage="Display" />
								</FormLabel>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.dataLabel.content.x}
											onChange={(event, state) =>
												this.handleSeriesDataLabelsContentChange(event, 'x', state)
											}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.Categories"
											defaultMessage="X Values or Categories"
										/>
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.dataLabel.content.y}
											onChange={(event, state) =>
												this.handleSeriesDataLabelsContentChange(event, 'y', state)
											}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.YValues"
											defaultMessage="Y Values"
										/>
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.dataLabel.content.radius}
											onChange={(event, state) =>
												this.handleSeriesDataLabelsContentChange(event, 'radius', state)
											}
										/>
									}
									label={
										<FormattedMessage id="StreamChartProperties.Radius" defaultMessage="Radius" />
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.dataLabel.content.state}
											onChange={(event, state) =>
												this.handleSeriesDataLabelsContentChange(event, 'state', state)
											}
										/>
									}
									label={<FormattedMessage id="StreamChartProperties.State" defaultMessage="State" />}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.dataLabel.content.series}
											onChange={(event, state) =>
												this.handleSeriesDataLabelsContentChange(event, 'series', state)
											}
										/>
									}
									label={
										<FormattedMessage id="StreamChartProperties.Series" defaultMessage="Series" />
									}
								/>
							</FormGroup>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="position">
									<FormattedMessage id="StreamChartProperties.Position" defaultMessage="Position" />
								</InputLabel>
								<Select
									id="position"
									value={data.dataLabel.position}
									onChange={this.handleSeriesDataLabelsPositionChange}
									input={<Input name="position" id="position" />}
								>
									<MenuItem value="beforestart" key={1}>
										<FormattedMessage
											id="StreamChartProperties.BeforeStart"
											defaultMessage="Below or at inner Circle"
										/>
									</MenuItem>
									<MenuItem value="start" key={2}>
										<FormattedMessage
											id="StreamChartProperties.Start"
											defaultMessage="At bottom or at inner Circle"
										/>
									</MenuItem>
									<MenuItem value="center" key={3}>
										<FormattedMessage id="StreamChartProperties.Center" defaultMessage="Center" />
									</MenuItem>
									<MenuItem value="end" key={4}>
										<FormattedMessage
											id="StreamChartProperties.End"
											defaultMessage="At top or at outer Circle"
										/>
									</MenuItem>
									<MenuItem value="behindend" key={5}>
										<FormattedMessage
											id="StreamChartProperties.BehindEnd"
											defaultMessage="Above or Outside"
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
								<InputLabel htmlFor="hide-empty">
									<FormattedMessage id="StreamChartProperties.Separator" defaultMessage="Separator" />
								</InputLabel>
								<Select
									id="hide-empty"
									value={data.dataLabel.separator}
									onChange={this.handleSeriesDataLabelsSeparatorChange}
									input={<Input name="hide-empty" id="hide-empty" />}
								>
									<MenuItem value="&lf" key={1}>
										<FormattedMessage
											id="StreamChartProperties.LineFeed"
											defaultMessage="Line Feed"
										/>
									</MenuItem>
									<MenuItem value=" " key={2}>
										<FormattedMessage id="StreamChartProperties.Space" defaultMessage="Space" />
									</MenuItem>
									<MenuItem value="," key={4}>
										<FormattedMessage id="StreamChartProperties.Comma" defaultMessage="Comma" />
									</MenuItem>
									<MenuItem value=";" key={3}>
										<FormattedMessage
											id="StreamChartProperties.Semicolon"
											defaultMessage="Semicolon"
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
								<TextField
									style={{
										width: '170px'
									}}
									id="number"
									label={
										<FormattedMessage
											id="StreamChartProperties.LabelRotation"
											defaultMessage="Rotate Labels"
										/>
									}
									InputProps={{
										min: -90,
										max: 90,
										step: 5,
										endAdornment: (
											<InputAdornment position="end">
												<FormattedMessage
													id="StreamChartProperties.Degrees"
													defaultMessage="Degrees"
												/>
											</InputAdornment>
										)
									}}
									value={
										data.dataLabel.format.fontRotation === undefined
											? 0
											: data.dataLabel.format.fontRotation
									}
									onChange={(event) => this.handleSeriesDataLabelRotationChange(event)}
									type="number"
									margin="normal"
								/>
							</FormControl>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.dataLabel.format.linkNumberFormat}
											onChange={(event, state) =>
												this.handleSeriesDataLabelsLinkChange(event, state)
											}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.LinkNumberFormat"
											defaultMessage="Link Numberformat to Cell"
										/>
									}
								/>
							</FormControl>
						</div>
					) : null}
					{selection && (selection.element === 'xAxisGrid' || selection.element === 'yAxisGrid') ? (
						<div>
							<FormGroup
								style={{
									margin: '8px'
								}}
							>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.gridVisible}
											onChange={(event, state) => this.handleGridlineVisibleChange(event, state)}
										/>
									}
									label={
										<FormattedMessage id="StreamChartProperties.Visible" defaultMessage="Visible" />
									}
								/>
							</FormGroup>
						</div>
					) : null}
					<FormLabel
						component="legend"
						style={{
							padding: '2px',
							border: 'grey 1px solid',
							fontSize: '9pt',
							margin: '7px 7px 7px 7px',
							lineHeight: '1.5'
						}}
					>
						<FormattedMessage id="StreamChartProperties.FormatHint" defaultMessage="Format Hint" />
					</FormLabel>
					</div>
				</Paper>
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

export default connect(mapStateToProps, mapDispatchToProps)(StreamChartProperties);
