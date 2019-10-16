import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { FormattedMessage } from 'react-intl';
import PlayIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import PauseIcon from '@material-ui/icons/Pause';
import CircleIcon from '@material-ui/icons/Brightness1';
import { Link } from 'react-router-dom';

import Divider from '@material-ui/core/Divider';
import SortSelector from '../base/sortSelector/SortSelector';

const getColorForMachineState = (state) => {
	switch (state) {
		case 'running':
			return <PlayIcon aria-label="running" />;
		case 'stopped':
			return <StopIcon aria-label="stopped" />;
		case 'paused':
			return <PauseIcon aria-label="paused" />;
		default:
			return <CircleIcon aria-label="unknown" />;
	}
};

const getPlaceholder = () => (
	<ListItem>
		<ListItemText
			primary={<FormattedMessage id="Placeholder.noMachinesAvailable" defaultMessage="No Machines Available" />}
		/>
	</ListItem>
);
const buildList = (machines, onClick) =>
	machines.map((machine) => (
		// eslint-disable-next-line jsx-a11y/anchor-is-valid
		<Link
			style={{
				textDecoration: 'unset',
			}}
			to={`/machines/${machine.id}`}
			key={machine.id}
		>
			<ListItem button onClick={onClick}>
				<ListItemText style={{ width: '95%' }} primary={`${machine.name}`} />
				<ListItemIcon style={{ width: '5%' }}>{getColorForMachineState(machine.state)}</ListItemIcon>
			</ListItem>
			<Divider />
		</Link>
	));

class MachineList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			sortedResources: props.machines.isFetching || props.machines.receivedAt === 0 ? [] : props.machines.data,
		};
	}

	getResources = () => {
		const { machines } = this.props;
		return machines.isFetching || machines.receivedAt === 0 ? [] : machines.data;
	};

	handleSort = (event, sortedResources) => {
		this.setState({
			sortedResources,
		});
	};

	render() {
		const { onItemClick, machines } = this.props;
		const { sortedResources } = this.state;
		return (
			<div>
				<div
					style={{
						margin: '20px 0px 0px 0px',
						textAlign: 'right',
					}}
				>
					<SortSelector
						onSort={this.handleSort}
						getResources={this.getResources}
						defaultSortBy="name"
						defaultSortDir="asc"
					/>
				</div>
				<div
					style={{
						height: '480px',
						overflowY: 'auto',
					}}
				>
					<List dense>
						{machines.isFetching || machines.receivedAt === 0
							? getPlaceholder()
							: buildList(sortedResources, onItemClick)}
					</List>
				</div>
			</div>
		);
	}
}
MachineList.propTypes = {
	// eslint-disable-next-line
	machines: PropTypes.object,
	onItemClick: PropTypes.func,
};
MachineList.defaultProps = {
	onItemClick: () => {},
};
function mapStateToProps(state) {
	// messages from state
	return { machines: state.machines };
}
export default connect(mapStateToProps)(MachineList);
