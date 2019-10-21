/* eslint-disable import/prefer-default-export */
import core from '../core';
import SheetChartStateView from './SheetChartStateView';

const { SheetChartStateNode } = core;

let JSG = {};

export const createView = (model) => {
	if (model instanceof SheetChartStateNode) {
		return new SheetChartStateView(JSG, model);
	}
	return undefined;
};

export { SheetChartStateView };

export const init = (jsgMod) => {
	JSG = jsgMod;
};
