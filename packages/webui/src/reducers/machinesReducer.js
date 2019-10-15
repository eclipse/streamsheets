import * as Actions from '../constants/ActionTypes';

const defaultMachinesState = {
	isFetching: false,
	fetched: false,
	data: [],
};

export default function machinesReducer(state = defaultMachinesState, action) {
	switch (action.type) {
	case Actions.RECEIVE_MACHINES:
		return {
			...state,
			isFetching: false,
			fetched: true,
			data: action.machines,
		};
	case Actions.RECEIVE_MACHINE_CLONE: {
		const {response} = action;
		if(response && response.machine && response.imported) {
			const newMachine = response.machine;
			state.data.push(newMachine);
		}
		return {
			...state,
		};
	}
	case Actions.RECEIVE_DELETE_MACHINE:
		return {
			data: state.data.filter(m => m.id !== action.machineId),
		};
	case Actions.SET_MACHINE: {
		const m = action.machine;
		const data = state.data.map((machine) => {
			if (machine.id === m.id) {
				return m;
			}
			return machine;
		});
		return {
			...state,
			data,
		};
	}
	case Actions.STREAM_CONTROL_EVENT: {
		const streamId = action.event.data.stream.id;
		const { streamEventType } = action.event;
		if (streamEventType === 'UPDATE') {
			const machines = state.data.map((machine) => {
				machine.streamsheets = machine.streamsheets.map((streamsheet) => {
					if (streamsheet.inbox.stream && streamsheet.inbox.stream.id === streamId) {
						streamsheet.inbox.stream = { ...action.event.data.stream };
					}
					return streamsheet;
				});
				return machine;
			});
			return { ...state, data: machines };
		}
		return { ...state };
	}
	default:
		return state;
	}
}
