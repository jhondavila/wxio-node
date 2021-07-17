import { machineIdSync } from "node-machine-id";
import os from 'os';

export default {
    hostUUID() {
        return machineIdSync();
    },
    getHostname() {
        return os.hostname();
    }
};