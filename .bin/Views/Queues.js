"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Task_1 = require("../Views/Task");
const List_1 = require("./List");
const ramda_1 = require("ramda");
const Queues = (tasks) => {
    return [tasks]
        .map(ramda_1.groupBy(ramda_1.prop('queue')))
        .map($ => ramda_1.toPairs($))
        .map(ramda_1.sortBy(ramda_1.head))
        .map(ramda_1.map(([name, tasks]) => {
        const estimate = tasks.reduce((total, task) => total + task.estimate, 0);
        return `
            <div class="card">
                <div class="card-header" role="tab" id="heading-${name}">
                    <div class="row">
                        <div class="col">
                            <h5 data-toggle="collapse" href="#${name}-content" aria-expanded="true" aria-controls="${name}-content" style="color:inherit;">
                                <span> ${name.toUpperCase()}</span>
                            </h5>
                        </div>
                        <div class="col text-right">
                            <span>${tasks.length} task${tasks.length === 1 ? '' : 's'} (${estimate} point${estimate === 1 ? '' : 's'})</span>
                        </div>
                    </div>
                    
                </div>
                
                <div id="${name}-content" class="card-body collapse show" role="tabpanel" aria-labelledby="heading-${name}">
                    ${new List_1.default(tasks.map(Task_1.default))}
                </div>
            </div>
        `;
    }))[0]
        .join('\n');
};
exports.default = Queues;
//# sourceMappingURL=Queues.js.map