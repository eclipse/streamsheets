module.exports = {
	functions: {
		// depth: 2,
		ignore_dirs: ['node_modules'],
		module_dir: process.env.FUNCTIONS_MODULE_DIR || 'functions',
		module_dir_user: process.env.USER_FUNCTIONS_MODULE_DIR || 'functions_user'
	},
	mongodb: {
		MONGO_HOST: process.env.MONGO_HOST || 'localhost',
		MONGO_PORT: parseInt(process.env.MONGO_PORT, 10) || 27017,
		MONGO_DATABASE: process.env.MONGO_DATABASE || 'streamsheets'
	}
};
