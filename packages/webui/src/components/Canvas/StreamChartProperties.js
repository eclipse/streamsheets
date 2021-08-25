/* eslint-disable react/jsx-no-duplicate-props */
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
	RadioGroup,
	FormGroup,
	MenuItem,
	FormControlLabel,
	IconButton,
	FormLabel,
	FormControl,
	Radio,
	Checkbox,
	InputAdornment,
	Input,
	Button,
	TextField
	// Typography
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import DeleteIcon from '@material-ui/icons/Delete';
import JSG from '@cedalo/jsg-ui';
import { NullTerm } from '@cedalo/parser';

import CellRangeComponent from './CellRangeComponent';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import ColorComponent from '../SheetDialogs/ColorComponent';
import { intl } from '../../helper/IntlGlobalProvider';
import SvgIcon from '@material-ui/core/SvgIcon';
import ValueRangesDialog from '../SheetDialogs/ValueRangesDialog';
import { withStyles } from '@material-ui/core/styles';

const markerSizes = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const styles = {
	icon: {
		color: 'white'
	},
	underline: {
		'&::before': {
			borderColor: 'white'
		},
		'&::after': {
			borderColor: 'white'
		},
		'&&&&:hover:before': {
			borderBottom: '2px solid white'
		}
	}
};

function MyInputComponent(props) {
	const { inputRef, ...other } = props;

	// implement `InputElement` interface
	React.useImperativeHandle(inputRef, () => ({
		focus: () => {
			// logic to focus the rendered component from 3rd party belongs here
		}
		// hiding the value e.g. react-stripe-elements
	}));

	// `Component` will be your ` SomeThirdPartyComponent` from below
	return <CellRangeComponent {...other} />;
}

export class StreamChartProperties extends Component {
	static propTypes = {
		// title: PropTypes.string.isRequired,
		// dummy: PropTypes.string
		view: PropTypes.object.isRequired,
	};

	// static defaultProps = {
	// 	dummy: ''
	// };

	constructor(props) {
		super(props);
		this.escFunction = this.escFunction.bind(this);

		this.state.showValueRanges = false;
	}

	state = {
		plotView: undefined,
		hole: 0,
		startAngle: 0,
		endAngle: 0,
		rotation: 0
	};

	componentDidMount() {
		document.addEventListener('keydown', this.escFunction, false);
	}

