import PropTypes from 'prop-types';
import React, { useState } from 'react';
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
import { useGraphQL } from '../../helper/Hooks';
import { Path } from '../../helper/Path';

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
				textDecoration: 'unset'
			}}
			to={Path.machine(machine.id)}
			key={machine.id}
		>
			<ListItem button onClick={onClick}>
				<ListItemText style={{ width: '95%' }} primary={`${machine.name}`} />
				<ListItemIcon style={{ width: '5%' }}>{getColorForMachineState(machine.state)}</ListItemIcon>
			</ListItem>
			<Divider />
		</Link>
	));

const QUERY = `query Machines($scope: ScopeInput!) {
	scoped(scope: $scope) {
		machines {
			name
			id
			state
			metadata {
				lastModified
			}
		}
	}
}`;

function MachineList(props) {
	const { onItemClick } = props;
	const { data, loading } = useGraphQL(QUERY, { scope: { id: props.scopeId } }, [props.scopeId]);
	const [sorted, setSorted] = useState([]);

	const machines = data ? data.scoped.machines : [];
	return (
		<div>
			<div
				style={{
					margin: '20px 0px 0px 0px',
					textAlign: 'right'
				}}
			>
				{!loading && (
					<SortSelector
						onSort={(event, sortedResources) => setSorted(sortedResources)}
						getResources={() => machines}
						defaultSortBy="name"
						defaultSortDir="asc"
					/>
				)}
			</div>
			<div
				style={{
					height: '480px',
					overflowY: 'auto'
				}}
			>
				<List dense>{loading ? getPlaceholder() : buildList(sorted, onItemClick)}</List>
			</div>
		</div>
	);
}
MachineList.propTypes = {
	onItemClick: PropTypes.func
};
MachineList.defaultProps = {
	onItemClick: () => {}
};
function mapStateToProps(state) {
	return { scopeId: state.user.user.scope ? state.user.user.scope.id : null };
}
export default connect(mapStateToProps)(MachineList);
