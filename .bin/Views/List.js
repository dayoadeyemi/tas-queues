"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ListView {
    constructor(items) {
        this.items = items;
        this.toString = () => `
    <ul class="list-group">${this.items.map(item => `
      <li class="list-group-item">
        ${item}
      </li>
    `).join('\n')}</ul>
    `;
    }
}
exports.default = ListView;
//# sourceMappingURL=List.js.map