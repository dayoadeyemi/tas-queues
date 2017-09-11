"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const valueIfExists = (value) => value ? `value="${value}"` : "";
exports.Input = (params) => `
<div class="form-group">
    <label for="${params.id}" class="form-label">${params.name}</label>
    ${params.type === 'textarea' ?
    `<textarea name="${params.id}" type="${params.type}" class="form-control" id="${params.id}" rows="3">${params.value || ''}</textarea>` :
    `<input name="${params.id}" type="${params.type}" class="form-control" id="${params.id}" ${valueIfExists(params.value)}>`}
</div>`;
exports.Form = (params) => `
<form action="${params.action}" method="post" onsubmit="${params.onsubmit || ''}">
    ${params.id ? `<input hidden name="id" type="text" class="form-control" id="id" value=${params.id} >` : ''}
    ${params.children.join('\n')}
    <div class="form-group text-centre">
        <label for="submit" class="form-label"></label>
        <button id="submit" type="submit" class="btn btn-outline-info">${params.cta}</button>
    </div>
</form>`;
//# sourceMappingURL=Utils.js.map