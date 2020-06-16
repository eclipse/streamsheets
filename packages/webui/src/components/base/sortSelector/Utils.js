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
const sortResourcesByName = (resources, asc = false) => {
	const sortedResources = [...resources];
	const dir = asc ? 1 : -1;
	sortedResources.sort((a,b) => {
		const aName = a.name || '';
		const bName = b.name || '';
		if(aName.toLowerCase()>bName.toLowerCase()) {
			return dir;
		} else if(aName.toLowerCase()<bName.toLowerCase()) {
			return -1 * dir;
		}
		return 0;
	});
	return sortedResources;
};
const sortResourcesByDate = (resources, asc = false) => {
	const sortedResources = [...resources];
	const dir = asc ? -1 : 1;
	sortedResources.sort((a,b) => {
		let aLastModified;
		let bLastModified;
		if (a.metadata && b.metadata) {
			aLastModified = a.metadata.lastModified || new Date().toISOString();
			bLastModified = b.metadata.lastModified || new Date().toISOString();
		} else {
			aLastModified = a.lastModified || new Date().toISOString();
			bLastModified = b.lastModified || new Date().toISOString();
		}
		const res = new Date(aLastModified) - new Date(bLastModified);
		return dir * res;
	});
	return sortedResources;
};
const sortResourcesByState = (resources, asc = false) => {
	const sortedResources = [...resources];
	const dir = asc ? 1 : -1;
	sortedResources.sort((a,b) => {
		const aState = a.state || '';
		const bState = b.state || '';
		if(aState.toLowerCase()>bState.toLowerCase()) {
			return dir;
		} else if(aState.toLowerCase()<bState.toLowerCase()) {
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
		case 'lastModified_desc' : {
			return sortResourcesByDate(resources, true);
		}
		case 'lastModified_asc' : {
			return sortResourcesByDate(resources, false);
		}
		default:
			return resources;
	}
};

export {
	sortResourcesByName,
	sortResources,
};
