"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SignIn_1 = require("../Views/Forms/SignIn");
const SignUp_1 = require("../Views/Forms/SignUp");
const Modal_1 = require("./Modal");
const Layout_1 = require("./Layout");
const getYesterdayString = () => {
    const yesterday = new Date(new Date().toISOString().slice(0, 10));
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
};
const HomeView = () => {
    const signInFormModal = new Modal_1.default('Sign In', SignIn_1.default());
    const signUpFormModal = new Modal_1.default('Sign Up', SignUp_1.default());
    return Layout_1.default({
        navContent: `
            <button type="button" class="btn btn-outline-info" ${signInFormModal.toggleParams()}>
                <small>Sign In</small> 
            </button>
            <button type="button" class="btn btn-outline-info" ${signUpFormModal.toggleParams()}>
                <small>Sign Up</small> 
            </button>`,
        body: `${signInFormModal}${signUpFormModal}`
    });
};
exports.default = HomeView;
//# sourceMappingURL=NewTask.js.map