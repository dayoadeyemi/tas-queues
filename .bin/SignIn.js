"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
const SignInForm = () => Utils_1.Form({
    action: '/sign-in',
    children: [
        Utils_1.Input({ type: 'text', id: 'username', name: 'Username' }),
        Utils_1.Input({ type: 'password', id: 'password', name: 'Password' }),
    ],
});
exports.default = SignInForm;
//# sourceMappingURL=SignIn.js.map