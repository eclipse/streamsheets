const IdGenerator = require('@cedalo/id-generator');
const querystring = require('querystring');
const url = require('url');

const fns = {
	getInitialWebsocketPayload: (request) => {
		const actionType = request.get('X-DL_AT');
		const additionalDlKeys = request.get('X-DL_ADDITIONAL_KEYS');
		const additionalWebsocketPayload = {};
		if (additionalDlKeys) {
			additionalDlKeys.split(',').forEach((dlKey) => {
				additionalWebsocketPayload[dlKey] = request.get(`X-DL_${dlKey}`);
			});
		}

		const websocketPayload = {
			type: actionType
		};
		websocketPayload.data = additionalWebsocketPayload;
		return websocketPayload;
	},
	decorateNewDatabaseDoc: doc => Object.assign({}, {
		dateCreated: Date.now(),
		dateUpdated: null,
		_id: IdGenerator.generate()
	}, doc),

	mapToArray: (map = {}, arr = []) => {
		if (map._children && Object.keys(map._children).length) {
			Object.keys(map._children).forEach((key) => {
				map._children[key].children = [];
				arr.push(map._children[key]);
				const childs = fns.mapToArray(map._children[key], map._children[key].children);
				// TODO sorting
				map._children[key].children = childs;
			});
		}
		delete map._children;

		return arr;
	},
	getTree: (flatNodes = []) => {
		if (!flatNodes.length) {
			return {};
		}
		const firstNodePath = flatNodes[0].path.split(',').filter(e => !!e);
		const startMapAtIndex = firstNodePath.length;
		const map = {};

		flatNodes.forEach((node) => {
			const path = node.path.split(',').filter(e => !!e);
			// delete root paths
			path.splice(0, startMapAtIndex);
			node._children = node._children || {};
			// is rootlevel node?
			if (path.length === 0) {
				node._children = node._children || {};
				map[node._id] = node;
				return;
			}

			let tmpMap = {};
			const firstParent = path.shift();
			if (map[firstParent]) {
				// init
				map[firstParent]._children = map[firstParent]._children || {};
				tmpMap = map[firstParent]._children;
			}

			if (!path.length) {
				tmpMap[node._id] = node;
				return;
			}

			path.forEach((parentId, idx) => {
				if (tmpMap[parentId]) {
					tmpMap = tmpMap[parentId]._children;
				} else {
					tmpMap._children[node._id] = node;
				}
				if (idx === path.length - 1) {
					tmpMap[node._id] = node;
				}
			});
		});
		return map;
	},
	getUserFromWebsocketRequest(request, tokenKey, tokenParser) {
		const reqUrl = request.url;
		const token = querystring.parse(url.parse(reqUrl).query)[tokenKey];
		return tokenParser(token);
	},
	checkArity(type, fnName, fn, expectedArity) {
		if (fn.length !== expectedArity) {
			return `registered ${type} ${fnName} interceptor takes ${fn.length} parameter,
			but will be called with ${expectedArity}`;
		}
		return false;
	}
};

module.exports = fns;
