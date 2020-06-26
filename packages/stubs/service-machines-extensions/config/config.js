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
module.exports = {
	functions: {
		ignore_dirs: ['node_modules'],
		module_dir: process.env.FUNCTIONS_MODULE_DIR || 'functions',
		module_dir_user: process.env.USER_FUNCTIONS_MODULE_DIR || 'functions_user'
	}
};
