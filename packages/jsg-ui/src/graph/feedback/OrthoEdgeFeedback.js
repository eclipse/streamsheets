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
import {
	default as JSG,
	FormatAttributes,
} from '@cedalo/jsg-core';
import EdgeFeedback from './EdgeFeedback';

/**
 * A Feedback instance for Edge items which have an
 * {{#crossLink "OrthoLineShape"}}{{/crossLink}}.
 *
 * @class OrthoEdgeFeedback
 * @extends EdgeFeedback
 * @param {Edge} fbItem The GraphItem this feedback is based on.
 * @param {View} fbView The View used to represent this feedback.
 * @param {Edge} orgItem The original GraphItem associated to this feedback.
 * @constructor
 * @deprecated CURRENTLY NOT USED ANYMORE! SUBJECT TO BE REMOVED!!
 */
class OrthoEdgeFeedback extends EdgeFeedback {
	constructor(fbItem, fbView, orgItem) {
		super(fbItem, fbView, orgItem);
		// this._angle = undefined;
		this._fbItem.getFormat().setLineStyle(FormatAttributes.LineStyle.DASH);
	}
}

// OrthoEdgeFeedback.OVAL = new Rectangle(0, 0, 250, 250);

// OrthoEdgeFeedback.prototype.init = function() {
// OrthoEdgeFeedback._super.init.call(this);
//
// // var parent = this._orgItem.getParent();
// // this._angle = translateAngle(parent.getAngle().getValue(), parent, this._orgItem.getGraph());
// // var angle = this._angle;
// //
// // //we draw ourself orthogonal to parent!
// // this._fbView.translateGraphics = function(graphics) {
// // var origin = this._item.getOrigin(); //here this === fbView!!
// // graphics.translate(origin.x, origin.y);
// // graphics.rotate(angle);
// // };
//
//
// function translateAngle(angle, from, toGraph) {
// var parent = from.getParent();
// while(parent != undefined && parent != toGraph) {
// angle += parent.getAngle().getValue();
// parent = parent.getParent();
// }
// return angle;
// }
// };

// OrthoEdgeFeedback.prototype.getPoints = function() {
// var points = this.getFeedbackItem().getPoints();
// var origin = this._fbView.getOrigin();
// for (var i = 0; i < points.length; i++) {
// points[i] = this._translateToParent(points[i]);
// }
// return points;
// };
//
// OrthoEdgeFeedback.prototype.getEndPoint = function(reusepoint) {
// var point = this.getFeedbackItem().getEndPoint(reusepoint);
// return this._translateToParent(point);
// };
// OrthoEdgeFeedback.prototype.setEndPointTo = function(point) {
// point = this._translateFromParent(point);
// OrthoEdgeFeedback._super.setEndPointTo.call(this, point);
// };
//
//
// OrthoEdgeFeedback.prototype.getStartPoint = function(reusepoint) {
// var point = this.getFeedbackItem().getStartPoint(reusepoint);
// return this._translateToParent(point);
// };
// OrthoEdgeFeedback.prototype.setStartPointTo = function(point) {
// point = this._translateFromParent(point);
// OrthoEdgeFeedback._super.setStartPointTo.call(this, point);
// };
//
// OrthoEdgeFeedback.prototype.setPointAt = function(index, point) {
// point = this._translateFromParent(point);
// OrthoEdgeFeedback._super.setPointAt.call(this, index, point);
// };
// OrthoEdgeFeedback.prototype.getPointAt = function(index, reusepoint) {
// var point = this.getFeedbackItem().getPointAt(index, reusepoint);
// return this._translateToParent(point);
// };

// var changed = false;
// OrthoEdgeFeedback.prototype.onNodeChange = function(node) {
// var fbItem = this.getFeedbackItem();
// if (!changed) {
// var index = isSourceNode(node) ? 0 : fbItem.getPointsCount() - 1;
// var coordinate = fbItem.getCoordinateAt(index);
// var self = this;
// var toPoint = coordinate.toPoint;
// coordinate.toPoint = function() {
// var point = toPoint.call(this);
// point = self._translateFromParent(point);
// return point;
// };
// changed = true;
//
// }
// fbItem.refresh();
//
// function isSourceNode(node) {
// return fbItem.getSourcePort().getParent() === node;
// }
// };
//
// OrthoEdgeFeedback.prototype.setSourcePort = function(port) {
// OrthoEdgeFeedback._super.setSourcePort.call(this, port);
// var fbItem = this.getFeedbackItem();
// var coordinate = fbItem.getCoordinateAt(0);
// this._adjustCoordinateToPoint(coordinate);
// };
// OrthoEdgeFeedback.prototype.setTargetPort = function(port) {
// OrthoEdgeFeedback._super.setTargetPort.call(this, port);
// var fbItem = this.getFeedbackItem();
// var coordinate = fbItem.getCoordinateAt(fbItem.getPointsCount() - 1);
// this._adjustCoordinateToPoint(coordinate);
// };
// OrthoEdgeFeedback.prototype._adjustCoordinateToPoint = function(coordinate) {
// var self = this;
// var toPoint = coordinate.toPoint;
// coordinate.toPoint = function(reusepoint) {
// var point = toPoint.call(this, reusepoint);
// //point = self._translateFromParent(point);
// if (self._angle != undefined) {
// point.rotate(-self._angle);
// }
// return point;
// };
// };

// OrthoEdgeFeedback.prototype._translateFromParent = function(point, origin) {
// var pt = point.copy();
// this._fbView.translateFromParent(pt);
// if(this._angle != undefined) {
// //apply calculated parent rotation => see init...
// pt.rotate(-this._angle);
// }
// origin = (origin != undefined) ? origin : this._fbView.getOrigin();
// pt.add(origin);
// return pt;
// };

// OrthoEdgeFeedback.prototype._translateToParent = function(point, origin) {
// var pt = point.copy();
// origin = (origin != undefined) ? origin : this._fbView.getOrigin();
// pt.subtract(origin);
// if(this._angle != undefined) {
// //apply calculated parent rotation => see init...
// pt.rotate(this._angle);
// }
// this._fbView.translateToParent(pt);
// return pt;
// };

export default OrthoEdgeFeedback;
