import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';

import StreamHelper from '../../helper/StreamHelper';
import SortSelector from '../base/sortSelector/SortSelector';

export const StreamSelector = (props) => {
	const { streams = {}, disabled, value } = props;
	const intialResources = SortSelector.sort(streams.slice(), 'name_asc');

	const [filter ] = useState('');
	const [resources, setResources] = useState(intialResources);
	const getStreams = () => streams;

	useEffect(() => {
		setResources(props.streams);
	}, props.streams);

	const handleSort = (event, sortedResources) => setResources(sortedResources);
	const handleChange = (event) => {
		const id = event.target.value;
		const stream = streams.find(s => s.id === id);
		props.onChange(stream, event);
	};

	const handleNewConsumer = () => {
		window.open(`/administration/consumers`);
	};

	return (<div>
		<div style={{
			textAlign: 'right',
			marginBottom: '5px',
		}}>
			<SortSelector
				onSort={handleSort}
				getResources={getStreams}
				label={<FormattedMessage id="NoStream" defaultMessage="None"/>}
			/>
		</div>
		<FormControl
			disabled={disabled}
		>
			<InputLabel htmlFor="ProcessContainerSettings.stream">
				<FormattedMessage
					id="ProcessContainerSettings.stream"
					defaultMessage="Stream"
				/>
			</InputLabel>
			<Select
				style={{
					width: '380px',
				}}
				input={
					<Input name="ProcessContainerSettings.stream"
					       id="ProcessContainerSettings.stream"/>
				}
				value={value? value.id: ""}
				onChange={handleChange}
			>
				{ filter !=='' ? null : <MenuItem value="none" key="none">
					<FormattedMessage id="NoStream" defaultMessage="None"/>
				</MenuItem>
				}

				{resources.map((stream) => (
					<MenuItem value={stream.id} key={stream.id}>
						<span style={{width: '450px'}}>{stream.name}&nbsp;</span>
						<img style={{float: 'right'}} width={15} height={15} src={StreamHelper.getIconForState(stream.state)} alt="state"/>
					</MenuItem>
				))}
			</Select>
		</FormControl>
		<Button
			style={{
				paddingLeft: '24px',
				paddingTop: '18px',
			}}
			onClick={handleNewConsumer} color="primary">
			<FormattedMessage id="Dashboard.addConsumer"
			                  defaultMessage="Add new consumer"/>
		</Button>
	</div>);

};

StreamSelector.propTypes = {
	onChange: PropTypes.func,
	value: PropTypes.shape({
		id: PropTypes.string,
		name: PropTypes.string,
		state: PropTypes.string,
	}),
	streams: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string,
		name: PropTypes.string,
		state: PropTypes.string,
	})),
	disabled: PropTypes.bool,
};

StreamSelector.defaultProps = {
	onChange: () => {},
	value: undefined,
	streams: [],
	disabled: false,
};

export default StreamSelector;
