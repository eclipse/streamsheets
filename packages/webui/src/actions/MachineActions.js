import * as ActionTypes from '../constants/ActionTypes';
import gatewayClient from '../helper/GatewayClient';
import store from '../store';

const receiveMachines = (machines) => ({
	type: ActionTypes.RECEIVE_MACHINES,
	machines,
	receivedAt: Date.now(),
});

const fetchMachines = () => ({ type: ActionTypes.FETCH_MACHINES });

const defaultQuery = `
  {
		machines {
			id
			name
		}
  }
`;

export const dashboardQuery = `
  {
		machines {
			id
			name
			previewImage
		}
  }
`;

export function updateMachines() {
	return gatewayClient.getMachineDefinitions(dashboardQuery).then((machines) => store.dispatch(receiveMachines(machines)));
}

export function getMachines(query = defaultQuery) {
	return (dispatch) => {
		dispatch(fetchMachines());
		return gatewayClient.getMachineDefinitions(query).then((machines) => dispatch(receiveMachines(machines)));
	};
}
