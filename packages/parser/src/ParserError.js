const create = (conf = {}) => {
	const err = Object.assign({}, conf);
	err.toString = () => `${err.name}: ${err.message}`;
	// ensure we have following properties set:
	err.code = err.code || -1;
	err.name = err.name || '';
	err.message = err.message || '';
	err.index = err.index;
	return err;
};


module.exports =  {
	create
};
