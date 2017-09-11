"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
const TaskForm = (task) => Utils_1.Form({
    id: task.id,
    action: '/tasks',
    cta: task ? 'Save' : 'Create',
    children: [
        Utils_1.Input({ type: 'text', id: 'title', value: task.title, name: 'Title' }),
        Utils_1.Input({ type: 'text', id: 'queue', value: task.queue, name: 'Queue' }),
        Utils_1.Input({ type: 'number', id: 'estimate', value: task.estimate, name: 'Estimate' }),
        Utils_1.Input({ type: 'textarea', id: 'description', value: task.description, name: 'Description' })
    ]
});
exports.default = TaskForm;
//# sourceMappingURL=Task.js.map