/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/prop-types */
import React from 'react';
// import * as Colors from '@material-ui/core/colors';
// import {
// 	Delete as DeleteIcon,
// 	PlayArrow as PlayIcon,
// 	Stop as StopIcon,
// 	Pause as PauseIcon,
// } from '@material-ui/icons';
// import IconButton from '@material-ui/core/IconButton';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import {
	Link,
} from 'react-router-dom';

import * as Actions from '../../actions/actions';

const getPlaceholder = () => <TableRow />;

class MachineTableComponent extends React.Component {

	componentWillReceiveProps(nextProps) {
		this.setState({
			// eslint-disable-next-line react/no-unused-state
			monitor: nextProps.monitor,
		});
	}

	onStartMachine = (machine) => {
		if (this.props.monitor.isConnected) {
			if (machine.state !== 'running') {
				this.props.start(machine.id);
			}
		}
	}

	onStopMachine = (machine) => {
		if (this.props.monitor.isConnected) {
			if (machine.state !== 'stopped') {
				this.props.stop(machine.id);
			}
		}
	}

	onPauseMachine = (machine) => {
		if (this.props.monitor.isConnected) {
			if (machine.state === 'running') {
				this.props.pause(machine.id);
			}
		}
	}

	onDeleteMachine = (machine) => {
		if (this.props.monitor.isConnected) {
			if (machine.state === 'stopped') {
				this.props.deleteMachine(machine.id);
			}
		}
	}

	buildTable(machines) {
		return machines.map(machine => (
			<TableRow key={machine.id}>
				<TableCell>
					<Link
						to={`/machines/${machine.id}`}
						key={machine.id}
					>
						{machine.name}
					</Link>
				</TableCell>
				<TableCell>{machine.state}</TableCell>
				<TableCell>{machine.id}</TableCell>
				{/* <TableCell>
					<IconButton
						disabled={machine.state === 'running'}
						onClick={() => this.onStartMachine(machine)}
					>
						<PlayIcon
							color={Colors.grey[900]}
						/>
					</IconButton>
					<IconButton
						disabled={machine.state === 'stopped'}
						onClick={() => this.onStopMachine(machine)}
					>
						<StopIcon
							color={Colors.grey[900]}
						/>
					</IconButton>
					<IconButton
						disabled={machine.state === 'paused'}
						onClick={() => this.onPauseMachine(machine)}
					>
						<PauseIcon
							color={Colors.grey[900]}
						/>
					</IconButton>
					<IconButton
						disabled={machine.state !== 'stopped'}
						onClick={() => this.onDeleteMachine(machine)}
					>
						<DeleteIcon
							color={Colors.grey[900]}
						/>
					</IconButton>
				</TableCell> */}
			</TableRow>));
	}

	render() {
		return (
			<Table
				style={{
					position: 'absolute',
					top: '60px',
				}}
			>
				<TableHead
					style={{
						fontSize: '1.3rem',
					}}
				>
					<TableRow>
						<TableCell>Name</TableCell>
						<TableCell>State</TableCell>
						<TableCell>ID</TableCell>
						{/* <TableCell>Actions</TableCell> */}
					</TableRow>
				</TableHead>
				<TableBody
					style={{
						fontSize: '1.3rem',
					}}
				>
					{
						this.props.machines.isFetching || this.props.machines.receivedAt === 0 ? getPlaceholder() :
							this.buildTable(this.props.machines.data || [])
					}
				</TableBody>
			</Table>
		);
	}
}

function mapStateToProps(state) {
	return {
		machines: state.machines,
		monitor: state.monitor,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MachineTableComponent);
