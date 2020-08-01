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
/* eslint-disable react/no-unused-state */
/* eslint-disable react/prop-types */
import React from 'react';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import Slider from 'rc-slider';
import Divider from '@material-ui/core/Divider';
import { FormattedMessage } from 'react-intl';
import 'rc-slider/assets/index.css';
// Icons
import PlayIcon from '@material-ui/icons/PlayArrow';
import SpeedIcon from '@material-ui/icons/Update';
import StepForwardIcon from '@material-ui/icons/SkipNext';
import StopIcon from '@material-ui/icons/Stop';
import PauseIcon from '@material-ui/icons/Pause';
import ShutdownIcon from '@material-ui/icons/Close';
import { connect } from 'react-redux';
import IconButton from '@material-ui/core/IconButton';
import Gauge from 'react-svg-gauge';

import CustomTooltip from '../base/customTooltip/CustomTooltip';
import { accessManager } from '../../helper/AccessManager';
import * as Actions from '../../actions/actions';
import MachineHelper from '../../helper/MachineHelper';
import gatewayClient from '../../helper/GatewayClient';

const { RESOURCE_ACTIONS } = accessManager;

const minSpeed = 525; // equals 10ms for the logarithmic slider
const maxSpeed = 10000; // equals 10000ms for the logarithmic slider
const powerSpeed = 6;
const transformSpeed = (value) =>
	Math.ceil(((Math.exp((powerSpeed * value) / maxSpeed) - 1) / (Math.exp(powerSpeed) - 1)) * maxSpeed);
const reverseSpeed = (value) =>
	(1 / powerSpeed) * Math.log(((Math.exp(powerSpeed) - 1) * value) / maxSpeed + 1) * maxSpeed;

const minUpdateInterval = 1;
const maxUpdateInterval = 1000;
const powerUpdateInterval = 5;
const transformUpdateInterval = (value) =>
	Math.ceil(
		((Math.exp((powerUpdateInterval * value) / maxUpdateInterval) - 1) / (Math.exp(powerUpdateInterval) - 1)) *
			maxUpdateInterval,
	);
const reverseUpdateInterval = (value) =>
	(1 / powerUpdateInterval) *
	Math.log(((Math.exp(powerUpdateInterval) - 1) * value) / maxUpdateInterval + 1) *
	maxUpdateInterval;

class MachineControlBar extends React.Component {
	static getDerivedStateFromProps(props, state) {
		return { ...state, speed: props.cycletime };
	}

	constructor(props) {
		super(props);
		const streamsheetStepInterval = localStorage.getItem('streamSheetStepInterval');
		this.state = {
			speedOpen: false,
			speed: 1000,
			streamsheetStepInterval: streamsheetStepInterval || 1,
			streamsheetStepIntervalOpen: false,
		};
	}

	onStart = async () => {
		const cycleTime = this.state.speed;
		await this.props.setCycleTime(this.props.machineId, cycleTime);
		this.props.start(this.props.machineId);
	};

	onStopMachine = () => {
		if (this.props.isConnected && this.props.machineState !== 'stopped') {
			this.props.stop(this.props.machineId);
		}
	};

	onPauseMachine = () => {
		this.props.pause(this.props.machineId);
	};

	onStepMachine = () => {
		if (this.props.isConnected && this.props.machineState !== 'running') {
			this.props.step(this.props.machineId);
		}
	};

	onShutdownMachine = () => {
		if (this.props.machineId) {
			// eslint-disable-next-line
			if (confirm('Are you sure that this machine should be removed?')) {
				gatewayClient.unloadMachine(this.props.machineId).then(() => {
					window.close();
				});
			}
		}
	}

	onChangeSpeed = (intervalInMilliseconds) => {
		intervalInMilliseconds = transformSpeed(intervalInMilliseconds);
		this.setState({
			speed: intervalInMilliseconds,
		});
		this.props.setCycleTime(this.props.machineId, intervalInMilliseconds);
	};

