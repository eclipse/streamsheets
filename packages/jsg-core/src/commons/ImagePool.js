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
/* global Image window */

const Arrays = require('./Arrays');
const Dictionary = require('../commons/Dictionary');
const Notification = require('../graph/notifications/Notification');
const NotificationCenter = require('../graph/notifications/NotificationCenter');

const IMAGES_LOADED_NOTIFICATION = 'jsg.images.loaded.notification';

/**
 * The ImagePool class manages images loaded from the server. Any Image loaded from the
 * server used for display in pattern fills or other items will be pooled and only be
 * loaded once. Its primarily intended for internal use.
 *
 * @class ImagePool
 * @private
 * @constructor
 */
class ImagePool extends Dictionary {
	constructor() {
		super();
		// editors to be invalidated, if an image is successfully loaded
		this._views = [];
		this._imagesToBeLoaded = 0;
	}

	static get IMAGES_LOADED_NOTIFICATION() {
		return IMAGES_LOADED_NOTIFICATION;
	}

	/**
	 * Adds a new image to the image pool for the given url, if the image is not already available. If an image
	 * with the given url is already available in the pool, the existing image will be returned. Otherwise the
	 * image is loaded from the server and added to the pool Upon completion all registered graphs are invalidated.
	 *
	 * @method add
	 * @param {String} url URL pointing to an image on the server.
	 * @param {String} [key] Identifier for image. If not given, the url is used.
	 * @return {Image} Returns the new image. It may not be loaded directly upon return.
	 */
	add(url, key) {
		if (url === 0) {
			return undefined;
		}
		const uri = url.indexOf('data:image') !== -1;

		if (key === undefined) {
			if (uri) {
				// not allowed
				return undefined;
			}
			key = url;
		}

		if (this.contains(key)) {
			return this.get(key);
		}

		return this.set(url, key);
	}

	/* eslint-disable */
	getNewId() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}
	/* eslint-enable */

	getURL(key) {
		if (this.contains(key)) {
			return this.get(key).src;
		}
		return undefined;
	}

	/**
	 * Sets an new image to the image pool for the given key. The image is loaded from the server and added to the pool
	 * Upon completion all registered graphs are invalidated.
	 * @method set
	 * @param {String} url URL pointing to an image on the server.
	 * @param {String} key Identifier for image.
	 * @return {Image} Returns the new image. It may not be loaded directly upon return.
	 */
	set(url, key) {
		if (url === 0) {
			return undefined;
		}

		let image;
		try {
			image = new Image();

			if (key !== 'uriimage') {
				this._imagesToBeLoaded += 1;
			}
			image._jsgKey = key;

			image.onerror = () => {
				this._imagesToBeLoaded -= 1;
				if (this._imagesToBeLoaded <= 0) {
					NotificationCenter.getInstance().send(
						new Notification(IMAGES_LOADED_NOTIFICATION, this)
					);
				}
			};

			image.onload = () => {
				// invalidate previously registered editors
				this._imagesToBeLoaded -= 1;
				if (this._imagesToBeLoaded === 0) {
					this._views.forEach((view) => {
						view.invalidate();
					});
					NotificationCenter.getInstance().send(
						new Notification(IMAGES_LOADED_NOTIFICATION, this)
					);
				}
			};
		} catch (e) {
			image = {};
		}

		image.src = url;

		this.put(key, image);

		return image;
	}

	update(url, params) {
		if (url === 0) {
			return;
		}

		const imageOld = this.get(url);
		if (imageOld) {
			if (imageOld._loaded === false) {
				return;
			}
			if (imageOld._lastURL === `${url}?${params}`) {
				// / no change
				return;
			}
		}

		const image = new Image();

		image._jsgKey = url;
		image._lastURL = `${url}?${params}`;
		image._loaded = false;
		image._backupImage = imageOld;
		this.put(url, image);

		image.onload = () => {
			// invalidate previously registered editors
			image._loaded = true;
			this._views.forEach((view) => {
				view.invalidate();
			});
		};

		image.src = `${url}?${params}`;
	}

	allImagesLoaded() {
		return this._imagesToBeLoaded <= 0;
	}

	/**
	 * Validating an URL.
	 * @method validateURL
	 * @param {Object} url
	 * @return {Boolean} True, if URL is valid, false, if not.
	 */
	validateURL(url) {
		return url.match(/^\S+\.(gif|jpg|jpeg|png|JPG|JPEG|PNG|GIF)$/);
	}

	/**
	 * Register an editor. All registered editors are invalidated, when an image is loaded from the image pool.
	 *
	 * @method registerEditor
	 * @param {Object} editor
	 */
	registerEditor(editor) {
		this._views.push(editor);
	}

	/**
	 * Deregister an editor. A registered editor has to be unregistered to free resources.
	 *
	 * @method unregisterEditor
	 * @param {Object} editor
	 */
	unregisterEditor(editor) {
		Arrays.remove(this._views, editor);
	}

	// PREDEFINED IMAGES:

	static get IMG_NOTAVAIL() {
		return 'notavailable';
	}

	static get IMG_EXPANDED() {
		return 'expanded';
	}

	static get IMG_COLLAPSED() {
		return 'collapsed';
	}

	static get IMG_BOLD() {
		return 'bold';
	}

	static get IMG_ITALIC() {
		return 'italic';
	}

	static get IMG_UNDERLINE() {
		return 'underline';
	}

	static get IMG_LEFT_ALIGN() {
		return 'leftalign';
	}

	static get IMG_CENTER_ALIGN() {
		return 'centeralign';
	}

	static get IMG_RIGHT_ALIGN() {
		return 'rightalign';
	}

	static get IMG_FONTCOLOR() {
		return 'fontcolor';
	}

	static get IMG_FONTSIZE_DOWN() {
		return 'fontsizedown';
	}

	static get IMG_FONTSIZE_UP() {
		return 'fontsizeup';
	}

	static get IMG_BULLETS() {
		return 'bullets';
	}

	static get IMG_NUMBERED() {
		return 'numbered';
	}

	static get IMG_TREE_CHECKED() {
		return 'treechecked';
	}

	static get IMG_TREE_UNCHECKED() {
		return 'treeunchecked';
	}

	static get SVG_CHECKED() {
		return 'checked';
	}

	static get SVG_UNCHECKED() {
		return 'unchecked';
	}

	static get SVG_DELETE() {
		return 'delete';
	}

	static get SVG_CREATE_EDGE() {
		return 'edge';
	}

	static get SVG_CREATE_HVEDGE() {
		return 'hvedge';
	}

	static get SVG_MOVE_UP() {
		return 'arrowup';
	}

	static get SVG_MOVE_DOWN() {
		return 'arrowdown';
	}

	static get SVG_MOVE_LEFT() {
		return 'arrowleft';
	}

	static get SVG_MOVE_RIGHT() {
		return 'arrowright';
	}

	static get SVG_FILTER() {
		return 'filter';
	}
}

module.exports = ImagePool;
