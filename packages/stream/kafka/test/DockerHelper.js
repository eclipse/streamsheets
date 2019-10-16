const path = require('path');
const compose = require('docker-compose');

const COMPOSE_OPTIONS = {
  cwd: path.join(__dirname),
  log: true,
  config: 'docker-compose.yml'
};

const startAll = async (rPath) => {
  const options = {
    ...COMPOSE_OPTIONS,
    config: rPath || COMPOSE_OPTIONS.config
  };
  const { out, err } = await compose.upAll(options);
  if (err) {
    console.error(err);
    return false;
  }
  console.log(out);
  return true;
};

const stopAll = async (rPath) => {
  const options = {
    ...COMPOSE_OPTIONS,
    config: rPath || COMPOSE_OPTIONS.config
  };
  const { out, err } = await compose.stop(options);
  if (err) {
    console.error(err);
    return false;
  }
  console.log(out);
  return true;
};

const startService = async (service, rPath) => {
  const options = {
    ...COMPOSE_OPTIONS,
    config: rPath || COMPOSE_OPTIONS.config
  };
  const { out, err } = await compose.upOne(service, options);
  if (err) {
    console.error(err);
  }
  console.log(out);
};

const stopServices = (rPath) => {
  const options = {
    ...COMPOSE_OPTIONS,
    config: rPath || COMPOSE_OPTIONS.config
  };
  return compose.stop(options);
};

module.exports = {
  startService,
  stopServices,
  startAll,
  stopAll
};