	onShowSpeed = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			speedOpen: true,
			anchorEl: event.currentTarget,
		});
	};

	onSpeedClose = () => {
		this.setState({
			speedOpen: false,
		});
	};

	onChangeStreamSheetStepInterval = (streamsheetStepInterval) => {
		streamsheetStepInterval = transformUpdateInterval(streamsheetStepInterval);
		this.setState({
			streamsheetStepInterval,
		});
		this.props.setStreamSheetStepInterval(this.props.machineId, streamsheetStepInterval);
	};

	onShowStreamSheetStepInterval = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			streamsheetStepIntervalOpen: true,
			anchorEl: event.currentTarget,
		});
	};

	onStreamSheetStepIntervalClose = () => {
		this.setState({
			streamsheetStepIntervalOpen: false,
		});
	};

	showStreamSheetStepIntervalDialog = () => {
		this.setState({
			showStreamsheetStepIntervalDialog: true,
		});
	};

	handleSpeed = (intervalInMilliseconds) => () => {
		this.setState({ speed: intervalInMilliseconds });
		this.props.setCycleTime(this.props.machineId, intervalInMilliseconds);
	};

	handleStreamSheetStepInterval = (streamsheetStepInterval) => () => {
		this.setState({ streamsheetStepInterval });
		this.props.setStreamSheetStepInterval(this.props.machineId, streamsheetStepInterval);
	};

	render() {
		function getGaugeColor(value, max) {
			if (value > max) {
				value = max;
			}
			value /= max;
			const hue = ((1 - value) * 120).toString(10);
			return ['hsl(', hue, ',100%,50%)'].join('');
		}
		if (this.props.disabled) return null;
		return (
			<div
				style={{
					alignItems: 'center',
					display: 'flex',
					minHeight: '10px'
				}}
			>
				<Toolbar>
					<div
						style={{
							display: 'flex'
						}}
					>
						<CustomTooltip header="Tooltip.StopHeader" message="Tooltip.StopMessage">
							<div>
								<IconButton
									aria-label="Stop"
									color="inherit"
									style={{ color: `rgba(255, 255, 255, ${this.props.disabled || this.props.machineState === 'stopped' ? 0.3 : 1})` }}
									disabled={this.props.disabled || this.props.machineState === 'stopped'}
									onClick={this.onStopMachine}
								>
									<StopIcon />
								</IconButton>
							</div>
						</CustomTooltip>
						<CustomTooltip header="Tooltip.PauseHeader" message="Tooltip.PauseMessage">
							<div>
								<IconButton
									color="inherit"
									disabled={
										this.props.disabled ||
										this.props.machineState === 'stopped' ||
										this.props.machineState === 'paused'
									}
									style={{ color: `rgba(255, 255, 255, ${this.props.disabled || this.props.machineState === 'stopped'  ||
										this.props.machineState === 'paused' ? 0.3 : 1})` }}
									onClick={this.onPauseMachine}
								>
									<PauseIcon />
								</IconButton>
							</div>
						</CustomTooltip>
						<CustomTooltip header="Tooltip.StartHeader" message="Tooltip.StartMessage">
							<div>
								<IconButton
									color="inherit"
									style={{ color: `rgba(255, 255, 255, ${this.props.disabled || this.props.machineState === 'running' ? 0.3 : 1})` }}
									disabled={this.props.disabled || this.props.machineState === 'running'}
									onClick={this.onStart}
								>
									<PlayIcon />
								</IconButton>
							</div>
						</CustomTooltip>
						<CustomTooltip header="Tooltip.StepHeader" message="Tooltip.StepMessage">
							<div>
								<IconButton
									color="inherit"
									style={{ color: `rgba(255, 255, 255, ${this.props.disabled || this.props.machineState === 'running' ? 0.3 : 1})` }}
									disabled={this.props.disabled || this.props.machineState === 'running'}
									onClick={this.onStepMachine}
								>
									<StepForwardIcon />
								</IconButton>
							</div>
						</CustomTooltip>
					</div>
					<div
						style={{
							marginLeft: '15px',
							textAlign: 'right'
						}}
					>
						<CustomTooltip
							header="Tooltip.CycleTimeHeader"
							message="Tooltip.CycleTimeMessage"
							messageValues={{ speed: this.state.speed, interval: this.state.streamsheetStepInterval }}
						>
							<div
								style={{
									display: 'inline'
								}}
							>
								<IconButton
									color="inherit"
									onClick={this.onShowSpeed}
									style={{ color: 'white' }}
								>
									<SpeedIcon />
								</IconButton>
							</div>
						</CustomTooltip>
					</div>
					<div
						style={{
							marginLeft: '10px',
							visibility: this.props.experimental ? 'visible' : 'hidden'
						}}
					>
						<CustomTooltip header="Tooltip.ShutdownMachineHeader" message="Tooltip.ShutdownMachineMessage">
							<IconButton
								color="inherit"
								disabled={!this.props.debug}
								onClick={this.onShutdownMachine}
							>
								<ShutdownIcon />
							</IconButton>
						</CustomTooltip>
					</div>
				</Toolbar>
				<Popover
					open={this.state.speedOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					targetOrigin={{ horizontal: 'right', vertical: 'top' }}
					onClose={this.onSpeedClose}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={7}
						cellHeight={30}
						spacing={2}
						style={{
							width: '300px',
							margin: '0px',
							padding: '8px'
						}}
					>
						<GridListTile
							cols={7}
							style={{
								padding: '2px',
								textAlign: 'center'
							}}
						>
							<Typography style={{fontSize: '10pt'}} variant='h6' color="textPrimary">
								<FormattedMessage
									id="MachineControl.cycleTime"
									defaultMessage="Cycle Time: {speed}ms"
									values={{ speed: this.state.speed }}
								/>
							</Typography>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleSpeed(10)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								10
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleSpeed(20)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								20
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleSpeed(50)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								50
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleSpeed(100)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								100
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleSpeed(200)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								200
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleSpeed(500)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								500
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleSpeed(1000)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								1000
							</Button>
						</GridListTile>
						<GridListTile style={{height: '20px'}} cols={7}>
							<Slider
								step={1}
								value={reverseSpeed(this.state.speed)}
								min={this.props.experimental ? 1 : minSpeed}
								max={maxSpeed}
								onChange={this.onChangeSpeed}
							/>
						</GridListTile>
					</GridList>
					<Divider />
					<GridList
						cols={7}
						cellHeight={30}
						spacing={2}
						style={{
							width: '300px',
							margin: '0px',
							padding: '8px'
						}}
					>
						<GridListTile
							cols={7}
							style={{
								padding: '2px',
								textAlign: 'center'
							}}
						>
							<Typography style={{fontSize: '10pt'}} variant='h6' color="textPrimary">
								<FormattedMessage
									id="MachineControl.updateInterval"
									defaultMessage="Update Interval: {interval}"
									values={{ interval: this.state.streamsheetStepInterval }}
								/>
								</Typography>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleStreamSheetStepInterval(1)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								1
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleStreamSheetStepInterval(2)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								2
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleStreamSheetStepInterval(5)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								5
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleStreamSheetStepInterval(10)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								10
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleStreamSheetStepInterval(20)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								20
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleStreamSheetStepInterval(50)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								50
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={this.handleStreamSheetStepInterval(100)}
								style={{
									padding: '0px',
									minWidth: '40px'
								}}
								variant="outlined"
								size="small"
							>
								100
							</Button>
						</GridListTile>
						<GridListTile style={{height: '20px'}} cols={7}>
							<Slider
								step={1}
								value={reverseUpdateInterval(this.state.streamsheetStepInterval)}
								min={minUpdateInterval}
								max={maxUpdateInterval}
								onChange={this.onChangeStreamsheetStepInterval}
							/>
						</GridListTile>
					</GridList>
					<Divider />
					<GridList
						cols={6}
						cellHeight={25}
						spacing={1}
						style={{
							width: '100%',
							margin: '0px',
							paddingTop: '10px'
						}}
					>
						<GridListTile
							cols={6}
							style={{
								padding: '2px',
								textAlign: 'center'
							}}
						>
							<Typography style={{fontSize: '10pt'}} variant='h6' color="textPrimary">
								<FormattedMessage id="MachineControl.updates" defaultMessage="Updates/sec." />
							</Typography>
						</GridListTile>
						<GridListTile
							cols={3}
							style={{
								padding: '2px',
								height: '20px',
								textAlign: 'center'
							}}
						>
							<Typography color="textPrimary">
							<FormattedMessage id="MachineControl.client" defaultMessage="Client" />
							</Typography>
						</GridListTile>
						<GridListTile
							cols={3}
							style={{
								padding: '2px',
								height: '20px',
								textAlign: 'center'
							}}
						>
							<Typography color="textPrimary">
							<FormattedMessage id="MachineControl.server" defaultMessage="Server" />
							</Typography >
						</GridListTile>
					</GridList>
					<div
						style={{
							height: '140px',
							marginTop: '-30px',
						}}
					>
						<Gauge
							value={this.props.clientUpdateRate}
							min={0}
							max={25}
							width={158}
							height={130}
							label=""
							color={getGaugeColor(this.props.clientUpdateRate, 25)}
						/>
						<Gauge
							value={this.props.machineCyclesPerSecond}
							min={0}
							max={1000}
							width={158}
							height={130}
							label=""
							color={getGaugeColor(this.props.machineCyclesPerSecond, 1000)}
						/>
					</div>
				</Popover>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		experimental: state.appState.experimental,
		debug: state.appState.debug,
		machineId: state.monitor.machine.id,
		machineState: state.monitor.machine.state,
		machineCyclesPerSecond: state.monitor.performance.cyclesPerSecond,
		clientUpdateRate: state.monitor.performance.events.size,
		isConnected: state.monitor.isConnected,
		cycletime: state.monitor.cycletime,
		disabled: !state.monitor.machine.id || !MachineHelper.currentMachineCan(RESOURCE_ACTIONS.CONTROL),
		adminSecurity: state.adminSecurity,
	};
}

const mapDispatchToProps = Actions;

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(MachineControlBar);
