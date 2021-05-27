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
import { Point, GraphUtils } from '@cedalo/jsg-core';

import ColumnHeaderView from '../view/ColumnHeaderView';
import RowHeaderView from '../view/RowHeaderView';
import CellsView from '../view/CellsView';
import View from '../../ui/View';
import ScrollBar from '../../ui/scrollview/ScrollBar';

/**
 * This class is used to visualize feedback during cell drag operations.
 *
 * @class CellFeedbackView
 * @extends View
 * @constructor
 */
export default class CellSelectionFeedbackView extends View {
	constructor(sheetview) {
		super();

		this._sheetview = sheetview;
	}

	setView(view) {
		this._sheetview = view;
		this._graphView = view.getGraphView();
	}

	drawSelection(graphics, view, viewBounds, containerRect, xOrg, yOrg) {
		if (!view) {
			return;
		}
		const point = new Point(0, 0);
		GraphUtils.traverseUp(view, this._graphView, (v) => {
			v.translateToParent(point);
			return true;
		});

		graphics.save();

		if (view instanceof ColumnHeaderView) {
			const scroll = view.getScrollOffset();
			point.y -= scroll.y;
		}
		if (view instanceof RowHeaderView) {
			const scroll = view.getScrollOffset();
			point.x -= scroll.x;
		}
		viewBounds.x += xOrg;
		viewBounds.y += yOrg;
		viewBounds.width -= xOrg;
		viewBounds.height -= yOrg;
		if (viewBounds.getRight() > containerRect.getRight()) {
			viewBounds.width -= viewBounds.getRight() - containerRect.getRight();
		}
		graphics.beginPath();
		graphics.moveTo(viewBounds.x, viewBounds.y);
		graphics.lineTo(viewBounds.x + viewBounds.width, viewBounds.y);
		graphics.lineTo(viewBounds.x + viewBounds.width, viewBounds.y + viewBounds.height);
		graphics.lineTo(viewBounds.x, viewBounds.y + viewBounds.height);
		graphics.lineTo(viewBounds.x, viewBounds.y);
		graphics.closePath();
		graphics.clip();

		graphics.translate(point.x, point.y);

		view.drawSelections(graphics);
		if (view instanceof CellsView) {
			view.drawCopyMarker(graphics);
		}

		graphics.translate(-point.x, -point.y);
		graphics.restore();

		viewBounds.x -= xOrg;
		viewBounds.y -= yOrg;
		viewBounds.width += xOrg;
		viewBounds.height += yOrg;
	};

	draw(graphics) {
		const pane = this._sheetview.getContentPane();
		if (pane === undefined) {
			return;
		}

		const graph = this._sheetview.getItem().getGraph();
		if (graph === undefined) {
			return;
		}
		const container = graph.getStreamSheetsContainer();
		if (container === undefined) {
			return;
		}
		const containerRect = container.getBoundingBox().toRectangle();
		const scrollView = this._sheetview.getScrollView();
		const viewBounds = scrollView.getBounds();
		const location = viewBounds.getLocation();
		const id = graph.getTopStreamSheetContainerId();

		if (id === undefined || id !== this._sheetview.getId()) {
			return;
		}

		GraphUtils.traverseUp(this._sheetview, this._graphView, (v) => {
			v.translateToParent(location);
			return true;
		});

		const sbSize = scrollView.areScrollBarsVisible()
			? graphics.getCoordinateSystem().metricToLogYNoZoom(ScrollBar.SIZE)
			: 0;

		viewBounds.translatePoint(location);
		viewBounds.width -= sbSize;
		viewBounds.height -= sbSize;

		const header = this._sheetview.getItem().isHeaderVisible();

		const org = pane
			.getSubviewAt(0)
			.getItem()
			.getOrigin();

		this.drawSelection(graphics, pane.getSubviewAt(0), viewBounds, containerRect, org.x, org.y);
		if (header) {
			this.drawSelection(graphics, pane.getSubviewAt(1), viewBounds, containerRect, org.x, 0);
			this.drawSelection(graphics, pane.getSubviewAt(2), viewBounds, containerRect, 0, org.y);
		}
	}
}
