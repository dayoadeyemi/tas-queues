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
const crypto_1 = require("crypto");
const Decorator_1 = require("./Decorator");
const FormUtils_1 = require("./FormUtils");
let UserModel = class UserModel extends Decorator_1.Decorator {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn("uuid")
], UserModel.prototype, "id", void 0);
__decorate([
    typeorm_1.Column("varchar", { nullable: true })
], UserModel.prototype, "slackUserId", void 0);
__decorate([
    typeorm_1.Column("varchar", { nullable: true })
], UserModel.prototype, "githubUserName", void 0);
__decorate([
    typeorm_1.Column("varchar"),
    typeorm_1.Index({ unique: true })
], UserModel.prototype, "username", void 0);
__decorate([
    typeorm_1.Column("varchar")
], UserModel.prototype, "hash", void 0);
__decorate([
    typeorm_1.Column("varchar")
], UserModel.prototype, "salt", void 0);
UserModel = __decorate([
    typeorm_1.Entity()
], UserModel);
exports.UserModel = UserModel;
const hashpass = (password, salt) => new Promise((resolve, reject) => crypto_1.pbkdf2(password, salt, 100000, 512, 'sha512', (err, derivedKey) => err ? reject(err) : resolve(derivedKey.toString('hex'))));
const slowEquals = (a, b) => {
    let diff = a.length ^ b.length;
    for (let i = 0; i < a.length && i < b.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
};
class UserController {
    constructor(connection) {
        this.connection = connection;
    }
    create(settings, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const salt = yield new Promise((resolve, reject) => crypto_1.randomBytes(16, (err, buf) => err ? reject(err) : resolve(buf.toString('utf8'))));
            const hash = yield hashpass(password, salt);
            return yield (yield this.connection)
                .manager.save(new UserModel({
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
                .manager.findOne(UserModel, { username });
            return user && slowEquals(user.hash, yield hashpass(password, user.salt)) ? user : null;
        });
    }
    updateSettings(userId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.updateById(UserModel, userId, settings);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.findOne(UserModel, { id });
        });
    }
    getByGitHubUserName(githubUserName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.findOne(UserModel, { githubUserName });
        });
    }
    getBySlackUserId(slackUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.connection)
                .manager.findOne(UserModel, { slackUserId });
        });
    }
}
exports.UserController = UserController;
exports.SignUpForm = () => FormUtils_1.Form({
    action: '/sign-up',
    children: [
        FormUtils_1.Input({ type: 'text', id: 'username', name: 'Username' }),
        FormUtils_1.Input({ type: 'password', id: 'password', name: 'Password' }),
        FormUtils_1.Input({ type: 'text', id: 'slackUserId', name: 'Slack User Id' }),
        FormUtils_1.Input({ type: 'text', id: 'githubUserName', name: 'Github Username' }),
    ],
});
exports.SignInForm = () => FormUtils_1.Form({
    action: '/sign-in',
    children: [
        FormUtils_1.Input({ type: 'text', id: 'username', name: 'Username' }),
        FormUtils_1.Input({ type: 'password', id: 'password', name: 'Password' }),
    ],
});
exports.SettingsForm = (user) => FormUtils_1.Form({
    action: '/settings',
    children: [
        FormUtils_1.Input({ type: 'text',
            id: 'username',
            name: 'Username',
            value: user.username
        }),
        FormUtils_1.Input({ type: 'text',
            id: 'slackUserId',
            name: 'Slack User Id',
            value: user.slackUserId
        }),
        FormUtils_1.Input({ type: 'text',
            id: 'githubUserName',
            name: 'Github Username',
            value: user.githubUserName
        }),
    ],
});
//# sourceMappingURL=Users.js.map