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
let UserModel = class UserModel extends Decorator_1.Decorator {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn("uuid")
], UserModel.prototype, "id", void 0);
__decorate([
    typeorm_1.Column("varchar", { nullable: true })
], UserModel.prototype, "slackUserId", void 0);
__decorate([
    typeorm_1.Column("varchar", { nullable: true }),
    typeorm_1.Index({ unique: true })
], UserModel.prototype, "slackOauthState", void 0);
__decorate([
    typeorm_1.Column("varchar", { nullable: true })
], UserModel.prototype, "slackAccessToken", void 0);
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
exports.default = UserModel;
//# sourceMappingURL=User.js.map