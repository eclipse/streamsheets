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
import { default as JSG, Coordinate, Event, CoordinateProxy, Point } from '@cedalo/jsg-core';
import Feedback from './Feedback';

// INNER EVENT HANDLER CLASS:
class NodeListener {
	constructor(feedback) {
		this._feedback = feedback;
	}

	registerTo(node) {
		// we handle following events:
		node.addEventListener(Event.ANGLE, this);
		node.addEventListener(Event.BBOX, this);
		node.addEventListener(Event.PIN, this);
	}

	deregisterFrom(node) {
		// we handle following events:
		node.removeEventListener(Event.ANGLE, this);
		node.removeEventListener(Event.BBOX, this);
		node.removeEventListener(Event.PIN, this);
	}

	handlePreEvent(event) {}

	handlePostEvent(event) {
		this._feedback.onNodeChange(event.source);
	}
}

/**
 * A Feedback instance for Edge items.
 *
 * @class EdgeFeedback
 * @extends Feedback
 * @param {Edge} fbItem The GraphItem this feedback is based on.
 * @param {View} fbView The View used to represent this feedback.
 * @param {Edge} orgItem The original GraphItem associated to this feedback.
 * @constructor
 */
class EdgeFeedback extends Feedback {
	constructor(fbItem, fbView, orgItem) {
		super(fbItem, fbView, orgItem);
		// nodeListener is for this a subfeedback if its attached node is moved...
		this._nodeListener = new NodeListener(this);
		this.doAutoLayout = true;
	}

	init() {
		super.init();

		// have to init start-/end-coordinate, they may are attached...
		const fbItem = this._fbItem;
		const orgItem = this._orgItem;

		function createPortFrom(port) {
			const portfb = port.copy();
			portfb._parent = port.getParent();
			portfb._isFeedback = true;
			return portfb;
		}

		// create port feedbacks if original edge is attached...
		if (orgItem.hasSourceAttached()) {
			fbItem.setSourcePort(createPortFrom(orgItem.getSourcePort()));
		}
		if (orgItem.hasTargetAttached()) {
			fbItem.setTargetPort(createPortFrom(orgItem.getTargetPort()));
		}

		// refresh once again, because we changed source/target ports here => need to layout again
		fbItem.refresh();
	}

	// required for ResizeInteraction (multiselection) => here we define the resize-factors...
	initResize(selbbox) {
		const self = this;
		const points = this.getFeedbackItem().getPoints();
		const selsize = selbbox.getSize();
		const selorigin = selbbox.getTopLeft();

		function factorOf(point) {
			point.subtract(selorigin);
			selbbox.rotateLocalPointInverse(point);
			point.set(point.x / selsize.x, point.y / selsize.y);
			return point;
		}

		this._resizeFactors = [];
		points.forEach((point) => {
			self._resizeFactors.push(factorOf(point.copy()));
		});
	}

	// required for ResizeInteraction (multiselection)
	resize(newselbbox) {
		const size = newselbbox.getSize();
		const origin = newselbbox.getTopLeft();
		const tmppoint = new Point(0, 0);
		const fbItem = this.getFeedbackItem();
		const coordinates = fbItem._shape.getCoordinates();
		let i;

		function applyFactor(factor, lsize) {
			const newpoint = tmppoint.setTo(factor);
			newpoint.set(newpoint.x * lsize.x, newpoint.y * lsize.y);
			newselbbox.rotateLocalPoint(newpoint);
			newpoint.add(origin);
			return newpoint;
		}

		// new shape points:
		for (i = 0; i < coordinates.length; i += 1) {
			const factorPt = this._resizeFactors[i];
			if (factorPt !== undefined) {
				const newpoint = applyFactor(this._resizeFactors[i], size);
				fbItem.translateFromParent(newpoint);
				coordinates[i].set(newpoint.x, newpoint.y);
			}
		}
	}

	getPoints() {
		return this.getFeedbackItem().getPoints();
	}

	getPointsCount() {
		return this.getFeedbackItem().getPointsCount();
	}

