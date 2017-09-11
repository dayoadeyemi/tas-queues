"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Queues_1 = require("./Queues");
const Task_1 = require("./Forms/Task");
const UserSettings_1 = require("../Views/Forms/UserSettings");
const Modal_1 = require("./Modal");
const Layout_1 = require("./Layout");
const LiveView = (user, tasks) => {
    const taskFormModal = new Modal_1.default('New Task', Task_1.default({}));
    const settingsFormModal = new Modal_1.default('Settings', UserSettings_1.default(user));
    return Layout_1.default({
        navLinks: [
            { path: '/', text: 'Live', active: true },
            { path: '/report', text: 'Report' },
            { path: '/settings', text: 'Settings' },
        ],
        navContent: `
            <button type="button" class="btn btn-secondary" ${taskFormModal.toggleParams()}>
                <span>Add Task</span>
            </button>`,
        body: `
            <div>
                ${Queues_1.default(tasks)}
            </div>
            ${taskFormModal}
            ${settingsFormModal}
            <script src="/app.js"></script>
        `
    });
};
exports.default = LiveView;
//# sourceMappingURL=Main.js.map