import * as ActionTypes from '../constants/ActionTypes';
import gatewayClient from '../helper/GatewayClient';
import store from '../store';

const receiveMachines = (machines) => ({
	type: ActionTypes.RECEIVE_MACHINES,
	machines,
	receivedAt: Date.now()
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
			name
			id
			metadata {
				lastModified
				owner
			}
			previewImage
			titleImage
			streamsheets {
				name
				inbox {
					stream {
						name
					}
				}
			}
			state
		}
	}
`;

export function updateMachines() {
	return gatewayClient.graphql(dashboardQuery).then(({ machines }) => store.dispatch(receiveMachines(machines)));
}

export function getMachines(query = defaultQuery) {
	return (dispatch) => {
		dispatch(fetchMachines());
		return gatewayClient.graphql(query).then(({ machines }) => dispatch(receiveMachines(machines)));
	};
}
