const protobuf = require('protobufjs');
const path = require('path');

module.exports = class ProtobufHandler {

    getProtobufFile() {
        const protoFile = process.env.STREAMSHEETS_PROTOBUF_FILE ? process.env.STREAMSHEETS_PROTOBUF_FILE : path.join(__dirname, 'sparkplug_b.proto');
        return protoFile;
    }

    getType() {
        return 'Any';
    }

    async init() {
        try {
            const root = protobuf.loadSync(this.getProtobufFile());
            this.root = root;
            this.type = this.root.lookupType(this.getType());
        } catch (error) {
            console.log(__dirname);
            console.error(error);
        }
    }

    getMessageTypes() {
        return this.root.nested;
    }

    handleMessage(message, options) {
        try {
            return this.type.decode(message);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

}
