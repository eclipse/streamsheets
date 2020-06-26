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

const execa = require('execa');
const assert = require('assert');

function createTopic (topicName, partitions, replicas) {
  assert(topicName);
  assert(partitions && partitions > 0);
  assert(replicas && replicas > 0);
  const topic = `${topicName}:${partitions}:${replicas}`;
  const createResult = execa('docker-compose', [
    'exec',
    'kafka',
    'bash',
    '-c',
    `KAFKA_CREATE_TOPICS=test1 KAFKA_PORT=9092 /usr/bin/create-topics.sh`
  ]);
  // createResult.stdout.pipe(process.stdout);
  return createResult;
}

createTopic('cedalo/test', 1, 1);

module.exports = createTopic;
