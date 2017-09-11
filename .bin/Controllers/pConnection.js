"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const Task_1 = require("../Models/Task");
const User_1 = require("../Models/User");
const pConnection = typeorm_1.createConnection({
    synchronize: true,
    entities: [Task_1.default, User_1.default],
    autoSchemaSync: true,
    logging: [],
    type: 'postgres',
    url: process.env.DATABASE_URL,
});
exports.default = pConnection;
//# sourceMappingURL=pConnection.js.map