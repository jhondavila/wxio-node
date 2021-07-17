import OS from './OS';
// import FS from './FS';

import * as FS from './FS';

let lCore = {
    ...FS.lCore
};

export { lCore }

export default {
    OS,
    FS: FS.default
}