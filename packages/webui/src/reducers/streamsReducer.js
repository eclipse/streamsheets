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
import { ArrayUtil } from '@cedalo/util';
import * as ActionTypes from '../constants/ActionTypes';
import StreamHelper from '../helper/StreamHelper';
import AdminConstants from '../constants/AdminConstants';
import { graphManager } from '../GraphManager';

const defaultState = {
	providers: [],
	connectors: [],
	consumers: [],
	producers: [],
	fetching: false,
	fetched: false,
	statusMap: {}
};

export default (state = defaultState, action) => {
	switch (action.type) {
		case ActionTypes.RECEIVE_STREAMS: {
			const streams = action.data.streams ? action.data.streams.slice(0) : [];
			const providers = streams.filter((stream) => stream.className === 'ProviderConfiguration');
			const connectors = streams.filter((stream) => stream.className === 'ConnectorConfiguration');
			const consumers = streams.filter(
				(stream) => stream.className === AdminConstants.CONFIG_CLASS.ConsumerConfiguration
			);
			const producers = streams.filter((stream) => stream.className === 'ProducerConfiguration');
			const statusMap = Object.fromEntries([...producers, ...consumers].map((c) => [c.id, c.state]));

			return {
				...state,
				statusMap,
				providers,
				connectors,
				consumers,
				producers,
				fetching: false,
				fetched: true
			};
		}
		case ActionTypes.STREAM_CONTROL_EVENT: {
			let newState = state;
			const { stream } = action.event.data;
			let { config } = action.event.data;
			let streamEventType = action.event.streamEventType.toLowerCase();
			if (streamEventType === 'provide_warning') {
				streamEventType = 'dispose';
			}
			if (!config) {
				const configs = [...state.connectors, ...state.consumers, ...state.producers];
				config = configs.find((c) => c.id === stream.id);
				config = config ? { ...config, state: stream.state } : config;
			}
			let statusChange = false;
			if (streamEventType === 'delete') {
				newState = {
					...newState,
					providers: newState.providers.filter((p) => p.id !== config.id),
					connectors: newState.connectors.filter((p) => p.id !== config.id),
					consumers: newState.consumers.filter((p) => p.id !== config.id),
					producers: newState.producers.filter((p) => p.id !== config.id)
				};
				statusChange = true;
			} else if (config) {
				const streamType = StreamHelper.getPageFromClass(config.className);
				if (streamType) {
					newState = {
						...newState,
						[streamType]: ArrayUtil.updateWhere(newState[streamType], config, (e) => e.id === config.id)
					};
					statusChange = true;
				}
			}

			if (statusChange) {
				newState = {
					...newState,
					statusMap: Object.fromEntries(
						[...newState.producers, ...newState.consumers].map((c) => [c.id, c.state])
					)
				};
				// TODO: Move to headles component
				graphManager.streamsStatusMap = newState.statusMap;
			}
			return newState;
		}
		case 'FETCH_STREAMS': {
			return Object.assign({}, state, {
				fetching: true
			});
		}
		default: {
			return state;
		}
	}
};
