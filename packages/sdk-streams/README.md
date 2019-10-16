

# sdk-streams

The *Stream SDK* is an SDK for developing streams aiming at extending connectivity of Streamsheet® core. 

## Introduction
This SDK is an abstraction mechanism for connecting (input and output) potentially any kind of data which can be translated to a [stream (sequence of data elements made available over time)](https://en.wikipedia.org/wiki/Stream_%28computing%29). The development of this SDK has followed the [Publish-Subscribe pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) and has been inspired mostly by the leading IoT technologies MQTT and [Kafka](https://kafka.apache.org/protocol). A Streamsheet® stream can consist of the following 3 basic elements:

 - **Provider** is the central (and single mandatory JS class) exposed component which is loaded and used by the *Streams Service* in order to provide its functionality through the following active components. A provider configuration is a *JSON* object that declares all required configuration *fields* including their types, inter-dependencies, defaults and some behaviors. The provider configuration is being used for generating automatically the configuration UI forms for managing such streams through the administration of Streamsheet® core. So, a provider configuration provides the configuration of the following components.
 - **Connector** is the basic element of either a **Consumer** or **Producer**. The purpose of this component is twofold
 	- keep the basic and reusable configuration for connecting to a data stream
	- play the role of a "leader" component and control all linked streams (Consumer or Producer)
 - **Consumer** is the an active component aiming at consuming a data stream. The consumer class overrides both the configuration and functionality of a linked Connector by offering additional functionality based on additional configuration (e.g. subscribe to a specific topic). 
 - **Producer** is the an active component aiming at producing a data stream. The producer class overrides both the configuration and functionality of a linked Connector by offering additional functionality based on additional configuration (e.g. publish to a specific topic). A Producer can be used by Streamsheet® through one of the generic functions `PRODUCE`, `REQUEST`, `RESPOND` or a stream specific function / alias defined in current stream's provider configuration.

## Quick Start
This guide aims at giving you the essential knowledge for building your first Streamsheet® stream. As already mentioned a stream can only consume or produce so you can omit not related steps. In addition, the API is flexible enough to be used in different ways. However, we recommend to follow the demonstrated approach.

 ### 1. Create a new stream module
 
 Note: the package name must be unique as this will be used as identifier.
 
 ### 2. Define your provider configuration

 Add configuration fields for Connector, Consumer and Producer Configurations through the `ProviderConfiguration` API.

```javascript
module.exports = class MyProviderConfiguration extends sdk.ProviderConfiguration {
  constructor() {
    super({
     name: 'My Provider name'
    });
    this.canProduce = true; // can produce : default value=true
    this.canConsumer = true; // can consume : default value=true
    this.addConnectorDefinition({  // see Field configuration options
      id: 'version',  
      label: {
        en: 'Version',
        de: 'Version'
      }  
      type: sdk.ProviderConfiguration.FIELDTYPES.TEXT,  
      defaultValue: 'an advanced value',  
      advanced: true  // show under advanced menu
    });
    this.addConsumerDefinition({  
      id: 'someNumericOption',  
      label: 'someNumericOption',  
      help: {  // show hint on the UI
        en: 'Help',  
        de: 'Hilfe'  
      }, 
      type: sdk.ProviderConfiguration.FIELDTYPES.SELECT_NUM,  
        options: [  
          {
            label: {
              en: "One"
            },
            value: 1
          },  
          {  
            label: "Two",
            value: 2
          }
        ],  
        defaultValue: 4, 
    });
    this.addProducerDefinition({  
      id: 'producer1',  
      label: ''  
      type: sdk.ProviderConfiguration.FIELDTYPES.TEXTLIST  
      dependsOnPath: 'connector.version', // show if connector config with id version  
      dependsOnValue: ['val1', 'val2']   // equal one of these values
    });
  }
};
```
 ### 3. Implement your connector

 Create a subclass from the `Connector` class:
 
```javascript
module.exports = class MyConnector extends sdk.Connector {
  // Configuration is either the consumer or producer configuration.
  constructor(config) {
    super(config);
    // Initialize class variables.
	// Use config.connector to get connector configuration.
    this._client = null;
  }
  async connect() {
    try {
  	  // disable possible client reconnect
	  this._client = await someClient.connect();
	  // this triggers the connect event and 
	  // signals for next step in the stream life cycle
      this.setConnected(); 
    } catch (e) {
	  // this will record an error and report this to the UI
	  this.handleError(e);
	  // calling this without argument will trigger abstract reconnect mechanism
      this.onClose();
    }
  }
  async dispose() {
    return new Promise((res, rej) => {
    // dispose and unregister all
  }
};
```
 
 ### 4. Implement your Consumer 
 
 ```javascript
module.exports = class MyConsumer extends sdk.ConsumerMixin(MyConnector) {
  constructor(config) {
    super({ ...config, type: sdk.Connector.TYPE.CONSUMER });
  }
  // this is called my the connector on 'connect'
  async initialize() {
    return new Promise((res, rej) => {
      // possible subscriptions, register listeners etc.
    });
  }
  async dispose() {
    // more disposing
    return super.dispose();
  }
};
 ``` 
 
### 5. Implement your Producer 

 ```javascript
module.exports = class MyProducer extends sdk.ProducerMixin(MyConnector) {
  constructor(config) {
		super({ ...config, type: sdk.Connector.TYPE.PRODUCER });
  }
  async produce(config) {
    const {arg1,arg2,...} = config;
    if (this.connected) {
      return new Promise((res, rej) => {
      try {
        await this.client.produce();
        return res();
       } catch (err) {
         this.handleErrorOnce(new Error('Cannot produce as not connected yet'));
	 return rej(err)
       }
       return false;
    });
    }
  }
  async dispose() {
    // more disposing
    return super.dispose();
  }
};
 ```

 ### 6. Extend Provider to use your Provider Configuration, Consumer and /or Producer and export the new Provider 

```javascript
module.exports = class MyProvider extends sdk.Provider {  
  constructor() {  
    super(new MyProviderConfiguration());  
  }  
  get Consumer() {  
     return MyConsumer;  
  } 
  get Producer() {  
    return MyProducer;  
  }  
};
```

Add in your `index`:

```javascript
module.exports = {
  Provider: MyProvider
}
```

 ### 7. Test your stream

Basic testing should perform a pub/sub example if applicable. You can use the `TestHelper` class as base.

```javascript
const { result } = await sdk.TestHelper.testPubSub({
  streamModule,
  producerConfig,
  consumerConfig,
  produceConfig
});
expect(result).not.toEqual(false);
if (result) {
  expect(result.message.data).toEqual(produceConfig.message);
}
```

### Events

#### Connector Events (inherited by consumer and producer)

##### Event 'connect'
`function (connector) {}`

Emitted on successful connection.
- `connector`: connected stream instance

#####  Event 'ready'

Emitted on successful initialization

#####  Event 'connector_error'
`function (error) {}`

Emitted on error

#####  Event 'connector_warning'
`function (warning) {}`

Emitted on warning

#####  Event 'update'
`function (config) {}`

Emitted on update of the configuration

#####  Event 'persist'
`function (config) {}`

Emitted when persist is requires - triggers model persisting

#####  Event 'disposed'
`function () {}`

Emitted after a stream has been disposes

#####  Event 'close'
`function ([reason]) {}`

Emitted on close of stream. If no reason given stream will try to `connect()` based on abstract algorithm.

#### Consumer Events
#####  Event 'message'
`function (source, message, streamId) {}`

Emitted on message received. 
- `source`: a string defining the source of message (e.g. an MQTT topic)
- `message`: the message itself. If `onMessage` function is not overridden (override should be avoided) `message` will be the transformed message based on internal expected structure (see `Message`) populated with metadata and transformed to the appropriate mime type based on stream configuration (`config.mimeType` | default: `application/json`)

#####  Event 'respond'
`function (config) {}`

Emitted on respond received. This can be triggered by `RESPOND` Streamsheet® function and return a `json` object
- `config`: the `json` object

#### Producer
#####  Event 'produce'
`function (config) {}`

Emitted on respond received. This can be triggered by `PRODUCE` Streamsheet® function and return a `json` object
- `config`: the `json` object. This is expected to contain at least a `message` object which will be prepared (appropriate structure, format and meta) for transmission to the data stream.
- 
#####  Event 'request'
`function (config) {}`

Emitted on respond received. This can be triggered by `REQUEST` Streamsheet® function and return a `json` object
- `config`: the `json` object

## More advanced topics

### Stream functions
TODO 

### Message data and meta
TODO 

### Reconnect
TODO

## API
TODO
