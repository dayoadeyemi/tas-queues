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
const crypto_1 = require("crypto");
const User_1 = require("../Models/User");
const hashpass = (password, salt) => new Promise((resolve, reject) => crypto_1.pbkdf2(password, salt, 100000, 512, 'sha512', (err, derivedKey) => err ? reject(err) : resolve(derivedKey.toString('hex'))));
const slowEquals = (a, b) => {
    let diff = a.length ^ b.length;
    for (let i = 0; i < a.length && i < b.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
};
const randomBytesAsync = (n) => new Promise((resolve, reject) => crypto_1.randomBytes(n, (err, buf) => err ? reject(err) : resolve(buf.toString('base64'))));
class UserController {
    constructor(connection) {
        this.connection = connection;
    }
    create(settings, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const salt = yield randomBytesAsync(16);
            const hash = yield hashpass(password, salt);
            return yield (yield this.connection)
                .manager.save(new User_1.default({
                username: settings.username,
                slackUserId: settings.slackUserId,
                githubUserName: settings.githubUserName,
                hash,
                salt
            }));
        });
    }
    verify(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield (yield this.connection)
                .manager.findOne(User_1.default, { username });
            return user && slowEquals(user.hash, yield hashpass(password, user.salt)) ? user : null;
        });
    }
    updateSettings(userId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.updateById(User_1.default, userId, settings);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.findOne(User_1.default, { id });
        });
    }
    getByGitHubUserName(githubUserName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.findOne(User_1.default, { githubUserName });
        });
    }
    createSlackOathState(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const slackOauthState = yield randomBytesAsync(16);
            yield (yield this.connection)
                .manager.updateById(User_1.default, id, { slackOauthState });
            return slackOauthState;
        });
    }
    getBySlackOathState(slackOauthState) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.findOne(User_1.default, { slackOauthState });
        });
    }
    getBySlackUserId(slackUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.findOne(User_1.default, { slackUserId });
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield (yield this.connection)
                .getRepository(User_1.default)
                .find();
            return users.map(({ id, username, slackUserId, githubUserName }) => ({ id, username, slackUserId, githubUserName }));
        });
    }
}
exports.default = UserController;
//# sourceMappingURL=Users.js.map