"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const Decorator_1 = require("../Decorator");
let TaskModel = class TaskModel extends Decorator_1.Decorator {
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
    typeorm_1.Column("timestamp", { nullable: true })
], TaskModel.prototype, "archivedAt", void 0);
__decorate([
    typeorm_1.Column("timestamp", { nullable: true })
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
exports.default = TaskModel;
//# sourceMappingURL=Task.js.map