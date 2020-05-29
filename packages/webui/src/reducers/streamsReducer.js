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
import jp from 'jsonpath';
import * as ActionTypes from '../constants/ActionTypes';
import * as WsMessageTypes from '../constants/WebsocketMessageTypes';
import StreamHelper from '../helper/StreamHelper';
import AdminConstants from '../constants/AdminConstants';
import { graphManager } from '../GraphManager';

const sortEvents = (event1, event2) => {
	if (new Date(event1.timestamp) < new Date(event2.timestamp)) return 1;
	if (new Date(event1.timestamp) > new Date(event2.timestamp)) return -1;
	return 0;
};

const isNotDisabled = p => p.disabled !== true;
const updateProgress = (sources, statusMap) => (p) => {
	if (
		isNotDisabled(p) &&
		sources.includes(p.name) &&
		StreamHelper.getResourceState(p, statusMap) !== StreamHelper.NO_STREAM
	) {
		return { ...p, progressing: true };
	}
	return p;
};

const updateStateWithConfig = (newState, config) => {
	switch (config.className) {
		case 'ProviderConfiguration': {
			let isNew = true;
			newState.providers = newState.providers.map((p) => {
				if (p.id === config.id) {
					isNew = false;
					return { ...config };
				}
				return p;
			});
			if (isNew) {
				newState.providers.push({ ...config });
			}
			break;
		}
		case 'ConnectorConfiguration': {
			let isNew = true;
			newState.connectors = newState.connectors.map((p) => {
				if (p.id === config.id) {
					isNew = false;
					return { ...config };
				}
				return p;
			});
			if (isNew) {
				newState.connectors.push({ ...config });
			}
			break;
		}
		case AdminConstants.CONFIG_CLASS.ConsumerConfiguration: {
			let isNew = true;
			newState.consumers = newState.consumers.map((p) => {
				if (p.id === config.id) {
					isNew = false;
					return { ...config };
				}
				return p;
			});
			if (isNew) {
				newState.consumers.push({ ...config });
			}
			break;
		}
		case 'ProducerConfiguration': {
			let isNew = true;
			newState.producers = newState.producers.map((p) => {
				if (p.id === config.id) {
					isNew = false;
					return { ...config };
				}
				return p;
			});
			if (isNew) {
				newState.producers.push({ ...config });
			}
			break;
		}
		default:
	}
	return newState;
};

const defaultState = {
	providers: [],
	connectors: [],
	consumers: [],
	producers: [],
	fetching: false,
	fetched: false,
	dirty: false,
	activeConfigurationId: 0,
	prevState: null,
	savePending: false,
	reloadStreamsPending: false,
	notifiedErrors: [],
	errors: [],
	error: '',
	controlEvents: [],
	statusMap: {},
	tempConfig: null,
	tempConfiguration: null,
	initialConfig: null,
};
const cloneState = (state) => {
	const newState = Object.assign({}, state);
	if (state.providers) {
		newState.providers =
				state.providers.map(e => Object.assign({}, e));
	}
	if (state.connectors) {
		newState.connectors = state.connectors.map(e => Object.assign({}, e));
	}
	if (state.consumers) {
		newState.consumers = state.consumers.map(e => Object.assign({}, e));
	}
	if (state.producers) {
		newState.producers = state.producers.map(e => Object.assign({}, e));
	}
	if (state.prevState) newState.prevState = Object.assign({}, state.prevState);
	return newState;
};

const updateStream = (stream, state) => {
	const type = StreamHelper.getPageFromClass(stream.className);
	state[type] = state[type].map((s) => {
		if (s.id === stream.id) {
			return stream;
		}
		return s;
	});
	return state;
};

const updateState = (stream, map) => {
	const status = StreamHelper.getResourceState(stream, map, true);
	map[stream.id] = status;
};

