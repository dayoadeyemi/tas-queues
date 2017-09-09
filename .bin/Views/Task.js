"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Task_1 = require("./Forms/Task");
const showdown_1 = require("showdown");
const Modal_1 = require("./Modal");
const converter = new showdown_1.Converter();
exports.TaskView = (task) => {
    const modal = new Modal_1.default('Edit Task', Task_1.default(task));
    return `
        <form action="/tasks/${task.id}/archive" method="post" onsubmit="cleanupListeners()">
        <button type="submit" class="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </form>
    <a id="${task.id}" ${modal.toggleParams()}>
        <b>${task.title}</b> (${task.estimate || 1})
        <div>${converter.makeHtml(task.description)}</div>
    </a>
    ${modal}`;
};
exports.default = exports.TaskView;
//# sourceMappingURL=Task.js.map