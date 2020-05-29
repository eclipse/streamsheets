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
/* global document */

import { Arrays, Dictionary } from '@cedalo/jsg-core';

/**
 * The DocumentEventDispatcher object is used to register listener functions for global, aka. document, events.</br>
 * @class DocumentEventDispatcher
 */
const DocumentEventDispatcher = (() => {
	const funcsMap = new Dictionary();

	const getEntriesFor = (evtstr) => {
		let entries = funcsMap.get(evtstr);
		if (!entries) {
			entries = [];
			funcsMap.put(evtstr, entries);
		}
		return entries;
	};

	const getEntryFor = (scope, allEntries) => {
		let i;
		let entry;

		for (i = 0; i < allEntries.length; i += 1) {
			if (allEntries[i].scope === scope) {
				entry = allEntries[i];
				break;
			}
		}
		return entry;
	};

	const newEntry = (scope, func) => ({ scope, func });

	const dispatchEvent = (evstr) => (event) => {
		let i;
		const entries = getEntriesFor(evstr);
		for (i = 0; i < entries.length; i += 1) {
			const entry = entries[i];
			entry.func.call(entry.scope, event);
		}
	};

	// public functions:
	return {
		/**
		 * Registers given function for specified event string. The function is called with given scope object and gets
		 * native event object as sole parameter.</br>
		 * Note: only one function per event and scope can be registered. But it is possible to register several
		 * functions for same event if they have different scope.
		 *
		 * @method addEventListener
		 * @param {String} evstr A string which defines the event to register function for.
		 * @param {Object} scope The scope object to call the function with.
		 * @param {Function} func The function to call when specified event occurs.
		 */
		addEventListener(evstr, scope, func) {
			if (evstr && scope && func) {
				const entries = getEntriesFor(evstr);
				const entry = getEntryFor(scope, entries);
				if (!entry) {
					entries.push(newEntry(scope, func));
				}
				if (entries.length === 1) {
					document[evstr] = dispatchEvent(evstr);
				}
			}
		},
		/**
		 * Removes registered function for given event and scope.
		 *
		 * @method removeEventListener
		 * @param {String} evstr A string which defines the event to remove the listener function for.
		 * @param {Object} scope The scope object of listener function to remove.
		 */
		removeEventListener(evstr, scope) {
			if (evstr && scope) {
				const entries = getEntriesFor(evstr);
				const entry = getEntryFor(scope, entries);
				Arrays.remove(entries, entry);
				if (entries.length === 0) {
					document[evstr] = undefined;
				}
			}
		}
	};
})();

export default DocumentEventDispatcher;
