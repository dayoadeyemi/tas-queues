"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Queues_1 = require("./Queues");
const Task_1 = require("./Forms/Task");
const UserSettings_1 = require("../Views/Forms/UserSettings");
const Modal_1 = require("./Modal");
const Layout_1 = require("./Layout");
const ReportView = (user, tasks) => {
    const taskFormModal = new Modal_1.default('New Task', Task_1.default({}));
    const settingsFormModal = new Modal_1.default('Settings', UserSettings_1.default(user));
    return Layout_1.default({
        navLinks: [
            { path: '/', text: 'Live' },
            { path: '/report', text: 'Report', active: true },
            { path: '/settings', text: 'Settings' },
        ],
        body: `
            <div>
                ${Queues_1.default(tasks)}
            </div>
            ${taskFormModal}
        `
    });
};
exports.default = ReportView;
//# sourceMappingURL=Report.js.map