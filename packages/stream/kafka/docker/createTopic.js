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
