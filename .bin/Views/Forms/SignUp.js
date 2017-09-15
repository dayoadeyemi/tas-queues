"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
const SignUpForm = () => Utils_1.Form({
    action: '/sign-up',
    cta: 'Sign Up',
    children: [
        Utils_1.Input({ type: 'text', id: 'username', name: 'Username' }),
        Utils_1.Input({ type: 'password', id: 'password', name: 'Password' }),
    ],
});
exports.default = SignUpForm;
//# sourceMappingURL=SignUp.js.map