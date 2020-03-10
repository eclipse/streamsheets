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
		attributesMap.put(JSG.FormatAttributes.FILLCOLOR, JSG.SheetPlotNode.templates[data.template].chart.format.fillColor);
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

	handleAxisTitleVisibleChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.title.visible = state;
		this.finishCommand(cmd, 'axes');
	};

	handleAxisAutoZeroChange = (event, state) => {
		const cmd = this.prepareCommand('axes');
		const data = this.getData();
		data.autoZero = state;
		this.finishCommand(cmd, 'axes');
	};

	translateTitle(title) {
		switch (title) {
		case 'title':
			return 'Title';
		case 'plot':
			return 'Plot';
		case 'legend':
			return 'Legend';
		case 'xAxis':
			return 'X Axis';
		case 'yAxis':
			return 'Y Axis';
		case 'series':
			return 'Series';
		default:
			return title;
		}
	}

	getLabel(series) {
		const item = this.state.plotView.getItem();
		const ref = item.getDataSourceInfo(series.formula);
		if (ref && ref.name !== undefined) {
			return ref.name;
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
									width: '70%',
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
									{
										Object.keys(JSG.SheetPlotNode.templates).map(key => (
											<MenuItem value={key} key={key}>
												{key}
											</MenuItem>
										))
									}
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
											marginBottom: '7px'
										}}
									>
										Visible
									</FormLabel>
									<FormControlLabel
										control={
											<Checkbox
												checked={item.title.visible}
												onChange={(event, state) => this.handleVisibleChange(event, state, item.title, 'title')}
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
												onChange={(event, state) => this.handleVisibleChange(event, state, item.legend, 'legend')}
											/>
										}
										label={
											<FormattedMessage
												id="StreamChartProperties.legend"
												defaultMessage="Legend"
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
							{
								item.series.map((series, index) => (
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
											fontSize='9pt'
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
								))
							}
						</div>
					) : null}
					{selection && (selection.element === 'xAxis' || (selection.element === 'yAxis')) ? (
						<div>
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
											marginBottom: '7px'
										}}
									>
										Visible
									</FormLabel>
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
												defaultMessage="Axis title"
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
								</FormGroup>
							</FormControl>
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
