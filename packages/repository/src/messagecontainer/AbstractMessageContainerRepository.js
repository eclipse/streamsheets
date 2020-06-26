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

/* eslint no-unused-vars: "off" */
/**
 * An abstract class representing a repository to access message containers.
 *
 * @class AbstractMachineRepository
 * @public
 */
module.exports = class AbstractMessageContainerRepository {
  /**
   * A method to get all the message containers stored in the repository.
   *
   * @method getMessageContainers
   * @public
   * @return {Array} An array of all the message containers.
   */
	getMessageContainers() {
		return new Promise((resolve, reject) => {
			resolve([]);
		});
	}

  /**
   * A method to save a new message container into the repository.
   *
   * @method saveMessageContainer
   * @param {MessageContainer} messageContainer - The message container to save.
   * @public
   * @return {Array} An array of all the message containers.
   */
	saveMessageContainer(machine) {
		return new Promise((resolve, reject) => {
			resolve([]);
		});
	}

  /**
   * A method to find a message container from the repository by its id.
   *
   * @method findMessageContainer
   * @param {String} id - The id of the message container.
   * @public
   * @return {MessageContainer} The message container with the given id.
   */
	findMessageContainer(id) {
		return new Promise((resolve, reject) => {
			resolve({});
		});
	}

  /**
   * A method to update a message container in the repository.
   *
   * @method updateMessageContainer
   * @param {MessageContainer} messageContainer - The message container to update.
   * @public
   * @return {MessageContainer} The updated message container.
   */
	updateMessageContainer(machine) {
		return new Promise((resolve, reject) => {
			resolve({});
		});
	}
};
