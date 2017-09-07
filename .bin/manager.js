"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controllers = require("./Controllers/");
const repl = require("repl");
repl.start().context.controllers = controllers;
//# sourceMappingURL=manager.js.map