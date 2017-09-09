"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Tasks_1 = require("./Tasks");
const Users_1 = require("./Users");
const pConnection_1 = require("./pConnection");
exports.tasks = new Tasks_1.default(pConnection_1.default);
exports.users = new Users_1.default(pConnection_1.default);
exports.pConnection = pConnection_1.default;
//# sourceMappingURL=index.js.map