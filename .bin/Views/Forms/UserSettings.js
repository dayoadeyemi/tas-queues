"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
exports.SettingsForm = (user) => Utils_1.Form({
    action: '/settings',
    cta: 'Save',
    children: [
        Utils_1.Input({ type: 'text',
            id: 'username',
            name: 'Username',
            value: user.username
        }),
        Utils_1.Input({ type: 'text',
            id: 'githubUserName',
            name: 'Github Username',
            value: user.githubUserName
        }),
    ],
});
exports.default = exports.SettingsForm;
//# sourceMappingURL=UserSettings.js.map