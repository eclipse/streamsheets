/* eslint-disable react/prop-types, react/forbid-prop-types */
/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import { FormattedMessage } from 'react-intl';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/RemoveCircle';
import CloseIcon from '@material-ui/icons/Close';
import JSG from '@cedalo/jsg-ui';
import { Arrays, CompoundCommand } from '@cedalo/jsg-core';
import Slide from '@material-ui/core/Slide';

import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import FontComponent from './FontComponent';
import ColorComponent from '../SheetDialogs/ColorComponent';
import AxisComponent from './AxisComponent';
import CellRangeComponent from './CellRangeComponent';

const colors = {
	backgroundColor: [
		'rgb(54, 162, 235)',
		'rgb(255, 99, 132)',
		'rgb(255, 206, 86)',
		'rgb(75, 192, 192)',
		'rgb(153, 102, 255)',
		'rgb(255, 159, 64)',
		'rgb(98,51,58)',
		'rgb(0,177,91)',
		'rgb(88,207,255)',
		'rgb(255,139,116)',
		'rgb(131,240,255)',
		'rgb(224,108,255)'
	],
	borderColor: [
		'rgb(54, 162, 235)',
		'rgb(255,99,132)',
		'rgb(255, 206, 86)',
		'rgb(75, 192, 192)',
		'rgb(153, 102, 255)',
		'rgb(255, 159, 64)',
		'rgb(98,51,58)',
		'rgb(0,177,91)',
		'rgb(88,207,255)',
		'rgb(255,139,116)',
		'rgb(131,240,255)',
		'rgb(224,108,255)'
	]
};

const styles = {
	expansionSummary: {
		padding: '0px 12px'
	},
	expansionDetails: {
		padding: '0px 12px',
		display: 'block'
	}
};

const LINE_STYLES = [
	{
		value: 0,
		name: 'Ohne',
		image: 'lib/res/images/linestylenone.png',
		id: 0,
	},
	{
		value: 1,
		name: '1',
		image: 'lib/res/images/linestylesolid.png',
		id: 1,
	},
	{
		value: 2,
		name: '2',
		image: 'lib/res/images/linestyledot.png',
		id: 2,
	},
	{
		value: 3,
		name: '3',
		image: 'lib/res/images/linestyledash.png',
		id: 3,
	},
	{
		value: 4,
		name: '4',
		image: 'lib/res/images/linestyledashdot.png',
		id: 4,
	},
];

function TabContainer(props) {
	return <Typography component="div">{props.children}</Typography>;
}
TabContainer.propTypes = {
	children: PropTypes.node.isRequired
};

export class ChartProperties extends Component {
	static propTypes = {
		appState: PropTypes.object.isRequired
	};

	constructor(props) {
		super(props);
		this.escFunction = this.escFunction.bind(this);
	}

	state = {
		value: 0,
		expanded: null,
		chartType: 'column',
		categoryLabels: 'auto',
		categoryLabelData: [],
		seriesLabels: 'auto',
		seriesDirection: 'auto',
		coherent: 'true',
		hideEmpty: 'none',
		fill: 'true',
		smooth: 'true',
		angle: Math.PI * 2,
		step: 'false',
		stacked: 'false',
		dataRange: '',
		categoryDataRange: '',
		title: '',
		titleFont: {
			fontName: 'Verdana',
			fontSize: '12',
			bold: false,
			italic: false,
			color: '#000000'
		},
		legendPosition: 'right',
		legendFont: {
			fontName: 'Verdana',
			fontSize: '9',
			bold: false,
			italic: false,
			color: '#000000'
		},
		series: undefined,
		seriesIndex: 0,
		pointIndex: 'all',
		seriesDataIndex: 0,
		axisId: 'XAxis1',
		xAxisId: 'XAxis1',
		yAxisId: 'YAxis1',
		scales: undefined
	};

	componentDidMount() {
		document.addEventListener('keydown', this.escFunction, false);
	}

	componentWillReceiveProps(nextProps) {
		// You don't have to do this check first, but it can help prevent an unneeded render
		if (nextProps.appState.showChartProperties === true) {
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

	getChartNode() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection === undefined || selection.length !== 1) {
			return undefined;
		}
		const item = selection[0].getModel();
		return item instanceof JSG.ChartNode ? item : undefined;
	}

	getSheet(chart) {
		let ws = chart.getParent();
		while (ws && !(ws instanceof JSG.StreamSheet)) {
			ws = ws.getParent();
		}

		return ws;
	}

	getSeriesFillColor() {
		const series = this.state.series[this.state.seriesIndex];
		if (series) {
			if (this.state.pointIndex === 'all' || !series.pointInfo) {
				if (series.fillColor) {
					return series.fillColor;
				}
			} else {
				const pointInfo = series.pointInfo[Number(this.state.pointIndex)];
				if (pointInfo && pointInfo.fillColor !== undefined) {
					return pointInfo.fillColor;
				}
				if (series.fillColor) {
					return series.fillColor;
				}
			}
		}

		if (this.state.chartType === 'pie' || this.state.chartType === 'doughnut') {
			if (this.state.pointIndex !== 'all') {
				return colors.backgroundColor[Number(this.state.pointIndex) % 11];
			}
		}

		return colors.backgroundColor[this.state.seriesIndex % 11];
	}

	getSeriesLineColor() {
		const series = this.state.series[this.state.seriesIndex];
		if (series) {
			if (this.state.pointIndex === 'all' || !series.pointInfo) {
				if (series.lineColor) {
					return series.lineColor;
				}
			} else {
				const pointInfo = series.pointInfo[Number(this.state.pointIndex)];
				if (pointInfo && pointInfo.lineColor !== undefined) {
					return pointInfo.lineColor;
				}
				if (series.lineColor) {
					return series.lineColor;
				}
			}
		}

		if (this.state.chartType === 'pie' || this.state.chartType === 'doughnut') {
			if (this.state.pointIndex !== 'all') {
				return colors.borderColor[Number(this.state.pointIndex) % 11];
			}
		}

		return colors.borderColor[this.state.seriesIndex % 11];
	}

	getSeriesMarkerLineColor() {
		const series = this.state.series[this.state.seriesIndex];
		if (series) {
			if (this.state.pointIndex === 'all' || !series.pointInfo) {
				if (series.markerLineColor) {
					return series.markerLineColor;
				}
			} else {
				const pointInfo = series.pointInfo[Number(this.state.pointIndex)];
				if (pointInfo && pointInfo.markerLineColor !== undefined) {
					return pointInfo.markerLineColor;
				}
				if (series.markerLineColor) {
					return series.markerLineColor;
				}
			}
		}

		return colors.borderColor[this.state.seriesIndex % 11];
	}

	getSeriesMarkerFillColor() {
		const series = this.state.series[this.state.seriesIndex];
		if (series) {
			if (this.state.pointIndex === 'all' || !series.pointInfo) {
				if (series.markerFillColor) {
					return series.markerFillColor;
				}
			} else {
				const pointInfo = series.pointInfo[Number(this.state.pointIndex)];
				if (pointInfo && pointInfo.markerFillColor !== undefined) {
					return pointInfo.markerFillColor;
				}
				if (series.markerFillColor) {
					return series.markerFillColor;
				}
			}
		}

		return colors.borderColor[this.state.seriesIndex % 11];
	}

	getSeriesLineStyle() {
		const series = this.state.series[this.state.seriesIndex];
		if (series) {
			if (this.state.pointIndex === 'all' || !series.pointInfo) {
				if (series.lineStyle !== undefined) {
					return series.lineStyle;
				}
			} else {
				const pointInfo = series.pointInfo[Number(this.state.pointIndex)];
				if (pointInfo && pointInfo.lineStyle !== undefined) {
					return pointInfo.lineStyle;
				}
				if (series.lineStyle !== undefined) {
					return series.lineStyle;
				}
			}
		}

		return 1;
	}

	getSeriesLineWidth() {
		const series = this.state.series[this.state.seriesIndex];
		if (series) {
			if (this.state.pointIndex === 'all' || !series.pointInfo) {
				if (series.lineWidth !== undefined) {
					return series.lineWidth;
				}
			} else {
				const pointInfo = series.pointInfo[Number(this.state.pointIndex)];
				if (pointInfo && pointInfo.lineWidth !== undefined) {
					return pointInfo.lineWidth;
				}
				if (series.lineWidth !== undefined) {
					return series.lineWidth;
				}
			}
		}

		return 1;
	}

	getSeriesLineMarker() {
		const defaultMarker = this.state.chartType === 'scatter' ? 'circle' : 'none';
		const series = this.state.series[this.state.seriesIndex];
		if (series) {
			if (this.state.pointIndex === 'all' || !series.pointInfo) {
				return series.lineMarker ? series.lineMarker : defaultMarker;
			}
			const pointInfo = series.pointInfo[Number(this.state.pointIndex)];
			if (pointInfo && pointInfo.lineMarker !== undefined) {
				return pointInfo.lineMarker;
			}
			return series.lineMarker ? series.lineMarker : defaultMarker;
		}

		return defaultMarker;
	}

