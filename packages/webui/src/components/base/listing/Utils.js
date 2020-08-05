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
import jsonpath from 'jsonpath';

const MAX_LENGTH = 25;

const jsonPath = (resource, key) => {
	const value = jsonpath.query(resource, key);
	return Array.isArray(value) ? value.join() : value;
};

const shorten = (value, maxLength = MAX_LENGTH) => {
	let ret = Array.isArray(value) ? value.join() : value;
	ret = ret != null ? `${ret}` : '';
	if (ret.length > maxLength) {
		ret = `${ret.substr(0, maxLength - 3)}...`;
	}
	return ret;
};

const chainFilters = filters => (resources) => {
	const filterArrays = Array.isArray(filters) ? filters : [filters];
	return filterArrays.reduce((filteredResources, filter) => filter(filteredResources), resources);
};

const sortResourcesByName = (resources, asc = false) => {
	const sortedResources = [...resources];
	const dir = asc ? 1 : -1;
	sortedResources.sort((a,b) => {
		if(a.name.toLowerCase()>b.name.toLowerCase()) {
			return dir;
		} else if(a.name.toLowerCase()<b.name.toLowerCase()) {
			return -1 * dir;
		}
		return 0;
	});
	return sortedResources;
};
const sortResourcesByDate = (resources, asc = false) => {
	const sortedResources = [...resources];
	const dir = asc ? 1 : -1;
	sortedResources.sort((a,b) => {
		a.lastModified = a.lastModified || '';
		b.lastModified = b.lastModified || '';
		const res = new Date(a.lastModified) - new Date(b.lastModified);
		return dir * res;
	});
	return sortedResources;
};
const sortResourcesByState = (resources, asc = false) => {
	const sortedResources = [...resources];
	const dir = asc ? 1 : -1;
	sortedResources.sort((a,b) => {
		if(a.state.toLowerCase()>b.state.toLowerCase()) {
			return dir;
		} else if(a.state.toLowerCase()<b.state.toLowerCase()) {
			return -1*dir;
		}
		return 0;
	});
	return sortedResources;
};

const sortResources = (res, type) => {
	const resources = [...res];
	switch (type) {
		case 'state_asc': {
			return sortResourcesByState(resources, true);
		}
		case 'state_desc': {
			return sortResourcesByState(resources, false);
		}
		case 'name_desc': {
			return sortResourcesByName(resources, false);
		}
		case 'name_asc' : {
			return sortResourcesByName(resources, true);
		}
		case 'date_desc' : {
			return sortResourcesByDate(resources, true);
		}
		case 'date_asc' : {
			return sortResourcesByDate(resources, false);
		}
		default:
			return resources;
	}
};

const formatDateString = (s = '') => {
	if(!Number.isNaN(Date.parse(s))) {
		const d = new Date(s);
		return `${d.toLocaleDateString(undefined, {year: '2-digit', month: '2-digit', day: '2-digit'})} ${d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}`;
	}
	return '';
};

export {
	jsonPath,
	shorten,
	chainFilters,
	sortResourcesByName,
	sortResources,
	formatDateString
};