export default (state = defaultState, action) => {
	const { configType } = { ...action };
	switch (action.type) {
	case ActionTypes.DS_TOGGLE_PROGRESS: {
		const { stream } = action;
		const newState = cloneState(state);
		updateStream({ ...stream, progressing: !stream.progressing }, newState);
		return {
			...newState,
		};
	}

	case ActionTypes.RECEIVE_STREAMS: {
		const { statusMap } = state;
		const streams = action.data.streams ? action.data.streams.slice(0) : [];
		const providers = streams.filter(stream => stream.className === 'ProviderConfiguration');
		const connectors = streams.filter(stream => stream.className === 'ConnectorConfiguration');
		connectors.forEach(stream => updateState(stream, statusMap));
		const consumers = streams.filter(stream => stream.className === AdminConstants.CONFIG_CLASS.ConsumerConfiguration);
		consumers.forEach(stream => updateState(stream, statusMap));
		const producers = streams.filter(stream => stream.className === 'ProducerConfiguration');
		producers.forEach(stream => updateState(stream, statusMap));
		if(graphManager) {
			graphManager.streamsStatusMap = statusMap;
		}
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
		const newState = cloneState(state);
		const { stream } = action.event.data;
		let { config } = action.event.data;
		const streamId = action.event.data.stream.id;
		let streamEventType = action.event.streamEventType.toLowerCase();
		if (streamEventType === 'provide_warning') {
			streamEventType = 'dispose';
		}
		if (!config) {
			const configs = [...state.connectors, ...state.consumers, ...state.producers];
			if (stream.name) {
				config = configs.find(c => c.name === stream.name);
			} else {
				config = configs.find(c => c.id === stream.id);
			}
		}
		if (config) {
			const DONE_STATES = ['ready', 'connect', 'dispose', 'provide_warning', 'connector_error', 'stream_error'];
			if (DONE_STATES.includes(streamEventType)) {
				config.progressing = false;
				const t = StreamHelper.getPageFromClass(config.className);
				newState[t] = newState[t].map((p) => {
					if (p.id === config.id) {
						const newConfig = { ...config };
						if (newConfig.status && newConfig.status.streamEventType) {
							newConfig.status.streamEventType = streamEventType;
						}
						return newConfig;
					}
					return p;
				});
			}

			if (streamEventType === 'update') {
				switch (config.className) {
					case 'ProviderConfiguration': {
						let isNew = true;
						newState.providers = newState.providers.map((p) => {
							if (p.id === config.id) {
								isNew = false;
								return { ...config };
							}
							return p;
						});
						if (isNew) {
							newState.providers.push({ ...config });
						}
						break;
					}
					case 'ConnectorConfiguration': {
						let isNew = true;
						newState.connectors = newState.connectors.map((p) => {
							if (p.id === config.id) {
								isNew = false;
								return { ...config };
							}
							return p;
						});
						if (isNew) {
							newState.connectors.push({ ...config });
						}
						break;
					}
					case AdminConstants.CONFIG_CLASS.ConsumerConfiguration: {
						let isNew = true;
						newState.consumers = newState.consumers.map((p) => {
							if (p.id === config.id) {
								isNew = false;
								return { ...config };
							}
							return p;
						});
						if (isNew) {
							newState.consumers.push({ ...config });
						}
						break;
					}
					case 'ProducerConfiguration': {
						let isNew = true;
						newState.producers = newState.producers.map((p) => {
							if (p.id === config.id) {
								isNew = false;
								return { ...config };
							}
							return p;
						});
						if (isNew) {
							newState.producers.push({ ...config });
						}
						break;
					}
					default:
				}
			}
			if (streamEventType === 'delete') {
				newState.providers = newState.providers.filter(p => p.id !== config.id);
				newState.connectors = newState.connectors.filter(p => p.id !== config.id);
				newState.consumers = newState.consumers.filter(p => p.id !== config.id);
				newState.producers = newState.producers.filter(p => p.id !== config.id);
			}
		}

		const events = state.controlEvents.slice();
		const event = {
			streamName: stream.name,
			streamId,
			streamEventType,
			timestamp: action.event.data.timestamp,
			data: action.event.data,
			error: action.event.data.error ? action.event.data.error.message : null,
		};
		if (!action.event.hidden) {
			events.push(event);
		}
		const IGNORE_EVENTS = ['update', 'delete', 'provide_warning', 'feedback'];
		if (action.event.streamEventType && !IGNORE_EVENTS.includes(action.event.streamEventType.toLowerCase())) {
			newState.statusMap[stream.id] = action.event.streamEventType.toLowerCase();
		}
		graphManager.streamsStatusMap = newState.statusMap;
		newState.controlEvents = events.sort(sortEvents);
		return newState;
	}
	case ActionTypes.STREAMS_RELOAD_REQUEST: {
		const { sources = [] } = action;
		const newState = {
			...state,
			connectors: state.connectors.map(updateProgress(sources, state.statusMap)),
			consumers: state.consumers.map(updateProgress(sources, state.statusMap)),
			producers: state.producers.map(updateProgress(sources, state.statusMap)),
			controlEvents: [],
			reloadStreamsPending: true,
		};
		return newState;
	}
	case ActionTypes.STREAM_SET_CONFIG: {
		let newState = cloneState(state);
		newState = updateStateWithConfig(newState, action.configuration)
		return newState;
	}
	case ActionTypes.STREAM_INITIAL_SET: {
		const {config} = action;
		return {
			...state,
			initialConfig: {...config}
		};
	}
	case `FETCH_${configType}S_FETCHING`: {
		return Object.assign({}, state, {
			fetching: true,
		});
	}
	case 'FETCH_STREAMS': {
		return Object.assign({}, state, {
			fetching: true,
		});
	}
	case `FETCH_${configType}S_FULFILLED`: {
		return Object.assign({}, state, {
			fetching: false,
			fetched: true,
			[configType]: action.payload.slice(0),
		});
	}
	case `FETCH_${configType}S_REJECTED`: {
		return Object.assign({}, state, {
			fetching: false,
			fetched: false,
			error: action.payload,
		});
	}
	case `${configType}_UPDATE`: {
		const configuration = StreamHelper.getActiveConfiguration(state);
		const type = StreamHelper.getPageFromClass(configuration.className);
		const model = action.payload;
		const newState = cloneState(state);
		newState.prevState = cloneState(state);

		if(model.$set) {
			newState.tempConfig = newState.tempConfig || {
				id: model.id,
				type: model.type,
				error: model.error,
				$set: {}
			};
			newState.tempConfig.error = model.error;
			if( Object.keys(model.$set).length>0) {
				Object.keys(model.$set).forEach((key, index) => {
					const path = `$.${Object.keys(model.$set)[index]}`;
					const val = Object.values(model.$set)[index];
					try {
						jp.value(newState.tempConfig.$set, path, val)
					} catch (e) {
						// /
					}
				});
				newState.tempConfiguration = newState.tempConfiguration || {...configuration};
				Object.keys(newState.tempConfig.$set).forEach((key, index) => {
					const path = `$.${Object.keys(newState.tempConfig.$set)[index]}`;
					const val = Object.values(newState.tempConfig.$set)[index];
					try {
						jp.value(newState.tempConfiguration, path, val)
					} catch (e) {
						// /
					}
				});
			}

		} else {
			newState[type] = newState[type].slice().map((config) => {
				if (config.id === state.activeConfigurationId) {
					return Object.assign({}, model, {progressing: false});
				}
				return config;
			});
		}
		newState.dirty = true;
		return newState;
	}
	case `${configType}_SET_ACTIVE`: {
		const { id } = action.payload;
		return Object.assign({}, state, {
			activeConfigurationId: id,
			tempConfiguration: null,
			tempConfig: null,
			configType,
			errors: [],
			dirty: false,
		});
	}
	case 'DS_DELETE_ACTIVE': {
		const newState = cloneState(state);
		newState.tempConfiguration = null;
		newState.error = null;
		newState.dirty = false;
		newState.tempConfig = null;
		newState.savePending = false;
		newState.initialConfig = null;
		/*
		const configuration = StreamHelper.getActiveConfiguration(state);
		const type = StreamHelper.getPageFromClass(configuration.className);
		const prevState = cloneState(state);
		prevState.prevState = null;
		newState.prevState = prevState;
		newState.activeConfigurationId = 0;
		const index = newState[type].findIndex(c => c.id === configuration.id);
		newState[type].splice(index, 1);
		if (index > 0) {
			newState.activeConfigurationId = newState[type][index - 1].id;
		}
		newState.dirty = false;
		*/
		return newState;
	}
	case `${configType}_NEW_CONFIG`: {
		const newConfiguration = action.payload;
		const prevState = cloneState(state);
		prevState.prevState = null;
		const newState = cloneState(state);
		newState.prevState = prevState;
		newState[configType].push(newConfiguration.toJSON());
		newState.activeConfigurationId = newConfiguration.id;
		newState.dirty = true;
		newState.tempConfiguration = newConfiguration.toJSON();
		newState.initialConfig = newConfiguration.toJSON();
		return newState;
	}
	case ActionTypes.STREAMS_RELOAD_RESPONSE: {
		const reloadResponse = action.response;
		const streamsErrors = reloadResponse && reloadResponse.machineserver
			&& reloadResponse.machineserver.streamsErrors ?
			reloadResponse.machineserver.streamsErrors : [];
		let prettifiedStreamErrors = [];
		if (streamsErrors && streamsErrors.length > 0) {
			prettifiedStreamErrors = streamsErrors.map((e) => {
				const messages = new Map();
				messages.set('ENOTFOUND', 'Host/port is invalid!');
				messages.set('UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'CA certificate is invalid!');
				if (typeof e === 'string') {
					if (e === 'Error: error:0906D06C:PEM routines:PEM_read_bio:no start line') {
						return 'Client or private certificate is invalid';
					}
					return e;
				}
				if (Array.isArray(e) && e[0]) {
					e.code = e[0].code;
					e.stream = e[0].stream;
				}
				if (e.code && messages.has(e.code)) {
					return `${e.stream}: ${messages.get(e.code)}`;
				}
				return JSON.stringify(e);
			});
		}
		let errors = state.errors.splice();
		errors = errors.concat(prettifiedStreamErrors);
		let errorsDone = [];
		const errorsToNotify = [];
		errors.forEach((err) => {
			if (!state.notifiedErrors.includes(err)) {
				errorsToNotify.push(err);
				errorsDone = state.notifiedErrors.slice();
				errorsDone.push(err);
			}
		});
		return {
			...state,
			errors: errorsToNotify,
			notifiedErrors: errorsDone,
			reloadResponse: action.response,
			reloadStreamsPending: false,
		};
	}

	case 'SAVING_PENDING': {
		return Object.assign({}, state, {
			error: null,
			dirty: false,
			savePending: true,
		});
	}
	case 'SAVING_FULFILLED': {
		let newState = cloneState(state);
		/*
		if(action.payload && action.payload.response && action.payload.response.inserted) {
			action.payload.response.inserted.name = action.payload.response.inserted.name.trim();
			newState = updateStateWithConfig(newState, {...action.payload.response.inserted});
		} */
		if(action.payload.response.result) {
			//
		}
		else {
			state.tempConfiguration.name = state.tempConfiguration.name.trim();
			newState = updateStateWithConfig(newState, {...state.tempConfiguration, lastModified: new Date().toISOString()});
			// TODO: get from server to be more accurate
		}
		newState.initialConfig = {...newState.tempConfiguration};
		newState.tempConfiguration = null;
		newState.error = null;
		newState.dirty = false;
		newState.tempConfig = null;
		newState.savePending = false;
		return newState;
	}
	case 'UNDO': {
		const { prevState } = { ...state };
		const currentState = cloneState(state);
		currentState.prevState = null;
		return Object.assign({}, prevState, { dirty: true }) ||
					Object.assign({}, currentState, { dirty: true });
	}
	case WsMessageTypes.REQUEST_FAILED: {
		const newState = cloneState(state);
		if (action.request === WsMessageTypes.STREAMS_RELOAD) {
			newState.savePending = false;
			newState.reloadStreamsPending = false;
		}
		return newState;
	}
	default: {
		return state;
	}
	}
};
