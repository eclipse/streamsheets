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
const { terms: { getCellRangeFromTerm } } = require('../../utils');
const https = require('https');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const sliceMap = new Map();
const route = 'https://cloud.cedalo.com/palo';
const markAs = (term, marker) => {
	if (term) term._marker = marker;
};
const isMarkedAs = (term, marker) => term && term._marker === marker;
const returnValue = term => (term ? term._retval : null);
const setReturnValue = (term, value) => {
	if (term) term._retval = value;
};
const checkParam = (terms, index) => terms.length > index && terms[index].value !== null;


const getOlapRequest = (server, command, params) => {
	let url = server + command;

	params.forEach((param, i) => {
		if (param[1] !== undefined) {
			url += `${param[0]}=${param[1]}`;
			if (i < params.length - 1) {
				url += '&';
			}
		}
	});

	// just in case certificate is invalid
	// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

	// return new pending promise
	return new Promise((resolve, reject) => {
		// select http or https module, depending on reqested url
		const request = https.get(url, (response) => {
			// handle http errors
			if (response.statusCode === 400) {
				// reject(new Error(`Palo Error, status code: ${response.statusCode}`));
			} else if (response.statusCode < 200 || response.statusCode > 300) {
				reject(new Error(`Error, status code: ${response.statusCode}`));
			}
			// temporary data holder
			const body = [];
			// on every content chunk, push it to the data array
			response.on('data', chunk => body.push(chunk));
			// we are done, resolve promise with those joined chunks
			response.on('end', () => {
				if (response.statusCode === 400) {
					reject(new Error(`Error: ${body.join('')}`));
				} else {
					resolve(body.join(''));
				}
			});
		});
		// handle connection errors of the request
		request.on('error', err => reject(err));
	});
};

const check = (term, sheet, terms, min) => {
	if (!sheet.isProcessing) {
		return true;
	}

	if (!sheet || !terms || terms.length < min) {
		return ERROR.ARGS;
	}

	if (isMarkedAs(term, 'resumed')) {
		markAs(term, null);
		return returnValue(term);
	}

	if (isMarkedAs(term, 'pending')) {
		sheet.streamsheet.repeatProcessing();
		return true;
	}

	return undefined;
};

const returnError = (sheet, term, err) => {
	markAs(term, 'resumed');
	sheet.streamsheet.resumeProcessing();
	let [, message] = err.message.split(';');
	message = message.slice(1, -1).toUpperCase();
	setReturnValue(term, `#${message}`);
};

