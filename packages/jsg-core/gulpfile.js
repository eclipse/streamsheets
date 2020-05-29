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
'use strict';

const gulp = require('gulp');
const jest = require('gulp-jest').default;
require('common-gulp-tasks');

const requireDir = require('require-dir');
requireDir('./gulp-tasks');

gulp.task('default', ['jest']);

gulp.task('jest', () =>
	gulp.src('test').pipe(jest({
		config: {
			testEnvironment: 'node',
			coverageReporters: [
				'text',
				'text-summary',
				'json',
				'lcov'
			],
			collectCoverageFrom: [
				'../**/*.js',
				'!**/*test*'
			]
		},
		coverage: true
	}))
);
