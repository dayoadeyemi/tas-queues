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
        navContent: `
            <a href="/">
                <button type="button" class="btn btn-outline-secondary">
                    <span>Exit Report</span> 
                </button>
            </a>`,
        body: `
            <div>
                ${Queues_1.default(tasks)}
            </div>
            ${taskFormModal}
            ${settingsFormModal}
        `
    });
};
exports.default = ReportView;
//# sourceMappingURL=Report.1.js.map