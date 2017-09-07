"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const Modal_1 = require("./Modal");
const Decorator_1 = require("./Decorator");
const FormUtils_1 = require("./FormUtils");
const events_1 = require("events");
const showdown_1 = require("showdown");
let TaskModel = class TaskModel extends Decorator_1.Decorator {
    constructor() {
        super(...arguments);
        this.queue = 'q1';
        this.estimate = 1;
        this.title = '';
        this.description = '';
    }
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn("uuid")
], TaskModel.prototype, "id", void 0);
__decorate([
    typeorm_1.Column("varchar")
], TaskModel.prototype, "userId", void 0);
__decorate([
    typeorm_1.Column("int")
], TaskModel.prototype, "priority", void 0);
__decorate([
    typeorm_1.CreateDateColumn("CURRENT_TIMESTAMP(6)")
], TaskModel.prototype, "createdAt", void 0);
__decorate([
    typeorm_1.Column("datetime", { nullable: true })
], TaskModel.prototype, "archivedAt", void 0);
__decorate([
    typeorm_1.Column("datetime", { nullable: true })
], TaskModel.prototype, "deletedAt", void 0);
__decorate([
    typeorm_1.Column("varchar", { default: 'q1' })
], TaskModel.prototype, "queue", void 0);
__decorate([
    typeorm_1.Column("int", { default: 1 })
], TaskModel.prototype, "estimate", void 0);
__decorate([
    typeorm_1.Column("varchar", { default: '' })
], TaskModel.prototype, "title", void 0);
__decorate([
    typeorm_1.Column("text", { default: '' })
], TaskModel.prototype, "description", void 0);
TaskModel = __decorate([
    typeorm_1.Entity('task', {
        orderBy: {
            queue: 'ASC',
            priority: 'DESC'
        }
    }),
    typeorm_1.Index('list', (task) => [task.userId, task.archivedAt, task.queue, task.priority], { unique: true })
], TaskModel);
exports.TaskModel = TaskModel;
class TaskController {
    constructor(connection) {
        this.connection = connection;
        this.events = new events_1.EventEmitter();
    }
    addListener(listener) {
        this.events.addListener('/tasks', listener);
    }
    removeListener(listener) {
        this.events.removeListener('/tasks', listener);
    }
    update(where, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection).manager.update(TaskModel, where, updates);
        });
    }
    report(userId, archivedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .getRepository(TaskModel)
                .createQueryBuilder('task')
                .where("task.userId = :userId AND task.deletedAt IS NULL AND task.archivedAt > :archivedAt", {
                userId, archivedAt
            })
                .orderBy({ priority: 'DESC' })
                .getMany();
        });
    }
    list(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection).manager.find(TaskModel, {
                where: { userId, archivedAt: null, deletedAt: null },
                order: { priority: 'DESC' }
            });
        });
    }
    add(userId, task) {
        return __awaiter(this, void 0, void 0, function* () {
            task.userId = userId;
            if (!task.priority) {
                const highest = yield (yield this.connection).manager.findOne(TaskModel, {
                    where: {
                        userId,
                        archivedAt: null,
                        deletedAt: null,
                        queue: task.queue,
                    },
                    order: { priority: 'DESC' }
                });
                task.priority = highest ? highest.priority + 1 : 0;
            }
            const saved = yield (yield this.connection).manager.save(task);
            this.events.emit('/tasks', saved);
            return saved;
        });
    }
}
exports.TaskController = TaskController;
const converter = new showdown_1.Converter();
exports.TaskView = (task) => {
    const modal = new Modal_1.Modal('Edit Task', exports.TaskForm(task));
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
exports.TaskForm = (task) => FormUtils_1.Form({
    id: task.id,
    action: '/tasks',
    children: [
        FormUtils_1.Input({ type: 'text', id: 'title', value: task.title, name: 'Title' }),
        FormUtils_1.Input({ type: 'text', id: 'queue', value: task.queue, name: 'Queue' }),
        FormUtils_1.Input({ type: 'number', id: 'estimate', value: task.estimate, name: 'Estimate' }),
        FormUtils_1.Input({ type: 'textarea', id: 'description', value: task.description, name: 'Description' })
    ]
});
//# sourceMappingURL=Task.js.map