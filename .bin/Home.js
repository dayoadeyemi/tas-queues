"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = require("./Queue");
const Task_1 = require("./Task");
const Users_1 = require("./Users");
const Modal_1 = require("./Modal");
const ramda_1 = require("ramda");
const getYesterdayString = () => {
    const yesterday = new Date(new Date().toISOString().slice(0, 10));
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
};
exports.NavBar = (text = '') => `
<nav class="navbar navbar-light bg-faded">
    <a href="/"><h1 class="navbar-brand mb-0">Todo Live</h1></a>
    <span class="navbar-text">
        ${text}
    </span>
</nav>`;
exports.HomeView = (user, tasks, state) => {
    const taskFormModal = new Modal_1.Modal('New Task', Task_1.TaskForm({}));
    const settingsFormModal = new Modal_1.Modal('Settings', Users_1.SettingsForm(user));
    const queues = ramda_1.sortBy(ramda_1.head, ramda_1.toPairs(ramda_1.groupBy(ramda_1.prop('queue'), tasks)))
        .map((([name, tasks]) => new Queue_1.QueueView({ name, tasks }, state)));
    return `
        ${exports.NavBar(`
        ${state === 'report' ? `
        <a href="/">
            <button type="button" class="btn btn-outline-secondary">
                <span>Exit Report</span> 
            </button>
        </a>` : `
        <a href="/?report=${getYesterdayString()}">
            <button type="button" class="btn btn-outline-secondary">
                <span>Report</span> 
            </button>
        </a>
        <button type="button" class="btn btn-outline-primary" ${taskFormModal.toggleParams()}>
            <span>Add Task</span> 
        </button>
        <button type="button" class="btn btn-outline-primary" ${settingsFormModal.toggleParams()}>
            <span>Settings</span> 
        </button>`}`)}
        <div>
            ${queues.join('\n')}
        </div>
        ${taskFormModal}
        ${settingsFormModal}
    `;
};
//# sourceMappingURL=Home.js.map