	getSeriesShowDataLabels() {
		const series = this.state.series[this.state.seriesIndex];
		if (series) {
			if (this.state.pointIndex === 'all' || !series.pointInfo) {
				if (series.showDataLabels) {
					return series.showDataLabels;
				}
			} else {
				const pointInfo = series.pointInfo[Number(this.state.pointIndex)];
				if (pointInfo && pointInfo.showDataLabels !== undefined) {
					return pointInfo.showDataLabels;
				}
				if (series.showDataLabels) {
					return series.showDataLabels;
				}
			}
		}

		return false;
	}

	getSeriesShowLine() {
		const series = this.state.series[this.state.seriesIndex];
		if (series && series.showLine !== undefined) {
			return series.showLine;
		}

		return this.state.chartType === 'scatterLine';
	}

	getSeriesXAxisID() {
		const series = this.state.series[this.state.seriesIndex];
		if (series && series.xAxisID) {
			return series.xAxisID;
		}

		return this.state.scales.xAxes[0].id;
	}

	getSeriesYAxisID() {
		const series = this.state.series[this.state.seriesIndex];
		if (series && series.yAxisID) {
			return series.yAxisID;
		}

		return this.state.scales.yAxes[0].id;
	}

	getCurrentAxis() {
		let axis = this.state.scales.xAxes.filter((laxis) => laxis.id === this.state.axisId);
		if (axis.length) {
			return axis[0];
		}
		axis = this.state.scales.yAxes.filter((laxis) => laxis.id === this.state.axisId);

		if (axis.length) {
			return axis[0];
		}
		return undefined;
	}

	getCurrentXAxis() {
		const axis = this.state.scales.xAxes.filter((laxis) => laxis.id === this.state.xAxisId);
		return axis.length ? axis[0] : undefined;
	}

	getCurrentYAxis() {
		const axis = this.state.scales.yAxes.filter((laxis) => laxis.id === this.state.yAxisId);
		return axis.length ? axis[0] : undefined;
	}

	escFunction(event) {
		if (event.keyCode === 27 && event.target && event.target.contentEditable !== 'true') {
			this.props.setAppState({ showChartProperties: false });
		}
	}

	validateRange(text) {
		const sheet = this.getSheet(this.chartNode);
		if (sheet && text && text !== '' && text[0] === '=') {
			const range = JSG.CellRange.parse(text.substring(1).toUpperCase(), sheet, true);
			return range ? text.toUpperCase() : text;
		}
		return text;
	}

	updateState() {
		const item = this.getChartNode();
		if (item === undefined) {
			return;
		}
		this.chartNode = item;
		this.setState({
			chartType: item.getChartType(),
			dataRange: item.getDataRange()
				? `=${item.getDataRange().toString({ item: this.getSheet(this.chartNode), useName: true })}`
				: '',
			coherent: item.data.coherent,
			hideEmpty: item.data.hideEmpty,
			fill: item.data.fill,
			angle: item.data.angle,
			smooth: item.data.smooth,
			stacked: item.data.stacked,
			step: item.data.step,
			seriesDirection: item.data.direction,
			seriesLabels: item.data.hasSeriesLabels,
			categoryLabels: item.data.hasCategoryLabels,
			categoryLabelData: item.data.categoryLabelData,
			categoryDataRange: item.getCategoryDataRangeString(),
			series: item.data.series,
			title: item.title.title,
			titleFont: item.title.font,
			legendPosition: item.legend.position,
			legendFont: item.legend.font,
			scales: item.scales
		});
	}

	sendCommand(key, data) {
		const cmd = new JSG.SetChartDataCommand(this.chartNode, key, data);
		graphManager.synchronizedExecute(cmd);
	}

	isLineChart() {
		return (
			this.state.chartType === 'radar' ||
			this.state.chartType === 'scatter' ||
			this.state.chartType === 'line' ||
			this.state.chartType === 'scatterLine'
		);
	}

	hasXAxis() {
		return !(
			this.state.chartType === 'radar' ||
			this.state.chartType === 'polarArea' ||
			this.state.chartType === 'pie' ||
			this.state.chartType === 'doughnut'
		);
	}

	hasYAxis() {
		return !(this.state.chartType === 'pie' || this.state.chartType === 'doughnut');
	}

	hasMultiYAxis() {
		return !(this.state.chartType === 'radar' || this.state.chartType === 'polarArea');
	}

	hasMultiXAxis() {
		return !(this.state.chartType === 'radar' || this.state.chartType === 'polarArea');
	}

	reassignFont(target, source) {
		target.fontFamily = source.fontName;
		target.fontSize = source.fontSize;
		target.fontColor = source.color;
		if (source.bold && source.italic) {
			target.fontStyle = 'bold italic';
		} else if (source.bold) {
			target.fontStyle = 'bold';
		} else if (source.italic) {
			target.fontStyle = 'italic';
		} else {
			target.fontStyle = 'normal';
		}
	}

	createCommand() {
		const sheetView = this.getSheetView();
		if (sheetView === undefined) {
			return undefined;
		}

		const cmd = new CompoundCommand();
		// const sheet = sheetView.getContainer(this.chartNode, this.chartNode.getParent());
		// cmd.setGraphItem(sheet);
		cmd._chartContent = this.chartNode.copyChartContent();
		cmd._sheetView = sheetView;

		return cmd;
	}

	executeCommand(cmd) {
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.execute(cmd);

		// cmd._sheetView.notify();
		this.updateState();
	}

	executeDataCommand(cmd) {
		cmd.add(new JSG.SetChartDataCommand(this.chartNode, 'data', this.chartNode.data, cmd._chartContent.data));
		this.executeCommand(cmd);
	}

	executeTitleCommand(cmd) {
		cmd.add(new JSG.SetChartDataCommand(this.chartNode, 'title', this.chartNode.title, cmd._chartContent.title));
		this.executeCommand(cmd);
	}

	executeLegendCommand(cmd) {
		cmd.add(new JSG.SetChartDataCommand(this.chartNode, 'legend', this.chartNode.legend, cmd._chartContent.legend));
		this.executeCommand(cmd);
	}

	executeScalesCommand(cmd) {
		cmd.add(new JSG.SetChartDataCommand(this.chartNode, 'scales', this.chartNode.scales, cmd._chartContent.scales));
		this.executeCommand(cmd);
	}

	handleChartTypeChange = (event) => {
		this.setState({
			chartType: event.target.value,
			seriesIndex: 0,
			pointIndex: 'all',
			seriesDataIndex: 0,
			series: this.chartNode.data.series
		});

		const cmd = this.createCommand();

		this.chartNode.setChartType(event.target.value);
		this.chartNode.resetScales();

		cmd._sheetView.updateGraphItem(cmd._sheetView.getItem(), this.chartNode);

		cmd.add(new JSG.SetChartDataCommand(this.chartNode, 'data', this.chartNode.data, cmd._chartContent.data));
		cmd.add(new JSG.SetChartDataCommand(this.chartNode, 'scales', this.chartNode.scales, cmd._chartContent.scales));

		this.executeCommand(cmd);
	};

	handleSmoothChange = (event, state) => {
		const cmd = this.createCommand();
		this.setState({ smooth: state });
		this.chartNode.data.smooth = state;
		this.executeDataCommand(cmd);
	};

	handleStepChange = (event, state) => {
		const cmd = this.createCommand();
		this.setState({ step: state });
		this.chartNode.data.step = state;
		this.executeDataCommand(cmd);
	};

	handleStackedChange = (event, state) => {
		const cmd = this.createCommand();
		this.setState({ stacked: state });
		this.chartNode.data.stacked = state;
		this.executeDataCommand(cmd);
	};

	handleFillChange = (event, state) => {
		const cmd = this.createCommand();
		this.setState({ fill: state });
		this.chartNode.data.fill = state;
		this.executeDataCommand(cmd);
	};

	handleAngleChange = (event, state) => {
		const cmd = this.createCommand();
		this.setState({ angle: state === true ? Math.PI : Math.PI * 2 });
		this.chartNode.data.angle = state === true ? Math.PI : Math.PI * 2;
		this.executeDataCommand(cmd);
	};

	handleSeriesLabelsChange = (event) => {
		const cmd = this.createCommand();
		this.setState({ seriesLabels: event.target.value });
		this.chartNode.data.hasSeriesLabels = event.target.value;
		this.executeDataCommand(cmd);
	};

	handleCategoryLabelsChange = (event) => {
		const cmd = this.createCommand();
		this.setState({ categoryLabels: event.target.value });
		this.chartNode.data.hasCategoryLabels = event.target.value;
		this.executeDataCommand(cmd);
	};

