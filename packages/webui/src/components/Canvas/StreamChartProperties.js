/* eslint-disable react/prop-types, react/forbid-prop-types */
/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
// import Checkbox from '@material-ui/core/Checkbox';
// import TextField from '@material-ui/core/TextField';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import ExpansionPanel from '@material-ui/core/ExpansionPanel';
// import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
// import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
// import Tabs from '@material-ui/core/Tabs';
// import Tab from '@material-ui/core/Tab';
// import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import { FormattedMessage } from 'react-intl';
// import MenuItem from '@material-ui/core/MenuItem';
// import InputLabel from '@material-ui/core/InputLabel';
// import Input from '@material-ui/core/Input';
// import Divider from '@material-ui/core/Divider';
// import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import JSG from '@cedalo/jsg-ui';
import Slide from '@material-ui/core/Slide';

import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';

export class StreamChartProperties extends Component {
	constructor(props) {
		super(props);
		this.escFunction = this.escFunction.bind(this);
	}

	state = {
		plotView: undefined,
		legendPosition: 'all'
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
			plotView: view,
		});
	}

	handleClose = () => {
		this.props.setAppState({ showStreamChartProperties: false });
	};

	render() {
		// const { expanded } = this.state;
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
							<FormattedMessage id="StreamchartProperties.title" defaultMessage="Streamchart Properties" />
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
						<RadioGroup
							name="type"
							value={this.state.legendPosition}
							onChange={(event, state) => { this.setState({ legendPosition: state }); }}
							style={{
								marginTop: '20px',
							}}
						>
							<FormControlLabel
								value="all"
								control={<Radio />}
								label={<FormattedMessage id="DialogDelete.complete" defaultMessage="Left" />}
							/>
							<FormControlLabel
								value="values"
								control={<Radio />}
								label={<FormattedMessage id="DialogDelete.values" defaultMessage="Top" />}
							/>
							<FormControlLabel
								value="formats"
								control={<Radio />}
								label={<FormattedMessage id="DialogDelete.formats" defaultMessage="Right" />}
							/>
						</RadioGroup>
					</FormControl>
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
