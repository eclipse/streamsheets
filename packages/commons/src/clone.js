const rfdcClone = require('rfdc')();
// is stable in node 12! => so no need for external lib
// const { deserialize, serialize } = require('v8');

// by far slowest choice
// const v8Clone = (obj) => deserialize(serialize(obj));
// has problems with Date, circular refs and removes undefined!
// const jsonClone = (obj) => JSON.parse(JSON.stringify(obj));


const clone = (obj, throwOnError = false) => {
	try {
		// return v8Clone(obj);
		// return jsonClone(obj);
		return rfdcClone(obj);
	} catch (err) {
		if (throwOnError) throw err;
	}
	return undefined;
};
module.exports = clone;


// const testobj = {
// 	a: 'hello',
// 	b: undefined,
// 	c: {
// 		c1: 'world',
// 		c2: null,
// 		c3: {
// 			c31: '!!!'
// 		}
// 	},
// 	d: ['hello', undefined, 'world', { a: { b: { c: 23 } } }]
// };

// const measure = (type, cloneIt, N = 1000) => {
// 	let cp;
// 	const t0 = Date.now();
// 	console.log(`measure ${type} clone...`);
// 	for (let i = 0; i < N; i += 1) {
// 		cp =  cloneIt(testobj);
// 	}
// 	const t1 = Date.now();
// 	const delta = t1 - t0;
// 	console.log(`processing ${N} times took:`);
// 	console.log(`${delta}ms total`);
// 	console.log(`${delta / N}ms per step in avg`);
// 	console.log('copy: ', cp);
// };

// // measure('v8', v8Clone, 100 * 1000);
// // measure('json', jsonCLone, 1000 * 1000);
// measure('rfdc', rfdcClone, 1000 * 1000);

