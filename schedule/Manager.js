
import Scheduler from './Scheduler';
import Core from '../core';
let items = [];
let map = {

};

class SchedulerMgr {
    // items: items;
    // map: map;
    add(clsCt) {
        this.items = items;
        this.map = {};
        if (Core.isObject(clsCt) && !(clsCt instanceof Scheduler)) {
            let c;
            for (var p in clsCt) {
                c = new clsCt[p];
                if (!map[c.name]) {
                    items.push(c);
                    this.map[c.name] = c;
                } else {
                    new Error("Task Class Name existed");
                }
            }
        }
        return this;
    }
    remove() {

    }
    get(key) {
        return this.map[key];
    }
    addSchedule() {

    }
}


const singleton = new SchedulerMgr;

export default singleton;





// interface Square {
//     kind: "square";
//     size: number;
// }

// interface Rectangle {
//     kind: "rectangle";
//     width: number;
//     height: number;
// }

// interface Circle {
//     kind: "circle";
//     radius: number;
// }

// type Shape = Square | Rectangle | Circle;

// function area(s: Shape) {
//     // In the following switch statement, the type of s is narrowed in each case clause
//     // according to the value of the discriminant property, thus allowing the other properties
//     // of that variant to be accessed without a type assertion.
//     switch (s.kind) {
//         case "square": return s.size * s.size;
//         case "rectangle": return s.width * s.height;
//         case "circle": return Math.PI * s.radius * s.radius;
//     }
// }