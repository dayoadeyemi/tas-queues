"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SignIn_1 = require("../Views/Forms/SignIn");
const SignUp_1 = require("../Views/Forms/SignUp");
const Modal_1 = require("./Modal");
const Layout_1 = require("./Layout");
const HomeView = () => {
    const signInFormModal = new Modal_1.default('Sign In', SignIn_1.default());
    const signUpFormModal = new Modal_1.default('Sign Up', SignUp_1.default());
    return Layout_1.default({
        navContent: `
            <button type="button" class="btn btn-secondary" ${signInFormModal.toggleParams()}>
                <span>Sign In</span> 
            </button>
            <button type="button" class="btn btn-secondary" ${signUpFormModal.toggleParams()}>
                <span>Sign Up</span> 
            </button>`,
        body: `${signInFormModal}${signUpFormModal}
        <div class="row align-items-center" style="background-image: url('/bg.jpeg');background-repeat:no-repeat;background-position:center;background-size:cover; min-height:100vh">
            <div class="container">
                <div class="jumbotron text-center" style="opacity:.9">
                    <h1 class="display-3">TasQ</h1>
                    <p class="lead">The simplest and most powerful todo list, built for people with important things to do.</p>
                </div>
            </div>
        </div>`
    });
};
exports.default = HomeView;
//# sourceMappingURL=Home.js.map