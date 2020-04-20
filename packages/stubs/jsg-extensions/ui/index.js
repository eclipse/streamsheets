/* eslint-disable import/prefer-default-export */
import core from '../core';
import SheetChartStateView from './SheetChartStateView';
import SheetPlotView from './SheetPlotView';

const { SheetChartStateNode, SheetPlotNode } = core;

let JSG = {};

export const createView = (model) => {
	if (model instanceof SheetChartStateNode) {
		return new SheetChartStateView(JSG, model);
	}
	if (model instanceof SheetPlotNode) {
		return new SheetPlotView(JSG, model);
	}
	return undefined;
};

export { SheetChartStateView, SheetPlotView };

export const init = (jsgMod) => {
	JSG = jsgMod;
};
