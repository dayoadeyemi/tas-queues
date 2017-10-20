"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Task_1 = require("../Models/Task");
const events_1 = require("events");
class TaskController {
    constructor(connection) {
        this.connection = connection;
        this.events = new events_1.EventEmitter();
        this.events.addListener(`/tasks`, (task) => __awaiter(this, void 0, void 0, function* () {
            const highest = yield this.highest(task.userId);
            if (!highest ||
                (task.archivedAt && task.queue < highest.queue && task.priority > highest.priority) ||
                task.id === highest.id) {
                this.events.emit(`/tasks/latest`, highest);
            }
        }));
    }
    addLatestListener(listener) {
        this.events.addListener(`/tasks/latest`, listener);
    }
    addListener(userId, listener) {
        this.events.addListener(`/users/${userId}/tasks`, listener);
    }
    removeListener(userId, listener) {
        this.events.removeListener(`/users/${userId}/tasks`, listener);
    }
    update(where, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection).manager.update(Task_1.default, where, updates);
        });
    }
    archive(userId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [task] = yield (yield this.connection)
                .getRepository(Task_1.default)
                .createQueryBuilder('task')
                .where("userId = :userId AND id = :id", { userId, id })
                .update({ archivedAt: new Date() })
                .returning('*')
                .execute();
            this.events.emit(`/tasks`, task);
        });
    }
    report(userId, archivedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .getRepository(Task_1.default)
                .createQueryBuilder('task')
                .where("task.userId = :userId AND task.deletedAt IS NULL AND task.archivedAt > :archivedAt", {
                userId, archivedAt
            })
                .orderBy({
                queue: 'ASC',
                priority: 'DESC'
            })
                .getMany();
        });
    }
    list(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection).manager.find(Task_1.default, {
                where: { userId, archivedAt: null, deletedAt: null },
                order: {
                    queue: 'ASC',
                    priority: 'DESC'
                }
            });
        });
    }
    highest(userId, where = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection).manager.findOne(Task_1.default, {
                where: Object.assign({
                    userId,
                    archivedAt: null,
                    deletedAt: null,
                }, where),
                order: {
                    queue: 'ASC',
                    priority: 'DESC'
                }
            });
        });
    }
    add(userId, task) {
        return __awaiter(this, void 0, void 0, function* () {
            task.userId = userId;
            if (!task.priority) {
                const highest = yield this.highest(userId, { queue: task.queue });
                task.priority = highest ? highest.priority + 1 : 0;
            }
            const saved = yield (yield this.connection).manager.save(task);
            this.events.emit(`/users/${userId}/tasks`, saved);
            this.events.emit(`/tasks`, saved);
            return saved;
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection).manager.findOneById(Task_1.default, id);
        });
    }
}
exports.default = TaskController;
//# sourceMappingURL=Tasks.js.map