	static getDerivedStateFromProps(props, state) {
			const plotView = props.view; // StreamChartProperties.getPlotView();
			if (plotView && plotView !== state.plotView) {
				const item = plotView.getItem();
				return {
					...state,
					plotView,
					hole: item.chart ? item.chart.hole : undefined,
					rotation: item.chart ? item.chart.rotation : undefined,
					startAngle: item.chart ? item.chart.startAngle : undefined,
					endAngle: item.chart ? item.chart.endAngle : undefined
				};
			}
		return null;
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

	static getPlotView() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection === undefined || selection.length !== 1) {
			return undefined;
		}
		// const item = selection[0].getModel();
		return selection[0].getView();
		// return item instanceof JSG.SheetPlotNode ? selection[0].getView() : undefined;
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
			// this.props.setAppState({ showStreamChartProperties: false });
		}
	}

	updateState(notify = false) {
		const view = StreamChartProperties.getPlotView();
		if (view === undefined) {
			return;
		}

		this.setState({
			plotView: view
		});

		if (notify) {
			JSG.NotificationCenter.getInstance().send(
				new JSG.Notification(JSG.SelectionProvider.SELECTION_CHANGED_NOTIFICATION, view.getItem())
			);
		}
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
		return this.state.plotView.getItem().chart
			? this.state.plotView.getItem().getDataFromSelection(selection)
			: undefined;
	}

	getExpression(item, value) {
		try {
			return this.getSheet(item).textToExpression(String(value));
		} catch (e) {
			this.getSheetView().notifyMessage({
				message: e.message,
				focusIndex: e.index !== undefined ? e.index + 1 : 1
			});
			return false;
		}
	}

	finishCommand(cmd, key, notify = false) {
		const item = this.state.plotView.getItem();
		item.finishCommand(cmd, key);
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.execute(cmd);
		this.updateState(notify);
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

	handleChartGaugePointerChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const data = this.getData();
		data.gaugePointer = state;
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

	handleChartRotationBlur = () => {
		const data = this.getData();

		this.setState({ rotation: data.rotation });
	};

	handleChartRotationChange = (event) => {
		const value = Number(event.target.value);

		if (value >= 10 && value <= 90) {
			const cmd = this.prepareCommand('chart');
			const data = this.getData();
			data.rotation = JSG.MathUtils.toRadians(value);
			this.finishCommand(cmd, 'chart');
		}
		this.setState({ rotation: JSG.MathUtils.toRadians(value) });
	};

	handleChartHoleBlur = () => {
		const data = this.getData();

		this.setState({ hole: data.hole });
	};

	handleChartHoleChange = (event) => {
		const value = Number(event.target.value);

		if (value >= 0 && value <= 95) {
			const cmd = this.prepareCommand('chart');
			const data = this.getData();
			data.hole = value / 100;
			this.finishCommand(cmd, 'chart');
		}
		this.setState({ hole: value / 100 });
	};

	checkAngles(startAngle, endAngle, start) {
		if (endAngle - startAngle > Math.PI * 2 || endAngle - startAngle < JSG.MathUtils.toRadians(5)) {
			return (
				<FormattedMessage
					id="StreamChartProperties.InvalidAngleRange"
					defaultMessage="The angle range must be between 5 and 360 degrees!"
				/>
			);
		}

		if (start && (startAngle > Math.PI * 2 || startAngle < 0)) {
			return (
				<FormattedMessage
					id="StreamChartProperties.InvalidAngle360"
					defaultMessage="The start range must be 0 and 360 degrees!"
				/>
			);
		}

		if (!start && (endAngle > Math.PI * 3 || endAngle < 0)) {
			return (
				<FormattedMessage
					id="StreamChartProperties.InvalidAngle540"
					defaultMessage="The end angle must be 0 and 540 degrees!"
				/>
			);
		}

		return '';
	}

	handleChartStartAngleChange = (event) => {
		const value = JSG.MathUtils.toRadians(Number(event.target.value));

		if (this.checkAngles(value, this.state.endAngle, true) === '') {
			const cmd = this.prepareCommand('chart');
			const data = this.getData();
			data.startAngle = value;
			this.finishCommand(cmd, 'chart');
		}
		this.setState({ startAngle: value });
	};

	handleChartStartAngleBlur = () => {
		const data = this.getData();

		this.setState({ startAngle: data.startAngle });
	};

	handleChartEndAngleChange = (event) => {
		const value = JSG.MathUtils.toRadians(Number(event.target.value));

		if (this.checkAngles(this.state.startAngle, value, false) === '') {
			const cmd = this.prepareCommand('chart');
			const data = this.getData();
			data.endAngle = value;
			this.finishCommand(cmd, 'chart');
		}

		this.setState({ endAngle: value });
	};

	handleChartEndAngleBlur = () => {
		const data = this.getData();

		this.setState({ endAngle: data.endAngle });
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

	handleMenuVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();
		item.chart.menuVisible = state;
		this.finishCommand(cmd, 'chart');
	};

	handleMapZoomChange = (event, state) => {
		const cmd = this.prepareCommand('chart');
		const item = this.state.plotView.getItem();
		item.chart.mapZoom = state;
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

	handleLegendFormulaBlur = (event) => {
		const item = this.state.plotView.getItem();
		const formula = event.target.textContent.replace(/^=/, '');
		const cmdLegend = this.prepareCommand('legend');

		item.legend.formula = new JSG.Expression(0, formula);

		this.finishCommand(cmdLegend, 'legend');
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

		const expr = this.getExpression(item, event.target.textContent);
		if (expr && expr.expression) {
			series.formula = expr.expression;
		}

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

	handleValueRangesVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.valueRangesVisible = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisLabelRotationChange = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.format.fontRotation = event.target.value;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisLabelDistanceChange = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.labelDistance = event.target.value;
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

	replaceTerm(event, expression, index) {
		const sheetView = this.getSheetView();
		const formula = event.target.textContent;
		const newExpression = sheetView.getItem().textToExpression(formula);
		const term = expression.getTerm();

		if (term && newExpression) {
			for (let i = term.params.length; i < index; i += 1) {
				term.params[i] = new NullTerm();
			}

			term.params[index] = newExpression.term;
			expression.correctFormula(sheetView.getItem(), true);
		}
	}

	handleAxisMinimumFormulaBlur = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();

		this.replaceTerm(event, data.formula, 0);
		this.finishCommand(cmd, 'axes', true);
	};

	handleAxisMaximumFormulaBlur = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();

		this.replaceTerm(event, data.formula, 1);
		this.finishCommand(cmd, 'axes', true);
	};

	handleAxisStepFormulaBlur = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();

		this.replaceTerm(event, data.formula, 2);
		this.finishCommand(cmd, 'axes', true);
	};

	handleAxisTimeStepFormulaBlur = (event) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();

		this.replaceTerm(event, data.formula, 3);
		this.finishCommand(cmd, 'axes', true);
	};

	handleAxisTitleVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.title.visible = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisTitleTitleVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.visible = state;
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
		});
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
			if (item.isGauge()) {
				axis.align = 'radialinside';
			} else {
				axis.align = item.yAxes.length % 2 ? 'right' : 'left';
			}
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

	handleSeriesIndexChange = (event) => {
		this.state.plotView.chartSelection.index = Number(event.target.value);
		this.state.plotView.chartSelection.data = this.state.plotView.getItem().series[Number(event.target.value)];
		this.updateState(true);
		graphManager.redraw();
	}

	handleAxesIndexChange = (event) => {
		const index = Number(event.target.value);

		if (index < this.state.plotView.getItem().xAxes.length) {
			this.state.plotView.chartSelection.index = Number(event.target.value);
			this.state.plotView.chartSelection.element = 'xAxis';
			this.state.plotView.chartSelection.data = this.state.plotView.getItem().xAxes[Number(event.target.value)];
		} else {
			const xCnt = this.state.plotView.getItem().xAxes.length;
			this.state.plotView.chartSelection.index = Number(event.target.value) - xCnt;
			this.state.plotView.chartSelection.element = 'yAxis';
			this.state.plotView.chartSelection.data = this.state.plotView.getItem().yAxes[Number(event.target.value) - xCnt];
		}
		this.updateState(true);
		graphManager.redraw();
	}

	handleAxesGridIndexChange = (event) => {
		const index = Number(event.target.value);

		if (index < this.state.plotView.getItem().xAxes.length) {
			this.state.plotView.chartSelection.index = Number(event.target.value);
			this.state.plotView.chartSelection.element = 'xAxisGrid';
			this.state.plotView.chartSelection.data = this.state.plotView.getItem().xAxes[Number(event.target.value)];
		} else {
			const xCnt = this.state.plotView.getItem().xAxes.length;
			this.state.plotView.chartSelection.index = Number(event.target.value) - xCnt;
			this.state.plotView.chartSelection.element = 'yAxisGrid';
			this.state.plotView.chartSelection.data = this.state.plotView.getItem().yAxes[Number(event.target.value) - xCnt];
		}
		this.updateState(true);
		graphManager.redraw();
	}

	handleAxesTitleIndexChange = (event) => {
		const index = Number(event.target.value);

		if (index < this.state.plotView.getItem().xAxes.length) {
			this.state.plotView.chartSelection.index = Number(event.target.value);
			this.state.plotView.chartSelection.element = 'xAxisTitle';
			this.state.plotView.chartSelection.data = this.state.plotView.getItem().xAxes[Number(event.target.value)].title;
		} else {
			const xCnt = this.state.plotView.getItem().xAxes.length;
			this.state.plotView.chartSelection.index = Number(event.target.value) - xCnt;
			this.state.plotView.chartSelection.element = 'yAxisTitle';
			this.state.plotView.chartSelection.data = this.state.plotView.getItem().yAxes[Number(event.target.value) - xCnt].title;
		}
		this.updateState(true);
		graphManager.redraw();
	}

	handleSeriesTooltipContentChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.tooltip = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesPointerTypeChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.pointerType = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesPointerLengthChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.pointerLength = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerStyleChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		const selection = this.state.plotView.chartSelection;

		if (selection.element === 'series') {
			data.marker.style = event.target.value;
			data.points.forEach((point) => {
				if (point.marker) {
					point.marker.style = undefined;
				}
			});
		} else {
			const item = this.state.plotView.getItem();
			const point = item.getDataPoint(data, selection);
			if (!point.marker) {
				point.marker = new JSG.ChartMarker();
			}
			point.marker.style = event.target.value;
		}

		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerSizeChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		const selection = this.state.plotView.chartSelection;

		if (selection.element === 'series') {
			data.marker.size = Number(event.target.value);
			data.points.forEach((point) => {
				if (point.marker) {
					point.marker.size = undefined;
				}
			});
		} else {
			const item = this.state.plotView.getItem();
			const point = item.getDataPoint(data, selection);
			if (!point.marker) {
				point.marker = new JSG.ChartMarker();
			}
			point.marker.size = Number(event.target.value);
		}

		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerFillColorChange = (color) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		const selection = this.state.plotView.chartSelection;

		if (selection.element === 'series') {
			data.marker.fillColor = color;
			data.points.forEach((point) => {
				if (point.marker) {
					point.marker.fillColor = undefined;
				}
			});
		} else {
			const item = this.state.plotView.getItem();
			const point = item.getDataPoint(data, selection);
			if (!point.marker) {
				point.marker = new JSG.ChartMarker();
			}
			point.marker.fillColor = color;
		}

		this.finishCommand(cmd, 'series');
	};

	handleSeriesMarkerLineColorChange = (color) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		const selection = this.state.plotView.chartSelection;

		if (selection.element === 'series') {
			data.marker.lineColor = color;
			data.points.forEach((point) => {
				if (point.marker) {
					point.marker.lineColor = undefined;
				}
			});
		} else {
			const item = this.state.plotView.getItem();
			const point = item.getDataPoint(data, selection);
			if (!point.marker) {
				point.marker = new JSG.ChartMarker();
			}
			point.marker.lineColor = color;
		}

		this.finishCommand(cmd, 'series');
	};

	handleSeriesMapName = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.map.name = event.target.value;
		data.map.mapData = undefined;
		data.map.requesting = undefined;
		this.finishCommand(cmd, 'series');

		// map needs some time to load then render map properties
		setTimeout(() => {
			this.updateState();
		}, 500);

	};

	handleSeriesMapDisplayType = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.map.displayType = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMapChartType = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.map.chartType = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesMapLabelChange = (event) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.map.label = event.target.value;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesCopyMapLabels = () => {
		const data = this.getData();

		if (!data.map || !data.map.mapData) {
			return;
		}

		const features = data.map.mapData.features;
		const names = [];

		features.forEach((feature) => {
			const name = feature.properties[data.map.label] || '';
			if (name && names.indexOf(name) === -1) {
				names.push(name);
			}
		});
		names.sort();

		let clipData = '';

		names.forEach((key) => {
			// clipData += `"${key}",\n`;
			clipData += `${key}\n`;
		});

		const sheetView = this.getSheetView();
		sheetView.copyToClipboard(clipData);
	};

	handlePointSumChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		const selection = this.state.plotView.chartSelection;

		const item = this.state.plotView.getItem();
		const point = item.getDataPoint(data, selection);
		point.pointSum = state ? true : undefined;

		this.finishCommand(cmd, 'series');
	};

	handleSeriesSmoothChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.smooth = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesAutoSumChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.autoSum = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesInnerPointsChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.innerPoints = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesOuterPointsChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.outerPoints = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesAverageChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.average = state;
		this.finishCommand(cmd, 'series');
	};

	handleSeriesVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		data.visible = state;
		this.finishCommand(cmd, 'series');
	};

	getAxisAlignOptions(selection) {
		if (this.isGaugeChart()) {
			return [
				<MenuItem value="radialoutside" key={1}>
					<FormattedMessage id="StreamChartProperties.AxisOutside" defaultMessage="Outside" />
				</MenuItem>,
				<MenuItem value="radialinside" key={2}>
					<FormattedMessage id="StreamChartProperties.AxisInside" defaultMessage="Inside" />
				</MenuItem>
			];
		}

		if (
			(this.isHorizontalChart() && selection.element === 'xAxis') ||
			(!this.isHorizontalChart() && selection.element === 'yAxis')
		) {
			return [
				<MenuItem value="left" key={1}>
					<FormattedMessage id="StreamChartProperties.AxisLeft" defaultMessage="Left" />
				</MenuItem>,
				<MenuItem value="right" key={2}>
					<FormattedMessage id="StreamChartProperties.AxisRight" defaultMessage="Right" />
				</MenuItem>
			];
		}

		return [
			<MenuItem value="bottom" key={4}>
				<FormattedMessage id="StreamChartProperties.AxisBottom" defaultMessage="Bottom" />
			</MenuItem>,
			<MenuItem value="top" key={3}>
				<FormattedMessage id="StreamChartProperties.AxisTop" defaultMessage="Top" />
			</MenuItem>
		];
	}

	getLabelPositionOptions(serie) {
		switch (serie.type) {
			case 'pie':
				return [
					<MenuItem value="inner" key={2}>
						<FormattedMessage id="StreamChartProperties.InsideCircle" defaultMessage="At inner Circle" />
					</MenuItem>,
					<MenuItem value="center" key={3}>
						<FormattedMessage id="StreamChartProperties.Center" defaultMessage="Center" />
					</MenuItem>,
					<MenuItem value="outer" key={4}>
						<FormattedMessage id="StreamChartProperties.OutsideCircle" defaultMessage="At outer Circle" />
					</MenuItem>
				];
			case 'doughnut':
			case 'gauge':
			case 'heatmap':
				return [
					<MenuItem value="center" key={3}>
						<FormattedMessage id="StreamChartProperties.Center" defaultMessage="Center" />
					</MenuItem>
				];
			case 'line':
			case 'profile':
			case 'scatter':
			case 'boxplot':
			case 'bubble':
			case 'map':
				return [
					<MenuItem value="left" key={1}>
						<FormattedMessage id="StreamChartProperties.Left" defaultMessage="Left" />
					</MenuItem>,
					<MenuItem value="above" key={2}>
						<FormattedMessage id="StreamChartProperties.Above" defaultMessage="Above" />
					</MenuItem>,
					<MenuItem value="center" key={3}>
						<FormattedMessage id="StreamChartProperties.Center" defaultMessage="Center" />
					</MenuItem>,
					<MenuItem value="right" key={4}>
						<FormattedMessage id="StreamChartProperties.Right" defaultMessage="Right" />
					</MenuItem>,
					<MenuItem value="below" key={5}>
						<FormattedMessage id="StreamChartProperties.Below" defaultMessage="Below" />
					</MenuItem>
				];
			default:
				return [
					<MenuItem value="start" key={2}>
						<FormattedMessage id="StreamChartProperties.Start" defaultMessage="At Start" />
					</MenuItem>,
					<MenuItem value="center" key={3}>
						<FormattedMessage id="StreamChartProperties.Center" defaultMessage="Center" />
					</MenuItem>,
					<MenuItem value="end" key={4}>
						<FormattedMessage id="StreamChartProperties.End" defaultMessage="At End" />
					</MenuItem>,
					<MenuItem value="behindend" key={5}>
						<FormattedMessage id="StreamChartProperties.BehindEnd" defaultMessage="Behind End" />
					</MenuItem>
				];
		}
	}

	handleSeriesDataLabelsChange = (event, state) => {
		const cmd = this.prepareCommand('series');
		const data = this.getData();
		const selection = this.state.plotView.chartSelection;
		let dataLabel;

		if (selection.element === 'series') {
			dataLabel = data.dataLabel;
			dataLabel.visible = state;
			if (
				dataLabel.visible &&
				!dataLabel.content.x &&
				!dataLabel.content.y &&
				!dataLabel.content.id &&
				!dataLabel.content.radius &&
				!dataLabel.content.state &&
				!dataLabel.content.series
			) {
				dataLabel.content.y = true;
			}
			data.points.forEach((point) => {
				if (point.dataLabel) {
					point.dataLabel.visible = undefined;
				}
			});
		} else {
			const item = this.state.plotView.getItem();
			const point = item.getDataPoint(data, selection);
			if (!point.dataLabel) {
				point.dataLabel = new JSG.ChartDataLabel();
				point.dataLabel.position = data.dataLabel.position;
			}
			point.dataLabel.visible = state;
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
		switch (title) {
			case 'Chart':
				return intl.formatMessage({ id: 'StreamChartProperties.Chart' }, {});
			case 'title':
				return intl.formatMessage({ id: 'StreamChartProperties.Title' }, {});
			case 'plot':
				return intl.formatMessage({ id: 'StreamChartProperties.Plot' }, {});
			case 'legend':
				return intl.formatMessage({ id: 'StreamChartProperties.Legend' }, {});
			case 'axes':
				return intl.formatMessage({ id: 'StreamChartProperties.AxisProperties' }, {});
			case 'axesgrid':
				return intl.formatMessage({ id: 'StreamChartProperties.Grid' }, {});
			case 'axestitle':
				return intl.formatMessage({ id: 'StreamChartProperties.AxisTitle' }, {});
			case 'series':
				return intl.formatMessage({ id: 'StreamChartProperties.Series' }, {});
			case 'point':
				return intl.formatMessage({ id: 'StreamChartProperties.Point' }, {});
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

	isFunnelChart() {
		const item = this.state.plotView.getItem();
		return !!item.getFirstSerieOfType('funnelbar') || !!item.getFirstSerieOfType('funnelcolumn');
	}

	isGaugeChart() {
		const item = this.state.plotView.getItem();
		return !!item.getFirstSerieOfType('gauge');
	}

	getMarkerStyle(data) {
		const selection = this.state.plotView.chartSelection;

		if (
			selection.element === 'point' &&
			data.points[selection.pointIndex] &&
			data.points[selection.pointIndex].marker &&
			data.points[selection.pointIndex].marker._style !== undefined
		) {
			return data.points[selection.pointIndex].marker.style;
		}

		return data.marker.style;
	}

	getMarkerSize(data) {
		const selection = this.state.plotView.chartSelection;

		if (
			selection.element === 'point' &&
			data.points[selection.pointIndex] &&
			data.points[selection.pointIndex].marker &&
			data.points[selection.pointIndex].marker._size !== undefined
		) {
			return data.points[selection.pointIndex].marker.size;
		}

		return data.marker.size;
	}

	getMarkerLineColor(data) {
		const selection = this.state.plotView.chartSelection;

		if (
			selection.element === 'point' &&
			data.points[selection.pointIndex] &&
			data.points[selection.pointIndex].marker &&
			data.points[selection.pointIndex].marker.lineColor !== undefined
		) {
			return data.points[selection.pointIndex].marker.lineColor;
		}

		const item = this.state.plotView.getItem();
		return data.marker.lineColor || item.getTemplate().series.getLineForIndex(selection.index);
	}

	getMarkerFillColor(data) {
		const selection = this.state.plotView.chartSelection;

		if (
			selection.element === 'point' &&
			data.points[selection.pointIndex] &&
			data.points[selection.pointIndex].marker &&
			data.points[selection.pointIndex].marker.fillColor !== undefined
		) {
			return data.points[selection.pointIndex].marker.fillColor;
		}

		const item = this.state.plotView.getItem();
		return data.marker.fillColor || item.getTemplate().series.getFillForIndex(selection.index);
	}

	getDataLabelVisible(data) {
		const selection = this.state.plotView.chartSelection;

		if (
			selection.element === 'point' &&
			data.points[selection.pointIndex] &&
			data.points[selection.pointIndex].dataLabel &&
			data.points[selection.pointIndex].dataLabel.visible !== undefined
		) {
			return data.points[selection.pointIndex].dataLabel.visible;
		}

		return data.dataLabel.visible === true;
	}

	getPointSum(data) {
		const selection = this.state.plotView.chartSelection;

		return !!(
			selection.element === 'point' &&
			data.points[selection.pointIndex] &&
			data.points[selection.pointIndex].pointSum
		);
	}

	getLabel(series) {
		const item = this.state.plotView.getItem();
		const ref = item.getDataSourceInfo(series);
		if (ref && ref.yName !== undefined) {
			return ref.yName;
		}

		return String(item.series.indexOf(series) + 1);
	}

	getFormulaParameter(expr, index) {
		const term = expr.getTerm();
		if (term && term.params && term.params.length > index) {
			const param = term.params[index];
			if (param.isStatic) {
				let str = param.toLocaleString(JSG.getParserLocaleSettings());
				str = str.replace(/^"(.+(?="$))"$/, '$1');
				return str;
			} else {
				const sheetView = this.getSheetView();
				return `=${param.toString({item: sheetView.getItem(), useName: true})}`;
			}
		}
		return '';
	}

	render() {
		if (!this.state.plotView) {
			return <div />;
		}
		const selection = this.state.plotView.chartSelection;
		const data = this.getData();
		const item = this.state.plotView.getItem();
		const sheetView = this.getSheetView();
		if (!sheetView) {
			return <div />;
		}
		const sheetItem = sheetView.getItem();
		// const classes = this.props.classes;
		const boxPlot = item.chart && item.isBoxPlot();
		const gauge = item.chart && item.isGauge();
		const circular = item.chart && item.isCircular();
		const map = item.chart && item.isMap();
		return (
			<div
				style={{
					position: 'relative',
				}}
			>
				{!selection ? (
					<FormGroup>
						<FormControl>
							<TextField
								variant="outlined"
								size="small"
								margin="normal"
								label={
									<FormattedMessage id="StreamChartProperties.template" defaultMessage="Template" />
								}
								select
								fullWidth
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
							</TextField>
						</FormControl>
						{!circular && !gauge ? (
							<FormControl>
								<TextField
									variant="outlined"
									size="small"
									label={
										<FormattedMessage
											id="StreamChartProperties.DataHandling"
											defaultMessage="Missing Data"
										/>
									}
									margin="normal"
									select
									fullWidth
									value={data.dataMode}
									onChange={this.handleDataModeChange}
								>
									<MenuItem value="datazero" key={1}>
										<FormattedMessage
											id="StreamChartProperties.DataZero"
											defaultMessage="Display as zero"
										/>
									</MenuItem>
									{map
										? [
												<MenuItem value="dataignore" key={2}>
													<FormattedMessage
														id="StreamChartProperties.DataHide"
														defaultMessage="Do not display"
													/>
												</MenuItem>,
												<MenuItem value="datainterrupt" key={3}>
													<FormattedMessage
														id="StreamChartProperties.DataGrey"
														defaultMessage="Gray Area"
													/>
												</MenuItem>
										  ]
										: [
												<MenuItem value="dataignore" key={2}>
													<FormattedMessage
														id="StreamChartProperties.DataIgnore"
														defaultMessage="Do not display"
													/>
												</MenuItem>,
												<MenuItem value="datainterrupt" key={3}>
													<FormattedMessage
														id="StreamChartProperties.DataInterrupt"
														defaultMessage="Interrupt line"
													/>
												</MenuItem>
										  ]}
									{item.xAxes[0].type === 'category' && !map ? (
										<MenuItem value="hideempty" key={4}>
											<FormattedMessage
												id="StreamChartProperties.HideEmpty"
												defaultMessage="Hide empty Categories"
											/>
										</MenuItem>
									) : null}
								</TextField>
							</FormControl>
						) : null}
						<FormControl>
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
									label={<FormattedMessage id="StreamChartProperties.title" defaultMessage="Title" />}
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
										<FormattedMessage id="StreamChartProperties.legend" defaultMessage="Legend" />
									}
								/>
								{this.isFunnelChart() ? (
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.seriesLines.visible}
												onChange={(event, state) =>
													this.handleVisibleChange(
														event,
														state,
														item.chart.seriesLines,
														'chart'
													)
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
								) : null}
								{this.isLineChart() ? (
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.hiLoLines.visible}
												onChange={(event, state) =>
													this.handleVisibleChange(
														event,
														state,
														item.chart.hiLoLines,
														'chart'
													)
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
								{circular || gauge || item.isType('bar') || item.isType('column') ? (
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.varyByCategories}
												onChange={(event, state) =>
													this.handleVaryByCategoriesChange(event, state)
												}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.VaryByCategories"
												defaultMessage="Vary Color By Category"
											/>
										}
									/>
								) : null}
								<FormControlLabel
									control={
										<Checkbox
											checked={item.chart.menuVisible}
											onChange={(event, state) =>
												this.handleMenuVisibleChange(event, state)
											}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.MenuVisible"
											defaultMessage="Allow Visible Series Selection"
										/>
									}
								/>
								{map ? (
									<FormControlLabel
										control={
											<Checkbox
												checked={item.chart.mapZoom}
												onChange={(event, state) => this.handleMapZoomChange(event, state)}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.AllowMapZoom"
												defaultMessage="Allow Zoom"
											/>
										}
									/>
								) : null}
							</FormGroup>
						</FormControl>
						<FormLabel
							component="legend"
							style={{
								marginTop: '7px',
								marginBottom: '7px'
							}}
						>
							<FormattedMessage id="StreamChartProperties.Settings" defaultMessage="Settings" />
						</FormLabel>
						{gauge ? (
							<FormControlLabel
								control={
									<Checkbox
										checked={item.chart.gaugePointer}
										onChange={(event, state) => this.handleChartGaugePointerChange(event, state)}
									/>
								}
								label={
									<FormattedMessage
										id="StreamChartProperties.GaugePointer"
										defaultMessage="Use Pointer for Gauge"
									/>
								}
							/>
						) : null}
						{!map && !circular && !boxPlot ? (
							<FormControlLabel
								control={
									<Checkbox
										checked={item.chart.stacked}
										onChange={(event, state) => this.handleChartStackedChange(event, state)}
									/>
								}
								label={<FormattedMessage id="StreamChartProperties.Stacked" defaultMessage="Stacked" />}
							/>
						) : null}
						<FormControl>
							<FormGroup>
								{circular || gauge ? (
									<div>
										<div
											style={{
												flexDirection: 'row'
											}}
										>
											{!gauge ? (
												<TextField
													variant="outlined"
													size="small"
													id="number"
													margin="normal"
													style={{
														width: '135px'
													}}
													label={
														<FormattedMessage
															id="StreamChartProperties.Rotation"
															defaultMessage="Rotation"
														/>
													}
													inputProps={{
														min: 10,
														max: 90,
														step: 5
													}}
													InputProps={{
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
														this.state.rotation > Math.PI_2 ||
														this.state.rotation < JSG.MathUtils.toRadians(10)
													}
													helperText={
														this.state.rotation > Math.PI_2 ||
														this.state.rotation < JSG.MathUtils.toRadians(10) ? (
															<FormattedMessage
																id="StreamChartProperties.InvalidAngle"
																defaultMessage="Angle must be between 10 and 90 degrees!"
															/>
														) : (
															''
														)
													}
													value={JSG.MathUtils.toDegrees(this.state.rotation, 0)}
													onChange={(event) => this.handleChartRotationChange(event)}
													onBlur={(event) => this.handleChartRotationBlur(event)}
													type="number"
												/>
											) : null}

											{!item.isPie() ? (
												<TextField
													variant="outlined"
													size="small"
													margin="normal"
													style={{
														width: '135px',
														marginLeft: gauge ? '0px' : '10px'
													}}
													id="number"
													label={
														<FormattedMessage
															id="StreamChartProperties.DoughnutHole"
															defaultMessage="Doughnut Hole (Percent)"
														/>
													}
													inputProps={{
														min: 0,
														max: 99,
														step: 1
													}}
													InputProps={{
														endAdornment: <InputAdornment position="end">%</InputAdornment>
													}}
													error={this.state.hole > 0.95 || this.state.hole < 0}
													helperText={
														this.state.hole > 0.95 || this.state.hole < 0 ? (
															<FormattedMessage
																id="StreamChartProperties.InvalidDoughnutHole"
																defaultMessage="The hole value must be between 0 and 95 percent!"
															/>
														) : (
															''
														)
													}
													value={Math.round(this.state.hole * 100)}
													onChange={(event) => this.handleChartHoleChange(event)}
													onBlur={(event) => this.handleChartHoleBlur(event)}
													type="number"
												/>
											) : null}
										</div>
										<div
											style={{
												flexDirection: 'row'
											}}
										>
											<TextField
												variant="outlined"
												size="small"
												margin="normal"
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
												inputProps={{
													min: 0,
													max: 360,
													step: 5
												}}
												InputProps={{
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
													this.checkAngles(
														this.state.startAngle,
														this.state.endAngle,
														true
													) !== ''
												}
												helperText={this.checkAngles(
													this.state.startAngle,
													this.state.endAngle,
													true
												)}
												value={JSG.MathUtils.toDegrees(this.state.startAngle, 0)}
												onChange={(event) => this.handleChartStartAngleChange(event)}
												onBlur={(event) => this.handleChartStartAngleBlur(event)}
												type="number"
											/>
											<TextField
												variant="outlined"
												size="small"
												margin="normal"
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
												inputProps={{
													min: 0,
													max: 540,
													step: 5
												}}
												InputProps={{
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
													this.checkAngles(
														this.state.startAngle,
														this.state.endAngle,
														false
													) !== ''
												}
												helperText={this.checkAngles(
													this.state.startAngle,
													this.state.endAngle,
													false
												)}
												value={JSG.MathUtils.toDegrees(this.state.endAngle, 0)}
												onChange={(event) => this.handleChartEndAngleChange(event)}
												onBlur={(event) => this.handleChartEndAngleBlur(event)}
												type="number"
											/>
										</div>
									</div>
								) : (
									<div>
										<FormGroup>
											{!boxPlot && !map ? (
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
											) : null}
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
												/>
											) : null}
										</FormGroup>
									</div>
								)}
								{!boxPlot && !map
									? [
											<TextField
												variant="outlined"
												size="small"
												margin="normal"
												label={
													<FormattedMessage
														id="StreamChartProperties.ThresholdDataRange"
														defaultMessage="Threshold Data Range"
													/>
												}
												onBlur={(event) => this.handleLegendFormulaBlur(event)}
												onKeyPress={(event) => {
													if (event.key === 'Enter') {
														this.handleLegendFormulaBlur(event);
													}
												}}
												value={
													item.legend.formula.getFormula()
														? `=${item.legend.formula.getFormula()}`
														: ''
												}
												InputLabelProps={{ shrink: true }}
												InputProps={{
													inputComponent: MyInputComponent,
													inputProps: {
														component: CellRangeComponent,
														sheetView,
														value: {},
														range: item.legend.formula.getFormula()
															? `=${item.legend.formula.getFormula()}`
															: ''
													}
												}}
											/>,
											<TextField
												variant="outlined"
												size="small"
												fullWidth
												label={
													<FormattedMessage
														id="StreamChartProperties.ThresholdStyle"
														defaultMessage="Treshold Style"
													/>
												}
												select
												margin="normal"
												value={item.chart.varyByThreshold}
												onChange={this.handleVaryByThresholdChange}
											>
												<MenuItem value="none" key={0}>
													<FormattedMessage
														id="StreamChartProperties.NoChange"
														defaultMessage="None"
													/>
												</MenuItem>
												<MenuItem value="colorchange" key={1}>
													<FormattedMessage
														id="StreamChartProperties.ColorChange"
														defaultMessage="Color Change"
													/>
												</MenuItem>
												<MenuItem value="gradient" key={2}>
													<FormattedMessage
														id="StreamChartProperties.Gradient"
														defaultMessage="Gradient"
													/>
												</MenuItem>
											</TextField>
									  ]
									: null}
							</FormGroup>
						</FormControl>
					</FormGroup>
				) : null}
				{selection && selection.element === 'legend' ? (
				<FormGroup>
					<FormControl>
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
								label={<FormattedMessage id="StreamChartProperties.bottom" defaultMessage="Bottom" />}
							/>
						</RadioGroup>
					</FormControl>
					<FormControlLabel
						style={{
							marginTop: '10px'
						}}
						fullWidth
						control={
							<Checkbox
								checked={data.visible}
								onChange={(event, state) =>
									this.handleVisibleChange(event, state, item.legend, 'legend')
								}
							/>
						}
						label={
							<FormattedMessage id="StreamChartProperties.Visible" defaultMessage="Visible" />
						}
					/>
					</FormGroup> ) : null}
				{selection && selection.element === 'title' ? (
					<FormControl>
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
								label={<FormattedMessage id="StreamChartProperties.center" defaultMessage="Center" />}
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
					<FormGroup>
						<FormGroup>
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
									width: '100%'
								}}
							>
								<FormControl fullWidth>
									<TextField
										variant="outlined"
										size="small"
										margin="normal"
										fullWidth
										label={
											<FormattedMessage
												id="StreamChartProperties.ChartDataRange"
												defaultMessage="Data Range"
											/>
										}
										onBlur={(event) => this.handleChartFormulaBlur(event)}
										onKeyPress={(event) => {
											if (event.key === 'Enter') {
												this.handleChartFormulaBlur(event);
											}
										}}
										value={item.chart.formula.toLocaleString(JSG.getParserLocaleSettings(), {
											item: sheetItem,
											useName: true
										})}
										InputLabelProps={{ shrink: true }}
										InputProps={{
											inputComponent: MyInputComponent,
											inputProps: {
												component: CellRangeComponent,
												sheetView,
												value: {},
												range: item.chart.formula.toLocaleString(
													JSG.getParserLocaleSettings(),
													{ item: sheetItem, useName: true }
												)
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
									/* eslint-disable-next-line react/no-array-index-key */
									key={`s${index}`}
									style={{
										borderBottom: '1px solid #CCCCCC',
										width: '100%'
									}}
								>
									<FormControl fullWidth>
										<TextField
											style={{
												height: '30px'
											}}
											variant="outlined"
											fullWidth
											size="small"
											margin="normal"
											label={this.getLabel(series)}
											onBlur={(event) => this.handleSeriesFormulaBlur(event, series)}
											onKeyPress={(event) => {
												if (event.key === 'Enter') {
													this.handleSeriesFormulaBlur(event, series);
												}
											}}
											value={series.formula.toLocaleString(JSG.getParserLocaleSettings(), {
												item: sheetItem,
												useName: true
											})}
											InputLabelProps={{ shrink: true }}
											InputProps={{
												inputComponent: MyInputComponent,
												inputProps: {
													component: CellRangeComponent,
													onlyReference: false,
													sheetView,
													value: {},
													range: series.formula.toLocaleString(
														JSG.getParserLocaleSettings(),
														{ item: sheetItem, useName: true }
													)
												}
											}}
										/>
									</FormControl>
									<FormGroup
										style={{
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
													<path d="M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z" />
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
													<path d="M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z" />
												</SvgIcon>
											</IconButton>
										) : null}
									</FormGroup>
								</FormGroup>
							))
						)}
						{item.getVisibleSeries() < item.series.length ? (
							<FormControl>
								<Button style={{}} onClick={this.handleShowSeries} color="primary">
									<FormattedMessage
										id="StreamChartProperties.ShowAllSeries"
										defaultMessage="Show all Series"
									/>
								</Button>
							</FormControl>
						) : null}
					</FormGroup>
				) : null}
				{selection && (selection.element === 'xAxis' || selection.element === 'yAxis') ? (
					<FormGroup>
						<ValueRangesDialog
							sheetView={sheetView}
							open={this.state.showValueRanges}
							ranges={data.valueRanges}
							stateHandler={this.handleEditValueRanges}
						/>
						<FormControl>
							<TextField
								variant="outlined"
								size="small"
								label={
									<FormattedMessage
										id="StreamChartProperties.Axes"
										defaultMessage="Axes"
									/>
								}
								select
								margin="normal"
								value={selection.element === 'xAxis' ? selection.index : item.xAxes.length + selection.index}
								onChange={this.handleAxesIndexChange}
							>
								{item.xAxes.map((axis, index) => (
									<MenuItem value={index} key={axis.name}>
										{axis.name}
									</MenuItem>
								))}
								{item.yAxes.map((axis, index) => (
									<MenuItem value={item.xAxes.length + index} key={axis.name}>
										{axis.name}
									</MenuItem>
								))}
							</TextField>
							<TextField
								variant="outlined"
								size="small"
								margin="normal"
								label={
									<FormattedMessage id="StreamChartProperties.axisType" defaultMessage="Axis Type" />
								}
								select
								fullWidth
								value={data.type}
								onChange={this.handleAxisTypeChange}
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
								{gauge === false
									? [
											<MenuItem value="time" key={2}>
												<FormattedMessage
													id="StreamChartProperties.axisTypeTime"
													defaultMessage="Time"
												/>
											</MenuItem>,
											<MenuItem value="logarithmic" key={3}>
												<FormattedMessage
													id="StreamChartProperties.axisTypeLogarithmic"
													defaultMessage="Logarithmic"
												/>
											</MenuItem>
									  ]
									: null}
							</TextField>
						</FormControl>
						<TextField
							variant="outlined"
							size="small"
							margin="normal"
							label={<FormattedMessage id="StreamChartProperties.AxisMinimum" defaultMessage="Minimum" />}
							onBlur={(event) => this.handleAxisMinimumFormulaBlur(event)}
							onKeyPress={(event) => {
								if (event.key === 'Enter') {
									this.handleAxisMinimumFormulaBlur(event);
								}
							}}
							value={this.getFormulaParameter(data.formula, 0)}
							InputLabelProps={{ shrink: true }}
							InputProps={{
								inputComponent: MyInputComponent,
								inputProps: {
									component: CellRangeComponent,
									sheetView,
									value: {},
									range: this.getFormulaParameter(data.formula, 0)
								}
							}}
						/>
						<TextField
							variant="outlined"
							size="small"
							margin="normal"
							label={<FormattedMessage id="StreamChartProperties.AxisMaximum" defaultMessage="Maximum" />}
							onBlur={(event) => this.handleAxisMaximumFormulaBlur(event)}
							onKeyPress={(event) => {
								if (event.key === 'Enter') {
									this.handleAxisMaximumFormulaBlur(event);
								}
							}}
							value={this.getFormulaParameter(data.formula, 1)}
							InputLabelProps={{ shrink: true }}
							InputProps={{
								inputComponent: MyInputComponent,
								inputProps: {
									component: CellRangeComponent,
									sheetView,
									value: {},
									range: this.getFormulaParameter(data.formula, 1)
								}
							}}
						/>
						<TextField
							variant="outlined"
							size="small"
							margin="normal"
							label={<FormattedMessage id="StreamChartProperties.AxisStep" defaultMessage="Step" />}
							onBlur={(event) => this.handleAxisStepFormulaBlur(event)}
							onKeyPress={(event) => {
								if (event.key === 'Enter') {
									this.handleAxisStepFormulaBlur(event);
								}
							}}
							value={this.getFormulaParameter(data.formula, 2)}
							InputLabelProps={{ shrink: true }}
							InputProps={{
								inputComponent: MyInputComponent,
								inputProps: {
									component: CellRangeComponent,
									sheetView,
									value: {},
									range: this.getFormulaParameter(data.formula, 2)
								}
							}}
						/>
                        {data.type === 'time' ? (
						<TextField
							variant="outlined"
							size="small"
							margin="normal"
							label={
								<FormattedMessage id="StreamChartProperties.AxisTimeStep" defaultMessage="Time Step" />
							}
							onBlur={(event) => this.handleAxisTimeStepFormulaBlur(event)}
							onKeyPress={(event) => {
								if (event.key === 'Enter') {
									this.handleAxisTimeStepFormulaBlur(event);
								}
							}}
							value={this.getFormulaParameter(data.formula, 3)}
							InputLabelProps={{
								shrink: true
							}}
							InputProps={{
								inputComponent: MyInputComponent,
								inputProps: {
									component: CellRangeComponent,
									inputEditorType: 'string',
									inputEditorOptions: [
										{value: 'year', label: 'year'},
										{value: 'quarter', label: 'quarter'},
										{value: 'month', label: 'month'},
										{value: 'week', label: 'week'},
										{value: 'day', label: 'day'},
										{value: 'hour', label: 'hour'},
										{value: 'minute', label: 'minute'},
										{value: 'second', label: 'second'},
										{value: 'millisecond', label: 'millisecond'},
									],
									sheetView,
									value: {},
									range: this.getFormulaParameter(data.formula, 3)
								}
							}}
						/>) : null}
                        <TextField
                            variant="outlined"
                            size="small"
                            label={
                                <FormattedMessage
                                    id="StreamChartProperties.AxisPosition"
                                    defaultMessage="Position"
                                />
                            }
                            select
                            margin="normal"
                            fullWidth
                            id="axis-position"
                            value={data.align}
                            onChange={this.handleAxisAlignChange}
                        >
                            {this.getAxisAlignOptions(selection)}
                        </TextField>
                        <TextField
                            variant="outlined"
                            fullWidth
                            size="small"
                            id="number"
                            label={
                                <FormattedMessage
                                    id="StreamChartProperties.AxisLabelRotation"
                                    defaultMessage="Rotate Labels"
                                />
                            }
                            inputProps={{
                                min: -90,
                                max: 90,
                                step: 5
                            }}
                            InputProps={{
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
                        <TextField
                            variant="outlined"
                            fullWidth
                            size="small"
                            id="number"
							value={data.labelDistance}
                            label={
                                <FormattedMessage
                                    id="StreamChartProperties.AxisLabelDistance"
                                    defaultMessage="Distance from Label to Axis"
                                />
                            }
                            inputProps={{
                                min: 0,
                                max: 10000,
                                step: 50
                            }}
                            onChange={(event) => this.handleAxisLabelDistanceChange(event)}
                            type="number"
                            margin="normal"
                        />
						<FormControl>
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
									label={<FormattedMessage id="StreamChartProperties.Axis" defaultMessage="Axis" />}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.gridVisible}
											onChange={(event, state) => this.handleGridlineVisibleChange(event, state)}
										/>
									}
									label={
										<FormattedMessage id="StreamChartProperties.grid" defaultMessage="Gridline" />
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.title.visible}
											onChange={(event, state) => this.handleAxisTitleVisibleChange(event, state)}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.AxisTitle"
											defaultMessage="Axis Title"
										/>
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.valueRangesVisible}
											onChange={(event, state) =>
												this.handleValueRangesVisibleChange(event, state)
											}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.ValueRanges"
											defaultMessage="Value Ranges"
										/>
									}
								/>
								<FormControl>
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
										marginTop: '12px',
										marginBottom: '7px'
									}}
								>
									<FormattedMessage id="StreamChartProperties.Settings" defaultMessage="Settings" />
								</FormLabel>
								<FormControlLabel
									control={
										<Checkbox
											checked={data.invert}
											onChange={(event, state) => this.handleAxisInvertChange(event, state)}
										/>
									}
									label={
										<FormattedMessage id="StreamChartProperties.Invert" defaultMessage="Invert" />
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
								{!map && !circular && data.align === 'bottom'
									? [
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
											/>,
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
											/>,
											<TextField
												variant="outlined"
												fullWidth
												size="small"
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
									  ]
									: null}
							</FormGroup>
						</FormControl>
						<FormControl>
							<Button style={{}} onClick={this.handleAddAxis} color="primary">
								<FormattedMessage id="StreamChartProperties.AddAxis" defaultMessage="Add Axis" />
							</Button>
						</FormControl>
					</FormGroup>
				) : null}
				{selection && (selection.element === 'serieslabel' || selection.element === 'series') ? (
					<TextField
						variant="outlined"
						size="small"
						label={
							<FormattedMessage
								id="StreamChartProperties.Series"
								defaultMessage="Series"
							/>
						}
						select
						fullWidth
						margin="normal"
						value={item.series.indexOf(data)}
						onChange={this.handleSeriesIndexChange}
					>
						{item.series.map((serie, index) => {
							const label = this.getLabel(serie);

							return (
								<MenuItem value={index} key={label}>
									{label}
								</MenuItem>
							)
						})}
					</TextField>
				) : null}
				{selection && (selection.element === 'series' || selection.element === 'point') ? (
					<FormGroup>
						{selection.element === 'series' &&
						(data.type === 'bar' ||
							data.type === 'profile' ||
							data.type === 'line' ||
							data.type === 'column' ||
							data.type === 'area') ? (
							<FormControl
								style={{
									display: 'inline-flex'
								}}
							>
								{data.type === 'bar' || data.type === 'profile' ? (
									<TextField
										fullWidth
										variant="outlined"
										size="small"
										margin="normal"
										label={
											<FormattedMessage
												id="StreamChart.Type"
												defaultMessage="Series Display Type"
											/>
										}
										select
										value={data.type}
										onChange={this.handleSeriesTypeChange}
									>
										<MenuItem value="profile" key={1}>
											<FormattedMessage id="StreamChart.Profile" defaultMessage="Profile" />
										</MenuItem>
										<MenuItem value="bar" key={2}>
											<FormattedMessage id="StreamChart.Bar" defaultMessage="Bar" />
										</MenuItem>
									</TextField>
								) : (
									<TextField
										variant="outlined"
										size="small"
										label={
											<FormattedMessage
												id="StreamChart.Type"
												defaultMessage="Series Display Type"
											/>
										}
										select
										margin="normal"
										fullWidth
										value={data.type}
										onChange={this.handleSeriesTypeChange}
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
									</TextField>
								)}
							</FormControl>
						) : null}
						{gauge && item.chart.gaugePointer
							? [
									<TextField
										variant="outlined"
										size="small"
										fullWidth
										label={
											<FormattedMessage
												id="StreamChartProperties.GaugePointerType"
												defaultMessage="Gauge Pointer Type"
											/>
										}
										select
										margin="normal"
										value={data.pointerType}
										onChange={this.handleSeriesPointerTypeChange}
									>
										<MenuItem value="none" key={0}>
											<FormattedMessage id="StreamChartProperties.None" defaultMessage="None" />
										</MenuItem>
										<MenuItem value="line" key={1}>
											<FormattedMessage id="StreamChartProperties.Line" defaultMessage="Line" />
										</MenuItem>
										<MenuItem value="narrowingline" key={2}>
											<FormattedMessage
												id="StreamChartProperties.NarrowingLine"
												defaultMessage="Narrowing Line"
											/>
										</MenuItem>
										<MenuItem value="arrow" key={3}>
											<FormattedMessage id="StreamChartProperties.Arrow" defaultMessage="Arrow" />
										</MenuItem>
									</TextField>,
									<TextField
										variant="outlined"
										size="small"
										fullWidth
										label={
											<FormattedMessage
												id="StreamChartProperties.GaugePointerLength"
												defaultMessage="Gauge Pointer length"
											/>
										}
										select
										margin="normal"
										value={data.pointerLength}
										onChange={this.handleSeriesPointerLengthChange}
									>
										<MenuItem value="inner" key={0}>
											<FormattedMessage
												id="StreamChartProperties.InnerRadius"
												defaultMessage="Inner"
											/>
										</MenuItem>
										<MenuItem value="center" key={1}>
											<FormattedMessage
												id="StreamChartProperties.CenterRadius"
												defaultMessage="Center"
											/>
										</MenuItem>
										<MenuItem value="outer" key={2}>
											<FormattedMessage
												id="StreamChartProperties.OuterRadius"
												defaultMessage="Outer"
											/>
										</MenuItem>
									</TextField>
							  ]
							: null}
						{item.isLineType(data) || map ? (
							<div style={{ display: 'grid' }}>
								<FormLabel style={{ marginTop: '8px' }}>
									<FormattedMessage id="StreamChartProperties.Marker" defaultMessage="Marker" />
								</FormLabel>
								<div
									style={{
										display: 'inline-flex'
									}}
								>
									<FormControl
										style={{
											width: '50%',
											marginRight: '10px'
										}}
									>
										<TextField
											variant="outlined"
											size="small"
											label={
												<FormattedMessage
													id="StreamChartProperties.Style"
													defaultMessage="Style"
												/>
											}
											select
											margin="normal"
											id="series-marker"
											value={this.getMarkerStyle(data)}
											onChange={this.handleSeriesMarkerStyleChange}
											input={<Input name="series-marker" id="series-marker" />}
										>
											<MenuItem value="none" key={1}>
												<FormattedMessage
													id="StreamChartProperties.none"
													defaultMessage="None"
												/>
											</MenuItem>
											<MenuItem value="circle" key={2}>
												<FormattedMessage
													id="StreamChartProperties.circle"
													defaultMessage="Circle"
												/>
											</MenuItem>
											<MenuItem value="cross" key={3}>
												<FormattedMessage
													id="StreamChartProperties.cross"
													defaultMessage="Cross"
												/>
											</MenuItem>
											<MenuItem value="crossRot" key={4}>
												<FormattedMessage
													id="StreamChartProperties.rotatedCross"
													defaultMessage="Rotated Cross"
												/>
											</MenuItem>
											<MenuItem value="dash" key={5}>
												<FormattedMessage
													id="StreamChartProperties.dash"
													defaultMessage="Dash"
												/>
											</MenuItem>
											<MenuItem value="dashright" key={6}>
												<FormattedMessage
													id="StreamChartProperties.dashright"
													defaultMessage="Dash Right"
												/>
											</MenuItem>
											<MenuItem value="line" key={7}>
												<FormattedMessage
													id="StreamChartProperties.line"
													defaultMessage="Line"
												/>
											</MenuItem>
											<MenuItem value="rect" key={8}>
												<FormattedMessage
													id="StreamChartProperties.rectangle"
													defaultMessage="Rectangle"
												/>
											</MenuItem>
											<MenuItem value="rectRot" key={9}>
												<FormattedMessage
													id="StreamChartProperties.diamond"
													defaultMessage="Diamond"
												/>
											</MenuItem>
											<MenuItem value="star" key={10}>
												<FormattedMessage
													id="StreamChartProperties.star"
													defaultMessage="Star"
												/>
											</MenuItem>
											<MenuItem value="triangle" key={11}>
												<FormattedMessage
													id="StreamChartProperties.triangle"
													defaultMessage="Triangle"
												/>
											</MenuItem>
											<MenuItem value="vertical" key={12}>
												<FormattedMessage
													id="StreamChartProperties.vertical"
													defaultMessage="Vertical Line"
												/>
											</MenuItem>
										</TextField>
									</FormControl>
									<FormControl
										style={{
											width: '50%'
										}}
									>
										<TextField
											variant="outlined"
											size="small"
											label={
												<FormattedMessage
													id="StreamChartProperties.MarkerSize"
													defaultMessage="Size"
												/>
											}
											margin="normal"
											select
											value={this.getMarkerSize(data)}
											onChange={this.handleSeriesMarkerSizeChange}
											input={<Input name="template" id="template" />}
										>
											{Object.values(markerSizes).map((key) => (
												<MenuItem value={key} key={key}>
													{key}
												</MenuItem>
											))}
										</TextField>
									</FormControl>
								</div>
								{!map ? (
									<div
										style={{
											display: 'inline-flex',
											flexDirection: 'row'
										}}
									>
										<FormControl
											size="small"
											variant="outlined"
											margin="normal"
											style={{
												width: '50%',
												marginRight: '10px'
											}}
										>
											<ColorComponent
												label={
													<FormattedMessage
														id="StreamChartProperties.FillColor"
														defaultMessage="Fill Color"
													/>
												}
												labelFontSize="1rem"
												transparent
												color={this.getMarkerFillColor(data)}
												onChange={(color) => this.handleSeriesMarkerFillColorChange(color)}
											/>
										</FormControl>
										<FormControl
											size="small"
											variant="outlined"
											margin="normal"
											style={{
												display: 'inline-flex',
												width: '50%'
											}}
										>
											<ColorComponent
												labelFontSize="1rem"
												label={
													<FormattedMessage
														id="StreamChartProperties.LineColor"
														defaultMessage="Line Color"
													/>
												}
												transparent
												color={this.getMarkerLineColor(data)}
												onChange={(color) => this.handleSeriesMarkerLineColorChange(color)}
											/>
										</FormControl>
									</div>
								) : null}
							</div>
						) : null}
						{selection.element === 'series' && (item.xAxes.length > 1 || item.yAxes.length > 1) ? (
							<FormLabel
								component="legend"
								style={{
									marginTop: '12px'
								}}
							>
								<FormattedMessage
									id="StreamChartProperties.AxisAssignment"
									defaultMessage="Axis Assignment"
								/>
							</FormLabel>
						) : null}
						{selection.element === 'series' ? (
							<div
								style={{
									display: 'inline-flex',
									flexDirection: 'row'
								}}
							>
								{item.xAxes.length > 1 ? (
									<FormControl
										style={{
											width: '50%',
											marginRight: '10px'
										}}
									>
										<TextField
											variant="outlined"
											size="small"
											label={
												<FormattedMessage
													id="StreamChartProperties.XAxis"
													defaultMessage="XAxis"
												/>
											}
											select
											margin="normal"
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
										</TextField>
									</FormControl>
								) : null}
								{item.yAxes.length > 1 ? (
									<FormControl
										style={{
											width: '50%'
										}}
									>
										<TextField
											variant="outlined"
											size="small"
											label={
												<FormattedMessage
													id="StreamChartProperties.YAxis"
													defaultMessage="YAxis"
												/>
											}
											select
											margin="normal"
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
										</TextField>
									</FormControl>
								) : null}
							</div>
						) : null}
						<FormGroup>
							<FormLabel
								component="legend"
								style={{
									marginTop: '12px',
									marginBottom: '7px'
								}}
							>
								<FormattedMessage id="StreamChartProperties.Settings" defaultMessage="Settings" />
							</FormLabel>
							{selection.element === 'series' && item.isLineType(data) ? (
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
							) : null}
							{selection.element === 'series' && data.type === 'boxplot' ? (
								<FormControlLabel
									control={
										<Checkbox
											checked={data.innerPoints}
											onChange={(event, state) =>
												this.handleSeriesInnerPointsChange(event, state)
											}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.InnerPoints"
											defaultMessage="Inner Points"
										/>
									}
								/>
							) : null}
							{selection.element === 'series' && data.type === 'map' ? (
								<React.Fragment>
									<TextField
										variant="outlined"
										size="small"
										fullWidth
										label={
											<FormattedMessage
												id="StreamChartProperties.MapName"
												defaultMessage="Map Name"
											/>
										}
										select
										margin="normal"
										value={data.map.name}
										onChange={this.handleSeriesMapName}
									>
										{JSG.mapInfo.maps.map((info) => (
											<MenuItem value={info.file} key={info.id}>
												{info.name}
											</MenuItem>
										))}
										<MenuItem value="sheet" key={4}>
											<FormattedMessage
												id="StreamChartProperties.MapCustom"
												defaultMessage="From Sheet"
											/>
										</MenuItem>
									</TextField>
									<TextField
										variant="outlined"
										fullWidth
										size="small"
										select
										label={
											<FormattedMessage
												id="StreamChartProperties.CategoryName"
												defaultMessage="Property for Labels"
											/>
										}
										defaultValue={data.map.label}
										onChange={(event) => this.handleSeriesMapLabelChange(event)}
										margin="normal"
									>
										{data.map && data.map.mapData && data.map.mapData.features.length ?
											Object.keys(data.map.mapData.features[0].properties).map((prop) => (
											<MenuItem value={prop} key={prop}>
												{prop}
											</MenuItem>
										)) : (
												<MenuItem value="name" key="name">
													name
												</MenuItem>
											)}
									</TextField>
									<TextField
										variant="outlined"
										size="small"
										fullWidth
										label={
											<FormattedMessage
												id="StreamChartProperties.MapDisplayValues"
												defaultMessage="Display Values"
											/>
										}
										select
										SelectProps={{
											multiple: true,
											renderValue: (selected) => {
												let result = '';
												selected.forEach((sel, index) => {
													result += intl.formatMessage(
														{ id: `StreamChartProperties.MapDisplay${sel}` },
														{}
													);
													if (index < selected.length - 1) {
														result += ', ';
													}
												});
												return result;
											}
										}}
										margin="normal"
										value={data.map.displayType}
										onChange={this.handleSeriesMapDisplayType}
									>
										<MenuItem value="color" key={0}>
											<Checkbox checked={data.map.displayType.indexOf('color') !== -1} />
											<FormattedMessage
												id="StreamChartProperties.MapDisplaycolor"
												defaultMessage="Color Intensity"
											/>
										</MenuItem>
										<MenuItem value="cvalue" key={4}>
											<Checkbox checked={data.map.displayType.indexOf('cvalue') !== -1} />
											<FormattedMessage
												id="StreamChartProperties.MapDisplaycvalue"
												defaultMessage="Color Value"
											/>
										</MenuItem>
										<MenuItem value="line" key={1}>
											<Checkbox checked={data.map.displayType.indexOf('line') !== -1} />
											<FormattedMessage
												id="StreamChartProperties.MapDisplayline"
												defaultMessage="Line Width"
											/>
										</MenuItem>
										<MenuItem value="radius" key={2}>
											<Checkbox checked={data.map.displayType.indexOf('radius') !== -1} />
											<FormattedMessage
												id="StreamChartProperties.MapDisplayradius"
												defaultMessage="Point Radius"
											/>
										</MenuItem>
										<MenuItem value="chart" key={3}>
											<Checkbox checked={data.map.displayType.indexOf('chart') !== -1} />
											<FormattedMessage
												id="StreamChartProperties.MapDisplaychart"
												defaultMessage="Chart"
											/>
										</MenuItem>
									</TextField>
									{data.map.displayType.indexOf('chart') !== -1 ? (
									<TextField
										variant="outlined"
										size="small"
										fullWidth
										label={
											<FormattedMessage
												id="StreamChartProperties.MapChartType"
												defaultMessage="Chart Type"
											/>
										}
										select
										margin="normal"
										value={data.map.chartType}
										onChange={this.handleSeriesMapChartType}
									>
										<MenuItem value="pie" key={0}>
											<FormattedMessage id="StreamChart.Pie" defaultMessage="Pie" />
										</MenuItem>
										<MenuItem value="doughnut" key={1}>
											<FormattedMessage id="StreamChart.Doughnut" defaultMessage="Doughnut" />
										</MenuItem>
										<MenuItem value="column" key={2}>
											<FormattedMessage id="StreamChart.Column" defaultMessage="Column" />
										</MenuItem>
										<MenuItem value="line" key={3}>
											<FormattedMessage id="StreamChart.Line" defaultMessage="Line" />
										</MenuItem>
										<MenuItem value="area" key={4}>
											<FormattedMessage id="StreamChart.Area" defaultMessage="Area" />
										</MenuItem>
									</TextField>) : null}
									<FormControl>
										<Button
											disabled={data.map.name === 'sheet'}
											style={{}} onClick={this.handleSeriesCopyMapLabels} color="primary">
											<FormattedMessage
												id="StreamChartProperties.CopyMapLabels"
												defaultMessage="Copy Map Labels"
											/>
										</Button>
									</FormControl>
								</React.Fragment>
							) : null}
							{selection.element === 'series' && data.type === 'boxplot' ? (
								<FormControlLabel
									control={
										<Checkbox
											checked={data.outerPoints}
											onChange={(event, state) =>
												this.handleSeriesOuterPointsChange(event, state)
											}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.OuterPoints"
											defaultMessage="Outer Points"
										/>
									}
								/>
							) : null}
							{selection.element === 'series' && data.type === 'boxplot' ? (
								<FormControlLabel
									control={
										<Checkbox
											checked={data.average}
											onChange={(event, state) => this.handleSeriesAverageChange(event, state)}
										/>
									}
									label={
										<FormattedMessage id="StreamChartProperties.Average" defaultMessage="Average" />
									}
								/>
							) : null}
							{selection.element === 'series' && data.type === 'waterfall' ? (
								<FormControlLabel
									control={
										<Checkbox
											checked={data.autoSum}
											onChange={(event, state) => this.handleSeriesAutoSumChange(event, state)}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.AutoSum"
											defaultMessage="Display Sum and Difference automatically"
										/>
									}
								/>
							) : null}
							{selection.element === 'point' && data.type === 'waterfall' ? (
								<FormControlLabel
									control={
										<Checkbox
											checked={this.getPointSum(data)}
											onChange={(event, state) => this.handlePointSumChange(event, state)}
										/>
									}
									label={
										<FormattedMessage
											id="StreamChartProperties.PointSum"
											defaultMessage="Display Sum"
										/>
									}
								/>
							) : null}
							{selection.element === 'series' ? (
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
							) : null}
							<FormControlLabel
								control={
									<Checkbox
										checked={this.getDataLabelVisible(data)}
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
							<TextField
								variant="outlined"
								size="small"
								fullWidth
								label={
									<FormattedMessage
										id="StreamChartProperties.TooltipContent"
										defaultMessage="Tooltip Content"
									/>
								}
								select
								margin="normal"
								value={data.tooltip}
								onChange={this.handleSeriesTooltipContentChange}
							>
								<MenuItem value="hide" key={0}>
									<FormattedMessage id="StreamChartProperties.Hide" defaultMessage="Hide" />
								</MenuItem>
								<MenuItem value="value" key={1}>
									<FormattedMessage id="StreamChartProperties.Value" defaultMessage="Value" />
								</MenuItem>
								<MenuItem value="text" key={2}>
									<FormattedMessage id="StreamChartProperties.Text" defaultMessage="Text" />
								</MenuItem>
							</TextField>
						</FormGroup>
					</FormGroup>
				) : null}
				{selection && selection.element === 'serieslabel' ? (
					<FormGroup>
						<FormGroup>
							<FormLabel
								component="legend"
								style={{
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
									<FormattedMessage id="StreamChartProperties.YValues" defaultMessage="Y Values" />
								}
							/>
							{data.type === 'bubble' ? (
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
							) : null}
							{data.type === 'state' ? (
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
							) : null}
							{data.type === 'boxplot' ? (
								<FormControlLabel
									control={
										<Checkbox
											checked={data.dataLabel.content.id}
											onChange={(event, state) =>
												this.handleSeriesDataLabelsContentChange(event, 'id', state)
											}
										/>
									}
									label={<FormattedMessage id="StreamChartProperties.ID" defaultMessage="ID" />}
								/>
							) : null}
							<FormControlLabel
								control={
									<Checkbox
										checked={data.dataLabel.content.series}
										onChange={(event, state) =>
											this.handleSeriesDataLabelsContentChange(event, 'series', state)
										}
									/>
								}
								label={<FormattedMessage id="StreamChartProperties.Series" defaultMessage="Series" />}
							/>
						</FormGroup>
						<FormControl>
							<TextField
								variant="outlined"
								size="small"
								label={
									<FormattedMessage id="StreamChartProperties.Position" defaultMessage="Position" />
								}
								fullWidth
								margin="normal"
								select
								id="position"
								value={data.dataLabel.position}
								onChange={this.handleSeriesDataLabelsPositionChange}
								input={<Input name="position" id="position" />}
							>
								{this.getLabelPositionOptions(data)}
							</TextField>
						</FormControl>
						<FormControl>
							<TextField
								variant="outlined"
								size="small"
								fullWidth
								margin="normal"
								label={
									<FormattedMessage id="StreamChartProperties.Separator" defaultMessage="Separator" />
								}
								select
								id="hide-empty"
								value={data.dataLabel.separator}
								onChange={this.handleSeriesDataLabelsSeparatorChange}
								input={<Input name="hide-empty" id="hide-empty" />}
							>
								<MenuItem value="&lf" key={1}>
									<FormattedMessage id="StreamChartProperties.LineFeed" defaultMessage="Line Feed" />
								</MenuItem>
								<MenuItem value=" " key={2}>
									<FormattedMessage id="StreamChartProperties.Space" defaultMessage="Space" />
								</MenuItem>
								<MenuItem value="," key={4}>
									<FormattedMessage id="StreamChartProperties.Comma" defaultMessage="Comma" />
								</MenuItem>
								<MenuItem value=";" key={3}>
									<FormattedMessage id="StreamChartProperties.Semicolon" defaultMessage="Semicolon" />
								</MenuItem>
							</TextField>
						</FormControl>
						<FormControl>
							<TextField
								variant="outlined"
								size="small"
								fullWidth
								margin="normal"
								id="number"
								label={
									<FormattedMessage
										id="StreamChartProperties.LabelRotation"
										defaultMessage="Rotate Labels"
									/>
								}
								inputProps={{
									min: -90,
									max: 90,
									step: 5
								}}
								InputProps={{
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
							/>
						</FormControl>
						<FormControl>
							<FormControlLabel
								control={
									<Checkbox
										checked={data.dataLabel.format.linkNumberFormat}
										onChange={(event, state) => this.handleSeriesDataLabelsLinkChange(event, state)}
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
					</FormGroup>
				) : null}
				{selection && (selection.element === 'xAxisGrid' || selection.element === 'yAxisGrid') ? (
					<FormGroup>
						<TextField
							variant="outlined"
							size="small"
							label={
								<FormattedMessage
									id="StreamChartProperties.Axes"
									defaultMessage="Axes"
								/>
							}
							select
							margin="normal"
							value={selection.element === 'xAxisGrid' ? selection.index : item.xAxes.length + selection.index}
							onChange={this.handleAxesGridIndexChange}
						>
							{item.xAxes.map((axis, index) => (
								<MenuItem value={index} key={axis.name}>
									{axis.name}
								</MenuItem>
							))}
							{item.yAxes.map((axis, index) => (
								<MenuItem value={item.xAxes.length + index} key={axis.name}>
									{axis.name}
								</MenuItem>
							))}
						</TextField>
						<FormControlLabel
							control={
								<Checkbox
									checked={data.gridVisible}
									onChange={(event, state) => this.handleGridlineVisibleChange(event, state)}
								/>
							}
							label={<FormattedMessage id="StreamChartProperties.Visible" defaultMessage="Visible" />}
						/>
					</FormGroup>
				) : null}
				{selection && (selection.element === 'xAxisTitle' || selection.element === 'yAxisTitle') ? (
					<FormGroup>
						<TextField
							variant="outlined"
							size="small"
							label={
								<FormattedMessage
									id="StreamChartProperties.Axes"
									defaultMessage="Axes"
								/>
							}
							select
							margin="normal"
							value={selection.element === 'xAxisTitle' ? selection.index : item.xAxes.length + selection.index}
							onChange={this.handleAxesTitleIndexChange}
						>
							{item.xAxes.map((axis, index) => (
								<MenuItem value={index} key={axis.name}>
									{axis.name}
								</MenuItem>
							))}
							{item.yAxes.map((axis, index) => (
								<MenuItem value={item.xAxes.length + index} key={axis.name}>
									{axis.name}
								</MenuItem>
							))}
						</TextField>
						<FormControlLabel
							control={
								<Checkbox
									checked={data.visible}
									onChange={(event, state) => this.handleAxisTitleTitleVisibleChange(event, state)}
								/>
							}
							label={<FormattedMessage id="StreamChartProperties.Visible" defaultMessage="Visible" />}
						/>
					</FormGroup>
				) : null}
				<FormLabel
					component="legend"
					style={{
						padding: '2px',
						border: 'grey 1px solid',
						fontSize: '9pt',
						marginTop: '10px',
						lineHeight: '1.5'
					}}
				>
					<FormattedMessage id="StreamChartProperties.FormatHint" defaultMessage="Format Hint" />
				</FormLabel>
			</div>
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

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(StreamChartProperties));