	handleCoherentChange = (event, state) => {
		const cmd = this.createCommand();
		this.setState({ coherent: state });
		this.chartNode.data.coherent = state;
		this.executeDataCommand(cmd);
	};

	handleEmptyChange = (event) => {
		const cmd = this.createCommand();
		this.setState({ hideEmpty: event.target.value });
		this.chartNode.data.hideEmpty = event.target.value;
		this.executeDataCommand(cmd);
	};

	handleSeriesDirectionChange = (event) => {
		const cmd = this.createCommand();
		this.setState({ seriesDirection: event.target.value });
		this.chartNode.data.direction = event.target.value;
		this.executeDataCommand(cmd);
	};

	handleChange = (event, value) => {
		this.setState({ value });
	};

	handleDataRange = (event) => {
		this.setState({ dataRange: event.target.value });
	};

	handleDataRangeBlur = (event) => {
		const cmd = this.createCommand();
		const range = this.validateRange(event.target.textContent);

		this.chartNode.setDataRangeString(range);
		this.setState({ dataRange: range });

		cmd._sheetView.updateGraphItem(cmd._sheetView.getItem(), this.chartNode);

		this.executeDataCommand(cmd);
	};

	handleCategoryDataRange = (event) => {
		this.setState({ categoryDataRange: event.target.value });
	};

	handleCategoryDataRangeBlur = (event) => {
		const cmd = this.createCommand();
		const range = this.validateRange(event.target.textContent);

		this.chartNode.setCategoryDataRangeString(range);
		this.setState({ categoryDataRange: range });
		this.executeDataCommand(cmd);
	};

	handleSeriesData = (event, series) => {
		series.data = event.target.value;
		this.setState({ series: this.chartNode.data.series });
	};

	handleSeriesDataBlur = (event, series) => {
		const cmd = this.createCommand();
		series.data = this.validateRange(event.target.textContent);

		this.setState({ series: this.chartNode.data.series });
		this.executeDataCommand(cmd);
	};

	handleSeriesDataX = (event, series) => {
		series.dataX = event.target.value;
		this.setState({ series: this.chartNode.data.series });
	};

	handleSeriesDataXBlur = (event, series) => {
		const cmd = this.createCommand();
		series.dataX = this.validateRange(event.target.textContent);

		this.setState({ series: this.chartNode.data.series });
		this.executeDataCommand(cmd);
	};

	handleSeriesDataRadius = (event, series) => {
		series.dataRadius = event.target.value;
		this.setState({ series: this.chartNode.data.series });
	};

	handleSeriesDataRadiusBlur = (event, series) => {
		const cmd = this.createCommand();
		series.dataRadius = this.validateRange(event.target.textContent);

		this.setState({ series: this.chartNode.data.series });
		this.executeDataCommand(cmd);
	};

	handleSeriesLabel = (event, series) => {
		series.seriesLabelRange = event.target.value;
		this.setState({ series: this.chartNode.data.series });
	};

	handleSeriesLabelBlur = (event, series) => {
		const cmd = this.createCommand();
		series.seriesLabelRange = this.validateRange(event.target.textContent);

		this.setState({ series: this.chartNode.data.series });
		this.executeDataCommand(cmd);
	};

	handleTitle = (event) => {
		this.setState({ title: event.target.value });
	};

	handleTitleBlur = (event) => {
		const cmd = this.createCommand();
		this.chartNode.title.title = this.validateRange(event.target.textContent);
		this.setState({ title: this.chartNode.title.title });

		this.executeTitleCommand(cmd);
	};

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

	handleTitleFontChange = (key, value) => {
		const cmd = this.createCommand();
		const font = { ...this.state.titleFont };

		this.assignFont(font, key, value);
		this.setState({ titleFont: font });
		this.chartNode.title.font = font;

		this.executeTitleCommand(cmd);
	};

	handleAddSeries = () => {
		const cmd = this.createCommand();
		const series = {};

		this.chartNode.data.series.push(series);
		this.setState({ series: this.chartNode.data.series });
		this.setState({ seriesDataIndex: this.chartNode.data.series.length - 1 });

		this.executeDataCommand(cmd);
	};

	handleDeleteSeries = () => {
		const cmd = this.createCommand();
		Arrays.removeAt(this.chartNode.data.series, this.state.seriesDataIndex);

		this.setState({ series: this.chartNode.data.series });
		this.setState({ seriesDataIndex: 0 });

		this.executeDataCommand(cmd);
	};

	handleSeriesIndexChange = (event) => {
		this.setState({ seriesIndex: Number(event.target.value) });
		this.setState({ series: this.chartNode.data.series });
	};

	handlePointIndexChange = (event) => {
		this.setState({ pointIndex: event.target.value });
	};

	handleSeriesDataIndexChange = (event) => {
		this.setState({ seriesDataIndex: Number(event.target.value) });
		this.setState({ series: this.chartNode.data.series });
	};

	handleSeriesFormatChange = (value, category) => {
		const series = this.chartNode.data.series[this.state.seriesIndex];
		if (series === undefined) {
			return;
		}

		const cmd = this.createCommand();
		const change = (data) => {
			switch (category) {
			case 'fillColor':
			case 'lineColor':
			case 'markerLineColor':
			case 'markerFillColor':
				data[category] = value === 'transparent' ? undefined : value;
				break;
			default:
				data[category] = value;
				break;
			}
		};

		if (this.state.pointIndex === 'all') {
			change(series);
			if (series.pointInfo) {
				series.pointInfo.forEach((info) => {
					if (info) {
						info[category] = undefined;
					}
				});
			}
		} else {
			if (!series.pointInfo) {
				series.pointInfo = [];
			}
			const index = Number(this.state.pointIndex);
			if (!series.pointInfo[index]) {
				series.pointInfo[index] = {};
			}
			change(series.pointInfo[index]);
		}
		this.setState({ series: this.chartNode.data.series });
		this.executeDataCommand(cmd);

	};

	handleSeriesShowLineChange = (event, state) => {
		const cmd = this.createCommand();
		this.chartNode.data.series[this.state.seriesIndex].showLine = state;
		this.setState({ series: this.chartNode.data.series });
		this.executeDataCommand(cmd);
	};

	handleAxisChanged = (type, key, value) => {
		const cmd = this.createCommand();

		const axis = type === 'x' ? this.getCurrentXAxis() : this.getCurrentYAxis();

		switch (key) {
			case 'min':
				if (axis.type === 'time') {
					if (axis.time) {
						delete axis.time.min;
					}
					if (value) {
						if (axis.time === undefined) {
							axis.time = {};
						}
						axis.time.min = value;
					}
				} else if (value !== undefined) {
					axis.ticks.min = value;
				} else {
					delete axis.ticks.min;
				}
				break;
			case 'max':
				if (axis.type === 'time') {
					if (axis.time) {
						delete axis.time.max;
					}
					if (value) {
						if (axis.time === undefined) {
							axis.time = {};
						}
						axis.time.max = value;
					}
				} else if (value) {
					axis.ticks.max = value;
				} else {
					delete axis.ticks.max;
				}
				break;
			case 'step':
				if (axis.type === 'time') {
					if (axis.time) {
						delete axis.time.stepSize;
					}
					if (value) {
						if (axis.time === undefined) {
							axis.time = {};
						}
						axis.time.stepSize = value;
					}
				} else if (value) {
					axis.ticks.stepSize = value;
				} else {
					delete axis.ticks.stepSize;
				}
				break;
			case 'type':
				axis.type = value;
				break;
			case 'tickrotation':
				switch (value) {
					case 'auto':
						axis.ticks.minRotation = 0;
						axis.ticks.maxRotation = 90;
						break;
					case 'horizontal':
						axis.ticks.minRotation = 0;
						axis.ticks.maxRotation = 0;
						break;
					case 'vertical':
						axis.ticks.minRotation = 90;
						axis.ticks.maxRotation = 90;
						break;
					default:
						break;
				}
				break;
			case 'pos':
				axis.position = value;
				break;
			case 'title':
				if (axis.scaleLabel === undefined) {
					axis.scaleLabel = {};
				}
				axis.scaleLabel.labelString = this.validateRange(value);
				axis.scaleLabel.display = value !== undefined && value !== '';
				break;
			case 'font':
				this.reassignFont(axis.ticks, value);
				break;
			case 'titlefont':
				if (axis.scaleLabel === undefined) {
					axis.scaleLabel = {};
				}
				this.reassignFont(axis.scaleLabel, value);
				break;
			case 'reverse':
				axis.ticks.reverse = value;
				break;
			default:
				break;
		}

		this.setState({ scales: this.chartNode.scales });

		this.executeScalesCommand(cmd);
	};

	handleXAxesSeriesIndexChange = (event) => {
		const cmd = this.createCommand();
		this.chartNode.data.series[this.state.seriesIndex].xAxisID = event.target.value;
		this.setState({ series: this.chartNode.data.series });
		this.executeDataCommand(cmd);
	};

