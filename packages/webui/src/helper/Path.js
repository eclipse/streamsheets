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
import qs from 'query-string';

const queryString = (query) =>
	typeof query === 'string'
		? query
		: [
				'',
				Object.entries(query)
					.map((pair) => pair.map(encodeURIComponent).join('='))
					.join('&')
		  ].join('?');

const preserveScope = (url) => {
	const { scope } = qs.parse(window.location.hash);
	const scopeString = qs.stringify({ scope });
	return url.indexOf('#') === -1 ? [url, scopeString].join('#') : [url, scopeString].join('&');
};

export const Path = {
	machine: (id, query = '') => preserveScope(`/machines/${id}${queryString(query)}`),
	dashboard: () => preserveScope(`/dashboard`),
	administration: () => preserveScope(`/administration`),
	user: (id) => preserveScope(`/administration/users/${id}`),
	users: () => preserveScope(`/administration/users`),
	workspaces: () => preserveScope(`/administration/workspaces`),
	workspace: (id) => preserveScope(`/administration/workspaces/${id}`),
	database: () => preserveScope(`/administration/database`),
	stream: (id) => preserveScope(`/administration/stream/${id}`),
	connectors: () => preserveScope(`/administration/connectors`),
	consumers: () => preserveScope(`/administration/consumers`),
	producers: () => preserveScope(`/administration/producers`),
	export: (machineId) => preserveScope(['/export', machineId].filter((e) => !!e).join('/'))
};
