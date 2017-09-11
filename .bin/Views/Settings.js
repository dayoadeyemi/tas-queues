"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Forms/Utils");
const UserSettings_1 = require("../Views/Forms/UserSettings");
const Layout_1 = require("./Layout");
const SettingsView = (user) => {
    return Layout_1.default({
        navLinks: [
            { path: '/', text: 'Live' },
            { path: '/report', text: 'Report' },
            { path: '/settings', text: 'Settings', active: true },
        ],
        body: `
        <div class="card">
            <div class="card-header">
                User Settings
            </div>
            <div class="card-body">
                ${UserSettings_1.default(user)}
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                Integrations
            </div>
            <div class="card-body container">
                <div class="row justify-content-between">
                    <div class="col">
                        Connect Slack Account ${user.slackAccessToken ? '(connected)' : ''}
                    </div>
                    <div class="col">
                        ${Utils_1.Form({
            action: '/slack/authorize',
            cta: `Connect`,
            children: []
        })}
                    </div>
                </div>
            </div>
        </div>`
    });
};
exports.default = SettingsView;
//# sourceMappingURL=Settings.js.map