	handleYAxesSeriesIndexChange = (event) => {
		const cmd = this.createCommand();
		this.chartNode.data.series[this.state.seriesIndex].yAxisID = event.target.value;
		this.setState({ series: this.chartNode.data.series });
		this.executeDataCommand(cmd);
	};

	handleAxesIndexChange = (event) => {
		this.setState({ axisId: event.target.value });
	};

	handleXAxesIndexChange = (event) => {
		this.setState({ xAxisId: event.target.value });
	};

	handleYAxesIndexChange = (event) => {
		this.setState({ yAxisId: event.target.value });
	};

	handleAddXAxis = () => {
		const cmd = this.createCommand();

		const name = this.chartNode.getUniqueAxisName(true);

		const axis = {
			id: name,
			ticks: {
				beginAtZero: true,
				fontFamily: 'Verdana',
				fontSize: 9,
				fontColor: '#000000',
				fontStyle: 'normal',
				minRotation: 0,
				maxRotation: 90
			},
			gridLines: {}
		};

		this.chartNode.scales.xAxes.push(axis);
		this.setState({ scales: this.chartNode.scales });
		this.setState({ xAxisId: name });
		this.executeScalesCommand(cmd);
	};

	handleAddYAxis = () => {
		const cmd = this.createCommand();

		const name = this.chartNode.getUniqueAxisName(false);

		const axis = {
			id: name,
			ticks: {
				beginAtZero: true,
				fontFamily: 'Verdana',
				fontSize: 9,
				fontColor: '#000000',
				fontStyle: 'normal',
				minRotation: 0,
				maxRotation: 90
			},
			gridLines: {}
		};

		this.chartNode.scales.yAxes.push(axis);
		this.setState({ scales: this.chartNode.scales });
		this.setState({ yAxisId: name });
		this.executeScalesCommand(cmd);
	};

	handleDeleteXAxis = () => {
		const cmd = this.createCommand();
		const axis = this.chartNode.getAxisByName(this.state.xAxisId);

		if (axis) {
			Arrays.remove(this.chartNode.scales.xAxes, axis);
		}

		this.setState({ xAxisId: this.chartNode.scales.xAxes[0].id });
		this.setState({ scales: this.chartNode.scales });
		this.executeScalesCommand(cmd);
	};

	handleDeleteYAxis = () => {
		const cmd = this.createCommand();
		const axis = this.chartNode.getAxisByName(this.state.yAxisId);

		if (axis) {
			Arrays.remove(this.chartNode.scales.yAxes, axis);
		}

		this.setState({ yAxisId: this.chartNode.scales.yAxes[0].id });
		this.setState({ scales: this.chartNode.scales });
		this.executeScalesCommand(cmd);
	};

	handleGridLineColorChange = (color) => {
		const axis = this.getCurrentAxis();
		if (axis === undefined) {
			return;
		}
		const cmd = this.createCommand();
		if (axis.gridLines === undefined) {
			axis.gridLines = {};
		}
		axis.gridLines.color = color;

		this.setState({ scales: this.chartNode.scales });
		this.executeScalesCommand(cmd);
	};

	handleGridLineWidthBlur = (event) => {
		const axis = this.getCurrentAxis();
		if (axis === undefined) {
			return;
		}
		const cmd = this.createCommand();
		if (axis.gridLines === undefined) {
			axis.gridLines = {};
		}

		axis.gridLines.lineWidth = Math.max(1, Number(event.target.value));

		this.setState({ scales: this.chartNode.scales });
		this.executeScalesCommand(cmd);
	};

	handleGridLineColorClose = () => {};

	handleGridlineVisibleChange = () => (event, state) => {
		const axis = this.getCurrentAxis();
		if (axis === undefined) {
			return;
		}
		const cmd = this.createCommand();
		if (axis.gridLines === undefined) {
			axis.gridLines = {};
		}
		axis.gridLines.display = state;

		this.setState({ scales: this.chartNode.scales });
		this.executeScalesCommand(cmd);
	};

	handleLegendFontChange = (key, value) => {
		const cmd = this.createCommand();
		const font = { ...this.state.legendFont };

		this.assignFont(font, key, value);
		this.setState({ legendFont: font });
		this.chartNode.legend.font = font;
		this.executeLegendCommand(cmd);
	};

	handleLegendPositionChange = (event) => {
		const cmd = this.createCommand();
		this.setState({ legendPosition: event.target.value });
		this.chartNode.legend.position = event.target.value;
		this.executeLegendCommand(cmd);
	};

	handleExpansionChange = (panel) => (event, expanded) => {
		this.setState({
			expanded: expanded ? panel : false
		});
	};

	handleClose = () => {
		this.props.setAppState({ showChartProperties: false });
	};

