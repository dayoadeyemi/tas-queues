"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const Task_1 = require("../Task");
const Users_1 = require("../Users");
exports.pConnection = typeorm_1.createConnection(Object.assign({
    synchronize: true,
    entities: [Task_1.TaskModel, Users_1.UserModel],
    autoSchemaSync: true,
    logging: []
}, process.env.NODE_ENV !== 'development' ? {
    type: 'postgres',
    url: process.env.DATABASE_URL
} : {
    type: 'sqlite',
    database: ".db",
}));
exports.tasks = new Task_1.TaskController(exports.pConnection);
exports.users = new Users_1.UserController(exports.pConnection);
//# sourceMappingURL=index.js.map