const login = (sheet, ...terms) => {
	const { term } = login;

	const res = check(term, sheet, terms, 0);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const user = checkParam(terms, 0) ? terms[0].value : 'admin';
	const password = checkParam(terms, 1) ? terms[1].value : '21232f297a57a5a743894a0e4a801fc3';

	getOlapRequest(route, '/server/login?', [['user', user], ['password', password]])
		.then((response) => {
			const [token] = response.split(';');
			markAs(term, 'resumed');
			setReturnValue(term, token);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const logout = (sheet, ...terms) => {
	const { term } = logout;

	const res = check(term, sheet, terms, 1);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';

	getOlapRequest(route, '/server/logout?', [['sid', sid]])
		.then((response) => {
			markAs(term, 'resumed');
			const [result] = response.split(';');
			setReturnValue(term, result);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const serversave = (sheet, ...terms) => {
	const { term } = serversave;

	const res = check(term, sheet, terms, 1);
	if (res !== undefined) {
		return res;
	}

	const sid = checkParam(terms, 0) ? terms[0].value : '';

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	getOlapRequest(route, '/server/logout?', [
		['sid', sid],
		['complete', '1']
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const dblist = (sheet, ...terms) => {
	const { term } = dblist;

	const res = check(term, sheet, terms, 2);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const index = checkParam(terms, 1) ? terms[1].value : 1;

	getOlapRequest(route, '/server/databases?', [['sid', sid]])
		.then((response) => {
			markAs(term, 'resumed');
			// all databases
			const dbs = response.split('\n');
			let result = '#NV';

			if (index > 0 && dbs.length > index) {
				result = dbs[index - 1].split(';')[1].replace(/"/g, '');
			}
			setReturnValue(term, result);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const dbcreate = (sheet, ...terms) => {
	const { term } = dbcreate;

	const res = check(term, sheet, terms, 2);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const name = checkParam(terms, 1) ? terms[1].value : '';

	getOlapRequest(route, '/database/create?', [
		['sid', sid],
		['new_name', name]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const dbdelete = (sheet, ...terms) => {
	const { term } = dbdelete;

	const res = check(term, sheet, terms, 2);
	if (res !== undefined) {
		return res;
	}

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	getOlapRequest(route, '/database/destroy?', [
		['sid', sid],
		['name_database', db]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const dimlist = (sheet, ...terms) => {
	const { term } = dimlist;

	const res = check(term, sheet, terms, 2);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const index = checkParam(terms, 2) ? terms[2].value : 1;

	getOlapRequest(route, '/database/dimensions?', [
		['sid', sid],
		['name_database', db]
	])
		.then((response) => {
			markAs(term, 'resumed');
			// all databases
			const dims = response.split('\n');
			let result = '#NV';

			if (index > 0 && dims.length > index) {
				result = dims[index - 1].split(';')[1].replace(/"/g, '');
			}
			setReturnValue(term, result);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const dimcreate = (sheet, ...terms) => {
	const { term } = dimcreate;

	const res = check(term, sheet, terms, 3);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const name = checkParam(terms, 2) ? terms[2].value : '';

	getOlapRequest(route, '/dimension/create?', [
		['sid', sid],
		['name_database', db],
		['new_name', name]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const dimdelete = (sheet, ...terms) => {
	const { term } = dimdelete;

	const res = check(term, sheet, terms, 3);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const name = checkParam(terms, 2) ? terms[2].value : '';

	getOlapRequest(route, '/dimension/destroy?', [
		['sid', sid],
		['name_database', db],
		['name_dimension', name]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const cubelist = (sheet, ...terms) => {
	const { term } = cubelist;

	const res = check(term, sheet, terms, 2);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const index = checkParam(terms, 2) ? terms[2].value : 1;

	getOlapRequest(route, '/database/cubes?', [
		['sid', sid],
		['name_database', db]
	])
		.then((response) => {
			markAs(term, 'resumed');
			// all cubes
			const cubes = response.split('\n');
			let result = '#NV';

			if (index > 0 && cubes.length > index) {
				result = cubes[index - 1].split(';')[1].replace(/"/g, '');
			}
			setReturnValue(term, result);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const cubecreate = (sheet, ...terms) => {
	const { term } = cubecreate;

	const res = check(term, sheet, terms, 3);
	if (res !== undefined) {
		return res;
	}

	let dims = '';

	for (let i = 3; i < terms.length; i += 1) {
		dims += checkParam(terms, i) ? terms[i].value : '';
		if (i < terms.length - 1) {
			dims += ',';
		}
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const name = checkParam(terms, 2) ? terms[2].value : '';

	getOlapRequest(route, '/cube/create?', [
		['sid', sid],
		['name_database', db],
		['new_name', name],
		['name_dimensions', dims]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const cubedelete = (sheet, ...terms) => {
	const { term } = dimdelete;

	const res = check(term, sheet, terms, 3);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const cube = checkParam(terms, 2) ? terms[2].value : '';

	getOlapRequest(route, '/dimension/destroy?', [
		['sid', sid],
		['name_database', db],
		['name_cube', cube]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const cubedimlist = (sheet, ...terms) => {
	const { term } = cubedimlist;

	const res = check(term, sheet, terms, 3);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const cube = checkParam(terms, 2) ? terms[2].value : '';
	const index = checkParam(terms, 3) ? terms[3].value : 1;

	getOlapRequest(route, '/cube/info?', [
		['sid', sid],
		['name_database', db],
		['name_cube', cube]
	])
		.then((response) => {
			markAs(term, 'resumed');
			// all dim ids
			const infos = response.split(';');
			let result = '#NV';

			const dimIds = infos[3];
			const dims = dimIds.split(',');

			if (index > 0 && dims.length >= index) {
				result = dims[index - 1];
			}
			setReturnValue(term, result);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const dimname = (sheet, ...terms) => {
	const { term } = dimname;

	const res = check(term, sheet, terms, 3);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const dim = checkParam(terms, 2) ? terms[2].value : '';

	getOlapRequest(route, '/dimension/info?', [
		['sid', sid],
		['name_database', db],
		['dimension', dim]
	])
		.then((response) => {
			markAs(term, 'resumed');
			const infos = response.split(';');
			const result = infos[1].replace(/"/g, '');

			setReturnValue(term, result);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const ename = (sheet, ...terms) => {
	const { term } = ename;

	const res = check(term, sheet, terms, 3);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const dim = checkParam(terms, 2) ? terms[2].value : '';
	const index = checkParam(terms, 3) ? terms[3].value : 1;

	getOlapRequest(route, '/dimension/element?', [
		['sid', sid],
		['name_database', db],
		['name_dimension', dim],
		['position', index - 1]
	])
		.then((response) => {
			markAs(term, 'resumed');
			const result = response.split(';')[1].replace(/"/g, '');
			setReturnValue(term, result);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const ecreate = (sheet, ...terms) => {
	const { term } = ecreate;

	const res = check(term, sheet, terms, 5);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const dim = checkParam(terms, 2) ? terms[2].value : '';
	const name = checkParam(terms, 3) ? terms[3].value : '';
	const type = checkParam(terms, 4) ? terms[4].value : '';
	const children = checkParam(terms, 5) ? terms[5].value : undefined;
	const weights = checkParam(terms, 6) ? terms[6].value : undefined;

	getOlapRequest(route, '/element/create?', [
		['sid', sid],
		['name_database', db],
		['name_dimension', dim],
		['new_name', name],
		['type', type],
		['name_children', children],
		['weights', weights]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const econsolidate = (sheet, ...terms) => {
	const { term } = econsolidate;

	const res = check(term, sheet, terms, 6);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const dim = checkParam(terms, 2) ? terms[2].value : '';
	const name = checkParam(terms, 3) ? terms[3].value : '';
	const children = checkParam(terms, 4) ? terms[4].value : undefined;
	const weights = checkParam(terms, 5) ? terms[5].value : undefined;

	getOlapRequest(route, '/element/append?', [
		['sid', sid],
		['name_database', db],
		['name_dimension', dim],
		['name_element', name],
		['name_children', children],
		['weights', weights]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const edelete = (sheet, ...terms) => {
	const { term } = edelete;

	const res = check(term, sheet, terms, 4);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const dim = checkParam(terms, 2) ? terms[2].value : '';
	const name = checkParam(terms, 3) ? terms[3].value : '';

	getOlapRequest(route, '/element/destroy?', [
		['sid', sid],
		['name_database', db],
		['name_dimension', dim],
		['name_element', name]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const edeleteall = (sheet, ...terms) => {
	const { term } = edeleteall;

	const res = check(term, sheet, terms, 3);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const dim = checkParam(terms, 2) ? terms[2].value : '';

	getOlapRequest(route, '/element/destroy?', [
		['sid', sid],
		['name_database', db],
		['name_dimension', dim]
	])
		.then(() => {
			markAs(term, 'resumed');
			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const setdata = (sheet, ...terms) => {
	const { term } = setdata;

	const res = check(term, sheet, terms, 5);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	let path = '';

	for (let i = 5; i < terms.length; i += 1) {
		path += checkParam(terms, i) ? terms[i].value : '';
		if (i < terms.length - 1) {
			path += ',';
		}
	}

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const cube = checkParam(terms, 2) ? terms[2].value : '';
	const value = checkParam(terms, 3) ? terms[3].value : '';
	const splash = checkParam(terms, 4) ? terms[4].value : '';

	getOlapRequest(route, '/cell/replace?', [
		['sid', sid],
		['name_database', db],
		['name_cube', cube],
		['name_path', path],
		['value', value],
		['splash', splash]
	])
		.then((/* response */) => {
			markAs(term, 'resumed');

			setReturnValue(term, true);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const data = (sheet, ...terms) => {
	const { term } = data;

	const res = check(term, sheet, terms, 5);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	let path = '';

	for (let i = 3; i < terms.length; i += 1) {
		path += checkParam(terms, i) ? terms[i].value : '';
		if (i < terms.length - 1) {
			path += ',';
		}
	}

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 1) ? terms[1].value : '';
	const cube = checkParam(terms, 2) ? terms[2].value : '';

	getOlapRequest(route, '/cell/value?', [
		['sid', sid],
		['name_database', db],
		['name_cube', cube],
		['name_path', path]
	])
		.then((response) => {
			markAs(term, 'resumed');
			let result = '#NV';
			const value = response.split(';');

			if (Number(value[1]) !== 1) {
				result = '';
			}

			switch (Number(value[0])) {
			case 1:
				result = Number(value[2]);
				break;
			case 2:
				result = value[2].replace(/"/g, '');
				break;
			default:
				break;
			}
			setReturnValue(term, result);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const datas = (sheet, ...terms) => {
	if (!sheet || !terms || terms.length < 3) {
		return ERROR.ARGS;
	}

	const sliceId = checkParam(terms, 0) ? String(terms[0].value) : '';
	const sliceEntry = sliceMap.get(sliceId);
	if (sliceEntry === undefined) {
		return ERROR.INVALID_PARAM;
	}

	const dim1 = checkParam(terms, 1) ? String(terms[1].value) : '';
	const dim2 = checkParam(terms, 2) ? String(terms[2].value) : '';

	const dim1Index = sliceEntry.dim1Elements.elements.findIndex(element => element === dim1);
	const dim2Index = sliceEntry.dim2Elements.elements.findIndex(element => element === dim2);

	if (dim1Index === -1 || dim2Index === -1) {
		return ERROR.INVALID_PARAM;
	}

	const dim2Cnt = sliceEntry.dim2Elements.elements.length;

	if ((dim1Index * dim2Cnt) + dim2Index >= sliceEntry.values.length) {
		return ERROR.INVALID_PARAM;
	}

	let value = sliceEntry.values[(dim1Index * dim2Cnt) + dim2Index];
	if (value === undefined) {
		return ERROR.INVALID_PARAM;
	}

	value = value.split(';');
	let result = '#NV';

	if (Number(value[1]) !== 1) {
		result = '';
	}

	switch (Number(value[0])) {
	case 1:
		result = Number(value[2]);
		break;
	case 2:
		result = value[2].replace(/"/g, '');
		break;
	default:
		break;
	}

	return result;
};

/**
 *
 * @param sid
 * @param sliceid
 * @param database
 * @param cube
 * @param sliceelements in order of dimensions
 */
const slice = (sheet, ...terms) => {
	const { term } = slice;

	const res = check(term, sheet, terms, 6);
	if (res !== undefined) {
		return res;
	}

	markAs(term, 'pending');
	sheet.streamsheet.repeatProcessing();

	let paths = '';
	const sliceElements = [];
	const dim1Elements = {
		elements: []
	};
	const dim2Elements = {
		elements: []
	};

	const sliceId = checkParam(terms, 1) ? String(terms[1].value) : 'slice';

	for (let i = 4; i < terms.length; i += 1) {
		const eterm = terms[i];
		const range = getCellRangeFromTerm(eterm, sheet);
		if (range) {
			range.iterate((cell) => {
				if (dim1Elements.index === undefined) {
					dim1Elements.elements.push(cell.value);
				} else {
					dim2Elements.elements.push(cell.value);
				}
			});
			if (dim1Elements.index === undefined) {
				dim1Elements.index = i - 4;
			} else if (dim2Elements.index === undefined) {
				dim2Elements.index = i - 4;
			} else {
				sheet.streamsheet.resumeProcessing();
				return '#ERR';
			}
		} else {
			sliceElements.push({
				element: eterm.value,
				index: i - 4
			});
		}
	}

	if (dim1Elements.elements.length === 0 || dim2Elements.elements.length === 0) {
		sheet.streamsheet.resumeProcessing();
		return '#ERR';
	}

	const element = [];
	const elements = [];

	sliceElements.forEach((elementSlice) => {
		element[elementSlice.index] = elementSlice.element;
	});

	dim1Elements.elements.forEach((element1) => {
		dim2Elements.elements.forEach((element2) => {
			element[dim1Elements.index] = element1;
			element[dim2Elements.index] = element2;
			elements.push(element.join(','));
		});
	});

	paths += elements.join(':');

	const sid = checkParam(terms, 0) ? terms[0].value : '';
	const db = checkParam(terms, 2) ? terms[2].value : '';
	const cube = checkParam(terms, 3) ? terms[3].value : '';

	getOlapRequest(route, '/cell/values?', [
		['sid', sid],
		['name_database', db],
		['name_cube', cube],
		['name_paths', paths]
	])
		.then((response) => {
			markAs(term, 'resumed');
			// split value info
			const values = response.split('\n');
			const sliceEntry = {
				sliceElements,
				dim1Elements,
				dim2Elements,
				values
			};

			setReturnValue(term, sliceId);

			sliceMap.set(String(sliceId), sliceEntry);
			sheet.streamsheet.resumeProcessing();
			return true;
		})
		.catch((err) => {
			returnError(sheet, term, err);
			return true;
		});

	return true;
};

const slicedelete = (sheet, ...terms) => {
	if (!sheet || !terms || terms.length < 1) {
		return ERROR.ARGS;
	}

	const sliceId = checkParam(terms, 0) ? String(terms[0].value) : 'slice';
	const sliceEntry = sliceMap.get(sliceId);

	if (sliceEntry === undefined) {
		return ERROR.INVALID_PARAM;
	}

	sliceMap.delete(sliceId);

	return true;
};
module.exports = {
	'OLAP.CUBECREATE': cubecreate,
	'OLAP.CUBEDELETE': cubedelete,
	'OLAP.CUBEDIMLIST': cubedimlist,
	'OLAP.CUBELIST': cubelist,
	'OLAP.DATA': data,
	'OLAP.DATAS': datas,
	'OLAP.DBCREATE': dbcreate,
	'OLAP.DBDELETE': dbdelete,
	'OLAP.DBLIST': dblist,
	'OLAP.DIMCREATE': dimcreate,
	'OLAP.DIMDELETE': dimdelete,
	'OLAP.DIMLIST': dimlist,
	'OLAP.DIMNAME': dimname,
	'OLAP.ECONSOLIDATE': econsolidate,
	'OLAP.ECREATE': ecreate,
	'OLAP.EDELETE': edelete,
	'OLAP.EDELETEALL': edeleteall,
	'OLAP.ENAME': ename,
	'OLAP.LOGIN': login,
	'OLAP.LOGOUT': logout,
	'OLAP.SERVERSAVE': serversave,
	'OLAP.SETDATA': setdata,
	'OLAP.SLICE': slice,
	'OLAP.SLICEDELETE': slicedelete
};
