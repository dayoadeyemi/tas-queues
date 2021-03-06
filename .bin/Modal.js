"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Modal {
    constructor(title, content) {
        this.title = title;
        this.content = content;
        this.id = 'modal-' + (++Modal.count).toString();
        this.toggleParams = () => `data-toggle="modal" data-target="#${this.id}"`;
        this.toString = () => `
        <div class="modal fade" id="${this.id}" tabindex="-1" role="dialog" aria-labelledby="${this.id}-label" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${this.id}-label">${this.title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">${this.content}</div>
                </div>
            </div>
        </div>
    `;
    }
}
Modal.count = 0;
exports.Modal = Modal;
//# sourceMappingURL=Modal.js.map