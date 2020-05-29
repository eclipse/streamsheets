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
	query Machines($scope: ScopeInput!){
		scoped(scope: $scope){
			machines {
				id
				name
			}
		}
	}
`;

export const dashboardQuery = `
	query DashBoard($scope: ScopeInput!) {
		scoped(scope: $scope) {
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
	}
`;

export function updateMachines() {
	return gatewayClient
		.graphql(dashboardQuery, { scope: store.getState().user.user.scope } )
		.then(({ scoped: { machines } }) => store.dispatch(receiveMachines(machines)));
}

export function getMachines(query = defaultQuery, queryParams = { scope: store.getState().user.user.scope }) {
	return (dispatch) => {
		dispatch(fetchMachines());
		return gatewayClient
			.graphql(query, queryParams)
			.then(({ scoped: { machines } }) => dispatch(receiveMachines(machines)));
	};
}
