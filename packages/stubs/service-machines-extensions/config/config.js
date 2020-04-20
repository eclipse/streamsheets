module.exports = {
	functions: {
		ignore_dirs: ['node_modules'],
		module_dir: process.env.FUNCTIONS_MODULE_DIR || 'functions',
		module_dir_user: process.env.USER_FUNCTIONS_MODULE_DIR || 'functions_user'
	}
};
