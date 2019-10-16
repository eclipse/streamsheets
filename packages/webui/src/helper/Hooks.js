import { useEffect, useReducer } from 'react';
import gatewayClient from './GatewayClient';

const graphQlReducer = (state = {}, action) => {
	switch (action.type) {
		case 'load':
			return {
				...state,
				loading: true,
				data: null,
				errors: null,
			};
		case 'data':
			return {
				...state,
				loading: false,
				data: action.data,
				errors: null,
			};
		case 'error':
			return {
				...state,
				loading: false,
				data: null,
				errors: action.data,
			};
		default:
			throw Error();
	}
};

export const useGraphQL = (query, variables, customCondition) => {
	const [state, dispatch] = useReducer(graphQlReducer, { loading: true, data: null, error: null });
	const condition = customCondition || [variables];
	useEffect(() => {
		let canceled = false;
		dispatch({ type: 'load' });
		(async () => {
			try {
				const data = await gatewayClient.graphql(query, variables);
				if (!canceled) {
					dispatch({ type: 'data', data });
				}
			} catch (error) {
				if (!canceled) {
					const errors = error.errors || [error.message || 'UNKNOWN ERROR'];
					dispatch({ type: 'error', data: errors });
				}
			}
		})();
		return () => {
			canceled = true;
		};
	}, [query, ...condition]);
	return state;
};

export const useDocumentTitle = (title) => {
	useEffect(() => {
		if (title) {
			document.title = title;
		}
	}, [title]);
};
