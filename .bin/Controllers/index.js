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
const Tasks_1 = require("./Tasks");
const User_1 = require("../Models/User");
const Users_1 = require("./Users");
const pConnection_1 = require("./pConnection");
exports.deleteUser = (userId, password) => __awaiter(this, void 0, void 0, function* () {
    yield (yield pConnection_1.default).manager.remove(Task_1.default, { userId });
    yield (yield pConnection_1.default).manager.remove(User_1.default, { id: userId });
});
exports.tasks = new Tasks_1.default(pConnection_1.default);
exports.users = new Users_1.default(pConnection_1.default);
exports.pConnection = pConnection_1.default;
//# sourceMappingURL=index.js.map