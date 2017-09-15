"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
const SignInForm = () => Utils_1.Form({
    action: '/change-password',
    cta: 'Update',
    children: [
        Utils_1.Input({ type: 'password', id: 'oldPassword', name: 'Old Password' }),
        Utils_1.Input({ type: 'password', id: 'password', name: 'New Password' }),
    ],
});
exports.default = SignInForm;
//# sourceMappingURL=ChangePassword.js.map