import * as Actions from '../constants/ActionTypes';

const defaultMetaInformationState = {
	services: {},
	isFetching: false,
	disconnectedServices: [],
	allServicesConnected: true,
};

export default function metaInformationReducer(state = defaultMetaInformationState, action) {
	switch (action.type) {
		case Actions.FETCH_META_INFORMATION:
			return {
				...state,
				isFetching: true,
			};
		case Actions.RECEIVE_META_INFORMATION: {
			const services = action.metaInformation;
			const disconnectedServices = Object.entries(services)
				.filter(([serviceName]) => serviceName !== 'undefined')
				.filter(([, service]) => !Object.keys(service.instances).length > 0)
				.map(([serviceName]) => serviceName);
			return {
				...state,
				isFetching: false,
				services,
				disconnectedServices,
				allServicesConnected: disconnectedServices.length === 0
			};
		}
		default:
			return state;
	}
}
