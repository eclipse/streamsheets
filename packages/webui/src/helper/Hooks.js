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
import { useEffect, useReducer } from 'react';
import gatewayClient from './GatewayClient';

const graphQlReducer = (state = {}, action) => {
	switch (action.type) {
		case 'load':
			return {
				...state,
				loading: true,
				data: null,
				errors: null
			};
		case 'data':
			return {
				...state,
				loading: false,
				data: action.data,
				errors: null
			};
		case 'error':
			return {
				...state,
				loading: false,
				data: null,
				errors: action.data
			};
		default:
			throw Error();
	}
};

const always = () => true;

export const useGraphQL = (query, variables, customDeps, condition = always) => {
	const [state, dispatch] = useReducer(graphQlReducer, { loading: true, data: null, errors: null });
	const deps = customDeps || [variables];
	useEffect(() => {
		let canceled = false;
		dispatch({ type: 'load' });
		(async () => {
			if (!condition()) {
				return;
			}
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
	}, [query, ...deps]);
	return state;
};

export const useGraphQLCB = (cb, ...args) => {
	const state = useGraphQL(...args);
	useEffect(() => {
		cb(state);
	}, [state]);
};

export const useDocumentTitle = (title) => {
	useEffect(() => {
		if (title) {
			document.title = title;
		}
	}, [title]);
};
