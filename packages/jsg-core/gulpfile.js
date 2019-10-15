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
