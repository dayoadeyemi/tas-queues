export default class Modal {
    static count = 0
    id = 'modal-' + (++Modal.count).toString()
    constructor(private title, private content: Object){}
    toggleParams = () => `data-toggle="modal" data-target="#${this.id}"`

    toString = () => `
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
    `
}