	render() {
		const { expanded } = this.state;
		if (!this.state.scales) {
			return <div />;
		}
		const yAxis = this.getCurrentYAxis();
		const xAxis = this.getCurrentXAxis();
		const axis = this.getCurrentAxis();
		const series =
			this.state.series && this.state.series.length > this.state.seriesDataIndex
				? this.state.series[this.state.seriesDataIndex]
				: undefined;
		const sheetView = this.getSheetView();
		if (!yAxis || !xAxis || !axis || !sheetView) {
			return <div />;
		}
		return (
			<Slide direction="left" in={this.props.appState.showChartProperties} mountOnEnter unmountOnExit>
				<div
					style={{
						backgroundColor: '#FFFFFF',
						border: '1px solid grey',
						position: 'absolute',
						top: '-1px',
						right: '0px',
						width: '300px',
						height: '100%',
						visibility: this.props.appState.showChartProperties ? 'visible' : 'hidden',
						overflowX: 'hidden',
						overflowY: 'auto',
						zIndex: '1250'
					}}
				>
					<div
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
							<FormattedMessage id="ChartProperties.chartProperties" defaultMessage="Chart Properties" />
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
					<FormControl
						style={{
							width: '95%',
							margin: '8px'
						}}
					>
						<InputLabel htmlFor="chart-type">
							<FormattedMessage id="ChartProperties.type" defaultMessage="Chart Type:" />
						</InputLabel>
						<Select
							id="chart-type"
							value={this.state.chartType}
							onChange={this.handleChartTypeChange}
							input={<Input name="chart-type" id="chart-type" />}
						>
							<MenuItem value="line" key={1}>
								<FormattedMessage id="ChartProperties.line" defaultMessage="Line" />
							</MenuItem>
							<MenuItem value="column" key={2}>
								<FormattedMessage id="ChartProperties.column" defaultMessage="Column" />
							</MenuItem>
							<MenuItem value="bar" key={3}>
								<FormattedMessage id="ChartProperties.bar" defaultMessage="Bar" />
							</MenuItem>
							<MenuItem value="pie" key={4}>
								<FormattedMessage id="ChartProperties.pie" defaultMessage="Pie" />
							</MenuItem>
							<MenuItem value="doughnut" key={5}>
								<FormattedMessage id="ChartProperties.doughnut" defaultMessage="Doughnut" />
							</MenuItem>
							<MenuItem value="area" key={6}>
								<FormattedMessage id="ChartProperties.area" defaultMessage="Area" />
							</MenuItem>
							<MenuItem value="scatter" key={7}>
								<FormattedMessage id="ChartProperties.scatter" defaultMessage="Scatter" />
							</MenuItem>
							<MenuItem value="scatterLine" key={8}>
								<FormattedMessage id="ChartProperties.scatterLine" defaultMessage="XY Line" />
							</MenuItem>
							<MenuItem value="bubble" key={9}>
								<FormattedMessage id="ChartProperties.bubble" defaultMessage="Bubble" />
							</MenuItem>
							<MenuItem value="polarArea" key={10}>
								<FormattedMessage id="ChartProperties.polarArea" defaultMessage="Polar Area" />
							</MenuItem>
							<MenuItem value="radar" key={11}>
								<FormattedMessage id="ChartProperties.radar" defaultMessage="Radar" />
							</MenuItem>
						</Select>
					</FormControl>
					<div
						style={{
							paddingLeft: '8px',
							paddingBottom: '8px'
						}}
					>
						{this.state.chartType === 'line' ||
						this.state.chartType === 'area' ||
						this.state.chartType === 'bar' ||
						this.state.chartType === 'column' ? (
							<FormControlLabel
								control={<Checkbox checked={this.state.stacked} onChange={this.handleStackedChange} />}
								label={<FormattedMessage id="ChartProperties.stacked" defaultMessage="Stacked" />}
							/>
						) : null}
						{this.state.chartType === 'line' || this.state.chartType === 'area' ? (
							<FormControlLabel
								style={{}}
								control={<Checkbox checked={this.state.step} onChange={this.handleStepChange} />}
								label={<FormattedMessage id="ChartProperties.step" defaultMessage="Stepped" />}
							/>
						) : null}
						{(this.state.chartType === 'line' ||
							this.state.chartType === 'radar' ||
							this.state.chartType === 'scatter' ||
							this.state.chartType === 'scatterLine' ||
							this.state.chartType === 'area') &&
						!this.state.step ? (
							<FormControlLabel
								control={<Checkbox checked={this.state.smooth} onChange={this.handleSmoothChange} />}
								label={<FormattedMessage id="ChartProperties.smooth" defaultMessage="Smooth" />}
							/>
						) : null}
						{this.state.chartType === 'radar' ? (
							<FormControlLabel
								control={<Checkbox checked={this.state.fill} onChange={this.handleFillChange} />}
								label={<FormattedMessage id="ChartProperties.fill" defaultMessage="Fill" />}
							/>
						) : null}
						{this.state.chartType === 'pie' || this.state.chartType === 'doughnut' ? (
							<FormControlLabel
								control={
									<Checkbox
										checked={this.state.angle === Math.PI}
										onChange={this.handleAngleChange}
									/>
								}
								label={<FormattedMessage id="ChartProperties.gauge" defaultMessage="Gauge" />}
							/>
						) : null}
					</div>
					<Tabs
						value={this.state.value}
						style={{
							backgroundColor: 'grey',
							color: 'white'
						}}
						onChange={this.handleChange}
					>
						<Tab label={<FormattedMessage id="ChartProperties.data" defaultMessage="Data" />} />
						<Tab label={<FormattedMessage id="ChartProperties.settings" defaultMessage="Settings" />} />
					</Tabs>
					{this.state.value === 0 && (
						<TabContainer>
							<FormControlLabel
								style={{
									padding: '4px 8px 0px'
								}}
								control={
									<Checkbox
										checked={this.state.coherent}
										onChange={this.handleCoherentChange}
										disabled={this.chartNode._timeAggregate}
									/>
								}
								label={
									<FormattedMessage
										id="ChartProperties.coherentRange"
										defaultMessage="Coherent Data Range"
									/>
								}
							/>
							<FormControl
								style={{
									width: '95%',
									margin: '8px'
								}}
							>
								<InputLabel htmlFor="hide-empty">
									<FormattedMessage id="ChartProperties.DataHandling" defaultMessage="Data" />
								</InputLabel>
								<Select
									id="hide-empty"
									value={this.state.hideEmpty}
									onChange={this.handleEmptyChange}
									input={<Input name="hide-empty" id="hide-empty" />}
								>
									<MenuItem value="none" key={1}>
										<FormattedMessage
											id="ChartProperties.DisplayAll"
											defaultMessage="Display all"
										/>
									</MenuItem>
									<MenuItem value="empty" key={2}>
										<FormattedMessage
											id="ChartProperties.Empty"
											defaultMessage="Ignore empty cells"
										/>
									</MenuItem>
									<MenuItem value="zero" key={3}>
										<FormattedMessage
											id="ChartProperties.Zero"
											defaultMessage="Ignore empty cells or zero values"
										/>
									</MenuItem>
								</Select>
							</FormControl>
							{this.state.coherent ? (
								<div>
									<FormControl
										style={{
											width: '95%',
											margin: '8px'
										}}
									>
										<CellRangeComponent
											sheetView={sheetView}
											label={
												<FormattedMessage
													id="ChartProperties.dataRange"
													defaultMessage="Data Range:"
												/>
											}
											range={this.state.dataRange ? this.state.dataRange : ''}
											onChange={this.handleDataRange}
											onBlur={this.handleDataRangeBlur}
											onKeyPress={(ev) => {
												if (ev.key === 'Enter') {
													this.handleDataRangeBlur(ev);
												}
											}}
										/>
									</FormControl>
									<FormControl
										style={{
											width: '95%',
											margin: '8px'
										}}
									>
										<InputLabel htmlFor="series-direction">
											<FormattedMessage
												id="ChartProperties.seriesDirection"
												defaultMessage="Series Direction:"
											/>
										</InputLabel>
										<Select
											id="series-labels"
											disabled={this.chartNode._timeAggregate}
											value={this.state.seriesDirection}
											onChange={this.handleSeriesDirectionChange}
											input={<Input name="series-direction" id="series-direction" />}
										>
											<MenuItem value="auto" key={1}>
												<FormattedMessage
													id="ChartProperties.automatic"
													defaultMessage="Automatic"
												/>
											</MenuItem>
											<MenuItem value="columns" key={2}>
												<FormattedMessage
													id="ChartProperties.columns"
													defaultMessage="Columns"
												/>
											</MenuItem>
											<MenuItem value="rows" key={3}>
												<FormattedMessage id="ChartProperties.rows" defaultMessage="Rows" />
											</MenuItem>
										</Select>
									</FormControl>
									<FormControl
										style={{
											width: '95%',
											margin: '8px'
										}}
									>
										<InputLabel htmlFor="series-labels">
											<FormattedMessage
												id="ChartProperties.seriesLabels"
												defaultMessage="Series Labels:"
											/>
										</InputLabel>
										<Select
											id="series-labels"
											value={this.state.seriesLabels}
											disabled={this.chartNode._timeAggregate}
											onChange={this.handleSeriesLabelsChange}
											input={<Input name="series-labels" id="series-labels" />}
										>
											<MenuItem value="auto" key={1}>
												<FormattedMessage
													id="ChartProperties.automatic"
													defaultMessage="Automatic"
												/>
											</MenuItem>
											<MenuItem value="first" key={2}>
												{this.state.seriesDirection === 'columns' ? (
													<FormattedMessage
														id="ChartProperties.firstRow"
														defaultMessage="First Row"
													/>
												) : (
													<FormattedMessage
														id="ChartProperties.firstColumn"
														defaultMessage="First Column"
													/>
												)}
											</MenuItem>
											<MenuItem value="none" key={3}>
												<FormattedMessage id="ChartProperties.none" defaultMessage="None" />
											</MenuItem>
										</Select>
									</FormControl>
									<FormControl
										style={{
											width: '95%',
											margin: '8px'
										}}
									>
										<InputLabel htmlFor="category-labels">
											<FormattedMessage
												id="ChartProperties.categoryLabels"
												defaultMessage="Category Labels:"
											/>
										</InputLabel>
										<Select
											id="category-labels"
											value={this.state.categoryLabels}
											onChange={this.handleCategoryLabelsChange}
											disabled={this.chartNode._timeAggregate}
											input={<Input name="category-labels" id="category-labels" />}
										>
											<MenuItem value="auto" key={1}>
												<FormattedMessage
													id="ChartProperties.automatic"
													defaultMessage="Automatic"
												/>
											</MenuItem>
											<MenuItem value="first" key={2}>
												{this.state.seriesDirection === 'columns' ? (
													<FormattedMessage
														id="ChartProperties.firstColumn"
														defaultMessage="First Column"
													/>
												) : (
													<FormattedMessage
														id="ChartProperties.firstRow"
														defaultMessage="First Row"
													/>
												)}
											</MenuItem>
											<MenuItem value="none" key={3}>
												<FormattedMessage id="ChartProperties.none" defaultMessage="None" />
											</MenuItem>
										</Select>
									</FormControl>
								</div>
							) : (
								<div>
									<FormControl
										style={{
											width: '95%',
											margin: '8px'
										}}
									>
										<CellRangeComponent
											sheetView={sheetView}
											label={
												<FormattedMessage
													id="ChartProperties.categoryDataRange"
													defaultMessage="Category Data Range:"
												/>
											}
											range={this.state.categoryDataRange ? this.state.categoryDataRange : ''}
											onChange={this.handleCategoryDataRange}
											onBlur={this.handleCategoryDataRangeBlur}
											onKeyPress={(ev) => {
												if (ev.key === 'Enter') {
													this.handleCategoryDataRangeBlur(ev);
												}
											}}
										/>
									</FormControl>
									<FormControl
										style={{
											width: '70%',
											margin: '8px'
										}}
									>
										<InputLabel htmlFor="series-names">
											<FormattedMessage id="ChartProperties.series" defaultMessage="Series" />
										</InputLabel>
										<Select
											id="series-names"
											value={String(this.state.seriesDataIndex)}
											onChange={this.handleSeriesDataIndexChange}
											input={<Input name="series-names" id="series-names" />}
										>
											{this.state.series
												? this.state.series.map((lseries, index) => (
														<MenuItem value={index.toString()} key={index.toString()}>
															{lseries.seriesLabel ? (
																lseries.seriesLabel
															) : (
																<FormattedMessage
																	id="ChartProperties.newSeries"
																	defaultMessage="New Series"
																/>
															)}
														</MenuItem>
												  ))
												: null}
										</Select>
									</FormControl>
									<IconButton
										style={{
											width: '34px',
											fontSize: '16pt'
										}}
										onClick={() => this.handleAddSeries()}
									>
										<AddIcon fontSize="inherit" />
									</IconButton>
									<IconButton
										style={{
											width: '34px',
											fontSize: '16pt'
										}}
										disabled={this.chartNode.data.series && this.chartNode.data.series.length === 1}
										onClick={() => this.handleDeleteSeries()}
									>
										<DeleteIcon fontSize="inherit" />
									</IconButton>
									<div>
										{this.state.chartType === 'scatter' ||
										this.state.chartType === 'scatterLine' ||
										this.state.chartType === 'bubble' ? (
											<FormControl
												style={{
													width: '95%',
													margin: '8px'
												}}
											>
												<CellRangeComponent
													sheetView={sheetView}
													label={
														<FormattedMessage
															id="ChartProperties.seriesXValues"
															defaultMessage="Series Values (X)"
														/>
													}
													range={series && series.dataX ? series.dataX : ''}
													onChange={(event) => this.handleSeriesDataX(event, series)}
													onBlur={(event) => this.handleSeriesDataXBlur(event, series)}
													onKeyPress={(event) => {
														if (event.key === 'Enter') {
															this.handleSeriesDataXBlur(event, series);
														}
													}}
												/>
											</FormControl>
										) : null}
										<FormControl
											style={{
												width: '95%',
												margin: '8px'
											}}
										>
											<CellRangeComponent
												sheetView={sheetView}
												label={
													<FormattedMessage
														id="ChartProperties.seriesValues"
														defaultMessage="Series Values"
													/>
												}
												range={series && series.data ? series.data : ''}
												onChange={(event) => this.handleSeriesData(event, series)}
												onBlur={(event) => this.handleSeriesDataBlur(event, series)}
												onKeyPress={(event) => {
													if (event.key === 'Enter') {
														this.handleSeriesDataBlur(event, series);
													}
												}}
											/>
										</FormControl>
										{this.state.chartType === 'bubble' ? (
											<FormControl
												style={{
													width: '95%',
													margin: '8px'
												}}
											>
												<CellRangeComponent
													sheetView={sheetView}
													label={
														<FormattedMessage
															id="ChartProperties.seriesRadius"
															defaultMessage="Series Values (Radius)"
														/>
													}
													range={series && series.dataRadius ? series.dataRadius : ''}
													onChange={(event) => this.handleSeriesDataRadius(event, series)}
													onBlur={(event) => this.handleSeriesDataRadiusBlur(event, series)}
													onKeyPress={(event) => {
														if (event.key === 'Enter') {
															this.handleSeriesDataRadiusBlur(event, series);
														}
													}}
												/>
											</FormControl>
										) : null}
										<FormControl
											style={{
												width: '95%',
												margin: '8px'
											}}
										>
											<CellRangeComponent
												sheetView={sheetView}
												label={
													<FormattedMessage
														id="ChartProperties.seriesLabel"
														defaultMessage="Series Label"
													/>
												}
												range={series ? series.seriesLabelRange : ''}
												onChange={(event) => this.handleSeriesLabel(event, series)}
												onBlur={(event) => this.handleSeriesLabelBlur(event, series)}
												onKeyPress={(event) => {
													if (event.key === 'Enter') {
														this.handleSeriesLabelBlur(event, series);
													}
												}}
											/>
										</FormControl>
									</div>
								</div>
							)}
						</TabContainer>
					)}
					{this.state.value === 1 && (
						<TabContainer>
							<ExpansionPanel
								expanded={expanded === 'panel1'}
								onChange={this.handleExpansionChange('panel1')}
							>
								<ExpansionPanelSummary style={styles.expansionSummary} expandIcon={<ExpandMoreIcon />}>
									<Typography>
										<FormattedMessage id="ChartProperties.title" defaultMessage="Title" />
									</Typography>
								</ExpansionPanelSummary>
								<ExpansionPanelDetails style={styles.expansionDetails}>
									<FormControl
										style={{
											width: '95%'
										}}
									>
										<CellRangeComponent
											sheetView={sheetView}
											label={
												<FormattedMessage id="ChartProperties.title" defaultMessage="Title" />
											}
											range={this.state.title}
											onChange={this.handleTitle}
											onBlur={(event) => this.handleTitleBlur(event)}
											onKeyPress={(event) => {
												if (event.key === 'Enter') {
													this.handleTitleBlur(event);
												}
											}}
										/>
									</FormControl>
									<FontComponent
										font={this.state.titleFont}
										handler={(key, value) => this.handleTitleFontChange(key, value)}
									/>
								</ExpansionPanelDetails>
							</ExpansionPanel>
							<ExpansionPanel
								expanded={expanded === 'panel5'}
								onChange={this.handleExpansionChange('panel5')}
							>
								<ExpansionPanelSummary style={styles.expansionSummary} expandIcon={<ExpandMoreIcon />}>
									<Typography>
										<FormattedMessage
											id="ChartProperties.dataSeries"
											defaultMessage="Data Series"
										/>
									</Typography>
								</ExpansionPanelSummary>
								<ExpansionPanelDetails style={styles.expansionDetails}>
									<FormControl
										style={{
											width: '95%'
										}}
									>
										<InputLabel htmlFor="series-names">
											<FormattedMessage
												id="ChartProperties.dataSeries"
												defaultMessage="Data Series"
											/>
										</InputLabel>
										<Select
											id="series-names"
											value={String(this.state.seriesIndex)}
											onChange={this.handleSeriesIndexChange}
											input={<Input name="series-names" id="series-names" />}
										>
											{this.state.series
												? this.state.series.map((lseries, index) => (
														<MenuItem value={index.toString()} key={index.toString()}>
															{lseries.seriesLabel}
														</MenuItem>
												  ))
												: null}
										</Select>
									</FormControl>
									<FormControl
										style={{
											width: '95%',
											marginTop: '10px',
											marginBottom: '10px'
										}}
									>
										<InputLabel htmlFor="point-names">
											<FormattedMessage
												id="ChartProperties.dataPoint"
												defaultMessage="Data Point(s)"
											/>
										</InputLabel>
										<Select
											id="series-point"
											value={String(this.state.pointIndex)}
											onChange={this.handlePointIndexChange}
											input={<Input name="point-names" id="point-names" />}
										>
											<MenuItem value="all" key="all">
												<FormattedMessage id="ChartProperties.all" defaultMessage="All" />
											</MenuItem>
											{this.state.categoryLabelData
												? this.state.categoryLabelData.map((point, index) => (
														<MenuItem value={index.toString()} key={index.toString()}>
															{point || `Point ${index + 1}`}
														</MenuItem>
												  ))
												: null}
										</Select>
									</FormControl>
									{!this.isLineChart() ? (
										<FormControl
											style={{
												width: '90%'
											}}
										>
											<ColorComponent
												label={
													<FormattedMessage
														id="ChartProperties.seriesFillColor"
														defaultMessage="Fill Color"
													/>
												}
												transparent
												width={70}
												color={this.getSeriesFillColor()}
												onChange={(color) => this.handleSeriesFormatChange(color, 'fillColor')}
											/>
										</FormControl>
									) : null}
									{(!this.isLineChart() || this.state.pointIndex === 'all') ? (
										<FormControl
											style={{
												display: 'inline-flex',
												width: '28%'
											}}
										>
											<ColorComponent
												label={
													<FormattedMessage
														id="ChartProperties.seriesLineColor"
														defaultMessage="Line Color"
													/>
												}
												transparent
												width={70}
												color={this.getSeriesLineColor()}
												onChange={(color) => this.handleSeriesFormatChange(color, 'lineColor')}
											/>
										</FormControl>
										) : null}
									{(!this.isLineChart() || this.state.pointIndex === 'all') ? (
										<FormControl
											style={{
												width: '15%',
												display: 'inline-flex',
												marginTop: '2px',
												marginLeft: '10px'
											}}
										>
											<TextField
												label={
													<FormattedMessage
														id="ChartProperties.lineWidth"
														defaultMessage="Width"
													/>
												}
												type="number"
												value={this.getSeriesLineWidth()}
												onChange={(event) => this.handleSeriesFormatChange(Math.max(1, Number(event.target.value)), 'lineWidth')}
												onBlur={(event) => this.handleSeriesFormatChange(Math.max(1, Number(event.target.value)), 'lineWidth')}
												onKeyPress={(event) => {
													if (event.key === 'Enter') {
														this.handleSeriesFormatChange(Math.max(1, Number(event.target.value)), 'lineWidth');
													}
												}}
											/>
										</FormControl>
									) : null}
									{(this.isLineChart() && this.state.pointIndex === 'all') ? (
										<FormControl
											style={{
												width: '43%',
												marginLeft: '10px',
												marginRight: '5px',
												marginTop: '2px'
											}}
										>
											<InputLabel htmlFor="line-style">
												<FormattedMessage id="ChartProperties.lineStyle" defaultMessage="Style" />
											</InputLabel>
											<Select
												id="line-style"
												value={this.getSeriesLineStyle()}
												onChange={(event) => this.handleSeriesFormatChange(Number(event.target.value), 'lineStyle')}
												input={
													<Input
														style={{
															backgroundImage: `url(${LINE_STYLES[this.getSeriesLineStyle()].image}`,
															backgroundRepeat: 'no-repeat',
															backgroundPositionY: 'center',
															color: '#000000',
														}}
														defaultValue="0"
														name="line-style"
														id="line-style"
													/>
												}
											>
												{LINE_STYLES.map((name) => (
													<MenuItem
														style={{
															backgroundImage: `url(${name.image})`,
															backgroundRepeat: 'no-repeat',
															backgroundPositionY: 'center',
															color: `${name.id ? 'transparent' : '#000000'}`,
														}}
														value={name.value}
														key={name.id}
													>
														{name.id === 0 ? name.name : ''}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									) : null}
									{this.isLineChart() ? (
										<FormControl
											style={{
												width: '95%',
												marginTop: '10px',
												marginBottom: '10px'
											}}
										>
											<InputLabel htmlFor="series-marker">
												<FormattedMessage
													id="ChartProperties.seriesMarker"
													defaultMessage="Line Marker"
												/>
											</InputLabel>
											<Select
												id="series-marker"
												value={this.getSeriesLineMarker()}
												onChange={(event) => this.handleSeriesFormatChange(event.target.value, 'lineMarker')}
												input={<Input name="series-marker" id="series-marker" />}
											>
												<MenuItem value="none" key={1}>
													<FormattedMessage id="ChartProperties.none" defaultMessage="None" />
												</MenuItem>
												<MenuItem value="circle" key={2}>
													<FormattedMessage
														id="ChartProperties.circle"
														defaultMessage="Circle"
													/>
												</MenuItem>
												<MenuItem value="cross" key={3}>
													<FormattedMessage
														id="ChartProperties.cross"
														defaultMessage="Cross"
													/>
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
													<FormattedMessage
														id="ChartProperties.rectangle"
														defaultMessage="Rectangle"
													/>
												</MenuItem>
												<MenuItem value="rectRounded" key={8}>
													<FormattedMessage
														id="ChartProperties.roundedRectangle"
														defaultMessage="Rounded Rectangle"
													/>
												</MenuItem>
												<MenuItem value="rectRot" key={9}>
													<FormattedMessage
														id="ChartProperties.diamond"
														defaultMessage="Diamond"
													/>
												</MenuItem>
												<MenuItem value="star" key={10}>
													<FormattedMessage id="ChartProperties.star" defaultMessage="Star" />
												</MenuItem>
												<MenuItem value="triangle" key={11}>
													<FormattedMessage
														id="ChartProperties.triangle"
														defaultMessage="Triangle"
													/>
												</MenuItem>
											</Select>
										</FormControl>
									) : null}
									{this.isLineChart() ? (
										<FormControl
											style={{
												width: '50%'
											}}
										>
											<ColorComponent
												label={
													<FormattedMessage
														id="ChartProperties.markerFillColor"
														defaultMessage="Marker Fill Color"
													/>
												}
												transparent
												color={this.getSeriesMarkerFillColor()}
												onChange={(color) => this.handleSeriesFormatChange(color, 'markerFillColor')}
											/>
										</FormControl>
									) : null}
									{this.isLineChart() ? (
										<FormControl
											style={{
												display: 'inline-flex',
												width: '50%'
											}}
										>
											<ColorComponent
												label={
													<FormattedMessage
														id="ChartProperties.markerLineColor"
														defaultMessage="Marker Line Color"
													/>
												}
												transparent
												color={this.getSeriesMarkerLineColor()}
												onChange={(color) => this.handleSeriesFormatChange(color, 'markerLineColor')}
											/>
										</FormControl>
									) : null}
									<FormControlLabel
										control={
											<Checkbox
												checked={this.getSeriesShowDataLabels()}
												onChange={(event, state) => this.handleSeriesFormatChange(state, 'showDataLabels')}
											/>
										}
										label={
											<FormattedMessage
												id="ChartProperties.showDataLabels"
												defaultMessage="Show Datalabels"
											/>
										}
									/>
									{this.state.chartType === 'scatter' || this.state.chartType === 'scatterLine' ? (
										<FormControlLabel
											control={
												<Checkbox
													checked={this.getSeriesShowLine()}
													onChange={this.handleSeriesShowLineChange}
												/>
											}
											label={
												<FormattedMessage
													id="ChartProperties.connectPoints"
													defaultMessage="Connect Points"
												/>
											}
										/>
									) : null}
									{this.hasMultiXAxis() &&
									this.state.scales.xAxes[0].type !== 'category' &&
									this.state.scales.xAxes.length > 1 ? (
										<div>
											<FormControl
												style={{
													width: '70%',
													marginBottom: '15px'
												}}
											>
												<InputLabel htmlFor="axes-names">
													<FormattedMessage
														id="ChartProperties.selectXAxis"
														defaultMessage="Select X Axis"
													/>
												</InputLabel>
												<Select
													id="axes-names"
													value={this.getSeriesXAxisID()}
													onChange={(event) => this.handleXAxesSeriesIndexChange(event)}
													input={<Input name="axes-names" id="axes-names" />}
												>
													{this.state.scales.xAxes.map((laxis) => (
														<MenuItem value={laxis.id} key={laxis.id}>
															{laxis.id}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</div>
									) : null}
									{this.hasMultiYAxis() &&
									this.state.scales.yAxes[0].type !== 'category' &&
									this.state.scales.yAxes.length > 1 ? (
										<div>
											<FormControl
												style={{
													width: '70%',
													marginBottom: '15px'
												}}
											>
												<InputLabel htmlFor="axes-names">
													<FormattedMessage
														id="ChartProperties.selectYAxis"
														defaultMessage="Select Y Axis"
													/>
												</InputLabel>
												<Select
													id="axes-names"
													value={this.getSeriesYAxisID()}
													onChange={(event) => this.handleYAxesSeriesIndexChange(event)}
													input={<Input name="axes-names" id="axes-names" />}
												>
													{this.state.scales.yAxes.map((laxis) => (
														<MenuItem value={laxis.id} key={laxis.id}>
															{laxis.id}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</div>
									) : null}
								</ExpansionPanelDetails>
							</ExpansionPanel>
							{this.hasXAxis() ? (
								<ExpansionPanel
									expanded={expanded === 'panel3'}
									onChange={this.handleExpansionChange('panel3')}
								>
									<ExpansionPanelSummary
										style={styles.expansionSummary}
										expandIcon={<ExpandMoreIcon />}
									>
										<Typography>
											<FormattedMessage
												id="ChartProperties.horizontalAxis"
												defaultMessage="Horizontal Axis"
											/>
										</Typography>
									</ExpansionPanelSummary>
									<ExpansionPanelDetails style={styles.expansionDetails}>
										{this.hasMultiXAxis() && xAxis.type !== 'category' ? (
											<div>
												<FormControl
													style={{
														width: '70%',
														marginBottom: '15px'
													}}
												>
													<InputLabel htmlFor="axes-names">
														<FormattedMessage
															id="ChartProperties.axisToEdit"
															defaultMessage="Select Axis to edit"
														/>
													</InputLabel>
													<Select
														id="axes-names"
														value={this.state.xAxisId}
														onChange={(event) => this.handleXAxesIndexChange(event)}
														input={<Input name="axes-names" id="axes-names" />}
													>
														{this.state.scales.xAxes.map((laxis) => (
															<MenuItem value={laxis.id} key={laxis.id}>
																{laxis.id}
															</MenuItem>
														))}
													</Select>
												</FormControl>
												<IconButton
													color="inherit"
													style={{
														width: '34px',
														fontSize: '16pt'
													}}
													onClick={() => this.handleAddXAxis()}
												>
													<AddIcon fontSize="inherit" />
												</IconButton>
												<IconButton
													style={{
														width: '34px',
														fontSize: '16pt'
													}}
													disabled={this.chartNode.scales.xAxes.length === 1}
													onClick={() => this.handleDeleteXAxis()}
												>
													<DeleteIcon fontSize="inherit" />
												</IconButton>
												<FormControl
													style={{
														width: '95%',
														marginBottom: '15px'
													}}
												>
													<InputLabel htmlFor="axis-position">
														<FormattedMessage
															id="ChartProperties.axisPosition"
															defaultMessage="Axis Position"
														/>
													</InputLabel>
													<Select
														id="axis-position"
														value={xAxis.position ? xAxis.position : 'bottom'}
														onChange={(event) =>
															this.handleAxisChanged('x', 'pos', event.target.value)
														}
														input={<Input name="axis-position" id="axis-position" />}
													>
														<MenuItem value="top" key={1}>
															<FormattedMessage
																id="ChartProperties.top"
																defaultMessage="Top"
															/>
														</MenuItem>
														<MenuItem value="bottom" key={2}>
															<FormattedMessage
																id="ChartProperties.bottom"
																defaultMessage="Bottom"
															/>
														</MenuItem>
													</Select>
												</FormControl>
												<Divider style={{ margin: '10px 0px' }} />
											</div>
										) : null}
										<FormControl>
											<AxisComponent
												chartNode={this.chartNode}
												sheetView={sheetView}
												axis={xAxis}
												chartType={this.state.chartType}
												handler={(key, value) => this.handleAxisChanged('x', key, value)}
											/>
										</FormControl>
									</ExpansionPanelDetails>
								</ExpansionPanel>
							) : null}
							{this.hasYAxis() ? (
								<ExpansionPanel
									expanded={expanded === 'panel4'}
									onChange={this.handleExpansionChange('panel4')}
								>
									<ExpansionPanelSummary
										style={styles.expansionSummary}
										expandIcon={<ExpandMoreIcon />}
									>
										<Typography>
											<FormattedMessage
												id="ChartProperties.verticalAxis"
												defaultMessage="Vertical Axis"
											/>
										</Typography>
									</ExpansionPanelSummary>
									<ExpansionPanelDetails style={styles.expansionDetails}>
										{this.hasMultiYAxis() && yAxis.type !== 'category' ? (
											<div>
												<FormControl
													style={{
														width: '70%',
														marginBottom: '15px'
													}}
												>
													<InputLabel htmlFor="axes-names">
														<FormattedMessage
															id="ChartProperties.axisToEdit"
															defaultMessage="Select Axis to edit"
														/>
													</InputLabel>
													<Select
														id="axes-names"
														value={this.state.yAxisId}
														onChange={(event) => this.handleYAxesIndexChange(event)}
														input={<Input name="axes-names" id="axes-names" />}
													>
														{this.state.scales.yAxes.map((laxis) => (
															<MenuItem value={laxis.id} key={laxis.id}>
																{laxis.id}
															</MenuItem>
														))}
													</Select>
												</FormControl>
												<IconButton
													style={{
														width: '34px',
														fontSize: '16pt'
													}}
													onClick={() => this.handleAddYAxis()}
												>
													<AddIcon fontSize="inherit" />
												</IconButton>
												<IconButton
													style={{
														width: '34px',
														fontSize: '16pt'
													}}
													disabled={this.chartNode.scales.yAxes.length === 1}
													onClick={() => this.handleDeleteYAxis()}
												>
													<DeleteIcon fontSize="inherit" />
												</IconButton>
												<FormControl
													style={{
														width: '95%',
														marginBottom: '15px'
													}}
												>
													<InputLabel htmlFor="axis-position">
														<FormattedMessage
															id="ChartProperties.axisPosition"
															defaultMessage="Axis Position"
														/>
													</InputLabel>
													<Select
														id="axis-position"
														value={yAxis.position ? yAxis.position : 'left'}
														onChange={(event) =>
															this.handleAxisChanged('y', 'pos', event.target.value)
														}
														input={<Input name="axis-position" id="axis-position" />}
													>
														<MenuItem value="left" key={1}>
															<FormattedMessage
																id="ChartProperties.left"
																defaultMessage="Left"
															/>
														</MenuItem>
														<MenuItem value="right" key={2}>
															<FormattedMessage
																id="ChartProperties.right"
																defaultMessage="Right"
															/>
														</MenuItem>
													</Select>
												</FormControl>
												<Divider style={{ margin: '10px 0px' }} />
											</div>
										) : null}
										<FormControl>
											<AxisComponent
												chartNode={this.chartNode}
												sheetView={sheetView}
												axis={yAxis}
												chartType={this.state.chartType}
												handler={(key, value) => this.handleAxisChanged('y', key, value)}
											/>
										</FormControl>
									</ExpansionPanelDetails>
								</ExpansionPanel>
							) : null}
							<ExpansionPanel
								expanded={expanded === 'panel6'}
								onChange={this.handleExpansionChange('panel6')}
							>
								<ExpansionPanelSummary style={styles.expansionSummary} expandIcon={<ExpandMoreIcon />}>
									<Typography>
										<FormattedMessage id="ChartProperties.gridLines" defaultMessage="Grid Lines" />
									</Typography>
								</ExpansionPanelSummary>
								<ExpansionPanelDetails style={styles.expansionDetails}>
									<FormControl
										style={{
											width: '95%',
											marginBottom: '10px'
										}}
									>
										<InputLabel htmlFor="axes-names">
											<FormattedMessage id="ChartProperties.axes" defaultMessage="Axes" />
										</InputLabel>
										<Select
											id="axes-names"
											value={this.state.axisId}
											onChange={(event) => this.handleAxesIndexChange(event)}
											input={<Input name="axes-names" id="axes-names" />}
										>
											{this.hasXAxis() && this.state.scales
												? this.state.scales.xAxes.map((laxis) => (
														<MenuItem value={laxis.id} key={laxis.id}>
															{laxis.id}
														</MenuItem>
												  ))
												: null}
											{this.hasYAxis() && this.state.scales
												? this.state.scales.yAxes.map((laxis) => (
														<MenuItem value={laxis.id} key={laxis.id}>
															{laxis.id}
														</MenuItem>
												  ))
												: null}
										</Select>
									</FormControl>
									<FormControl
										style={{
											width: '40%',
											marginTop: '10px'
										}}
									>
										<ColorComponent
											label={
												<FormattedMessage
													id="FormatCellsDialog.gridLineColor"
													defaultMessage="Gridline Color"
												/>
											}
											color={axis && axis.gridLines.color ? axis.gridLines.color : '#DDDDDD'}
											onChange={(color) => this.handleGridLineColorChange(color)}
											onClose={(color) => this.handleGridLineColorClose(color)}
										/>
									</FormControl>
									<FormControl
										style={{
											width: '40%',
											marginTop: '12px',
											marginLeft: '18px'
										}}
									>
										<TextField
											label={
												<FormattedMessage
													id="ChartProperties.lineWidth"
													defaultMessage="Width"
												/>
											}
											type="number"
											value={axis && axis.gridLines.lineWidth ? axis.gridLines.lineWidth : 1}
											onChange={(event) => this.handleGridLineWidthBlur(event)}
											onBlur={(event) => this.handleGridLineWidthBlur(event)}
											onKeyPress={(event) => {
												if (event.key === 'Enter') {
													this.handleGridLineWidthBlur(event);
												}
											}}
										/>
									</FormControl>
									<FormControlLabel
										style={{
											marginBottom: '10px'
										}}
										control={
											<Checkbox
												checked={
													axis && axis.gridLines.display !== undefined
														? axis.gridLines.display
														: true
												}
												onChange={this.handleGridlineVisibleChange()}
											/>
										}
										label={
											<FormattedMessage id="ChartProperties.visible" defaultMessage="Visible" />
										}
									/>
								</ExpansionPanelDetails>
							</ExpansionPanel>
							<ExpansionPanel
								expanded={expanded === 'panel2'}
								onChange={this.handleExpansionChange('panel2')}
							>
								<ExpansionPanelSummary style={styles.expansionSummary} expandIcon={<ExpandMoreIcon />}>
									<Typography>
										<FormattedMessage id="ChartProperties.legend" defaultMessage="Legend" />
									</Typography>
								</ExpansionPanelSummary>
								<ExpansionPanelDetails style={styles.expansionDetails}>
									<FormControl
										style={{
											width: '95%',
											marginRight: '20px'
										}}
									>
										<InputLabel htmlFor="legend-pos">
											<FormattedMessage id="ChartProperties.position" defaultMessage="Position" />
										</InputLabel>
										<Select
											id="legend-pos"
											value={this.state.legendPosition}
											onChange={this.handleLegendPositionChange}
											input={<Input name="legend-pos" id="legend-pos" />}
										>
											<MenuItem value="none" key={1}>
												<FormattedMessage id="ChartProperties.none" defaultMessage="None" />
											</MenuItem>
											<MenuItem value="top" key={2}>
												<FormattedMessage id="ChartProperties.top" defaultMessage="Top" />
											</MenuItem>
											<MenuItem value="left" key={3}>
												<FormattedMessage id="ChartProperties.left" defaultMessage="Left" />
											</MenuItem>
											<MenuItem value="bottom" key={4}>
												<FormattedMessage id="ChartProperties.bottom" defaultMessage="Bottom" />
											</MenuItem>
											<MenuItem value="right" key={5}>
												<FormattedMessage id="ChartProperties.right" defaultMessage="Right" />
											</MenuItem>
										</Select>
									</FormControl>
									<FontComponent
										font={this.state.legendFont}
										handler={(key, value) => this.handleLegendFontChange(key, value)}
									/>
								</ExpansionPanelDetails>
							</ExpansionPanel>
						</TabContainer>
					)}
				</div>
			</Slide>
		);
	}
}

function mapStateToProps(state) {
	return {
		appState: state.appState
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ChartProperties);