	getEndPoint(reusepoint) {
		return this.getFeedbackItem().getEndPoint(reusepoint);
	}

	setEndPointTo(point) {
		this.detachFromTarget();
		this.getFeedbackItem().setEndPointTo(point);
	}

	getStartPoint(reusepoint) {
		return this.getFeedbackItem().getStartPoint(reusepoint);
	}

	setStartPointTo(point) {
		this.detachFromSource();
		this.getFeedbackItem().setStartPointTo(point);
	}

	setPointAt(index, point) {
		const fbItem = this.getFeedbackItem();
		if (index === 0) {
			this.detachFromSource();
		} else if (index === fbItem.getPointsCount() - 1) {
			this.detachFromTarget();
		}

		fbItem.setPointAt(index, point);
	}

	getPointAt(index, reusepoint) {
		return this.getFeedbackItem().getPointAt(index, reusepoint);
	}

	setSourcePort(port) {
		this.getFeedbackItem().setSourcePort(port);
		// we listen to node changes...
		if (this.doAutoLayout && port.getParent() !== undefined) {
			// port.getParent().addPropertyListener(this);
			this._nodeListener.registerTo(port.getParent());
		}
	}

	setTargetPort(port) {
		this.getFeedbackItem().setTargetPort(port);
		// we listen to node changes...
		if (this.doAutoLayout && port.getParent() !== undefined) {
			// port.getParent().addPropertyListener(this);
			this._nodeListener.registerTo(port.getParent());
		}
	}

	detach() {
		this.detachFromSource();
		this.detachFromTarget();
	}

	detachFromSource() {
		const fbItem = this.getFeedbackItem();
		const port = fbItem.getSourcePort();
		if (port !== undefined) {
			const startcoord = fbItem.getStartCoordinate().createNewCoordinate();
			fbItem.detachPort(port);
			fbItem.setStartCoordinateTo(startcoord);

			fbItem.hasSourceAttached = () => false;
			fbItem.getSourcePort = () => undefined;

			this._nodeListener.deregisterFrom(port.getParent());
		}
	}

	detachFromTarget() {
		const fbItem = this.getFeedbackItem();
		const port = fbItem.getTargetPort();
		if (port !== undefined) {
			const endcoord = fbItem.getEndCoordinate().createNewCoordinate();
			fbItem.detachPort(port);
			fbItem.setEndCoordinateTo(endcoord);
			fbItem.hasTargetAttached = () => false;
			fbItem.getTargetPort = () => undefined;
			this._nodeListener.deregisterFrom(port.getParent());
		}
	}

	onNodeChange(node) {
		const fbItem = this.getFeedbackItem();
		fbItem.layout();
		fbItem.refresh();
	}

	isStartOrEndPointIndex(index) {
		return index === 0 || index === this.getFeedbackItem().getPointsCount() - 1;
	}

	createCoordinateProxyAt(location, coord) {
		const proxyCoord = new CoordinateProxy(coord);
		// location = fbItem.translateFromParent(location.copy());
		proxyCoord.location = location.copy();
		// don't allow to change original coordinate:
		/* eslint-disable func-names */
		proxyCoord.setX = function(value) {};
		proxyCoord.setY = function(value) {};
		proxyCoord.evaluate = function(item) {};
		// no evaluate needed, we work on points...
		// override copy to return a normal coordinate, otherwise it might could be that original coordinate could be
		// changed!!:
		proxyCoord.copy = function() {
			const copy = new Coordinate();
			copy.setToPoint(this.toPoint());
			return copy;
		};

		proxyCoord.toPoint = function(reusepoint) {
			return reusepoint !== undefined ? reusepoint.setTo(this.location) : this.location.copy();
		};
		/* eslint-enable func-names */
		return proxyCoord;
	}

	draw(graphics) {
		// refresh edge before draw, to ensure correct coordinates: (FIX for jumping fb on multiple move...)
		this._fbItem.refresh();
		if (this._fbView !== undefined) {
			this._fbView.draw(graphics);
		}
	}
}


export default EdgeFeedback;
