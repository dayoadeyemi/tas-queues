"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Task_1 = require("./Forms/Task");
const showdown_1 = require("showdown");
const Modal_1 = require("./Modal");
const timeago_js_1 = require("timeago.js");
const ta = timeago_js_1.default();
const converter = new showdown_1.Converter();
exports.TaskView = (task) => {
    const modal = new Modal_1.default('Edit Task', Task_1.default(task));
    return `
    <div class="d-flex w-100 justify-content-between">
        <span>
            <small class="text-muted">${ta.format(task.createdAt)}</small>
            <a id="${task.id}" ${modal.toggleParams()}>
                <h5 class="mb-1"><b>${task.title}</b> (${task.estimate || 1})</h5>
            </a>
        </span>
        <form action="/tasks/${task.id}/archive" method="post" onsubmit="cleanupListeners()">
            <button type="submit" class="close" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </form>
    </div>
    <div>${converter.makeHtml(task.description)}</div>
    ${modal}`;
};
exports.default = exports.TaskView;
//# sourceMappingURL=Task.js.map