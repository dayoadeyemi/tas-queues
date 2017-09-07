export const valueIfExists = (value: string | number) => value ? `value="${value}"` : ""

export const Input = (params: {
    type: 'number' | 'text' | 'textarea' | 'password',
    id: string,
    name?: string,
    value?: string | number,
    hidden?: boolean
}) => `
<div class="form-group">
    <label for="${params.id}" class="form-label">${params.name}</label>
    ${
        params.type === 'textarea'?
        `<textarea name="${params.id}" type="${params.type}" class="form-control" id="${params.id}" rows="3">${params.value||''}</textarea>`:
        `<input name="${params.id}" type="${params.type}" class="form-control" id="${params.id}" ${valueIfExists(params.value)}>`
    }
</div>`

export const Form = (params: { id?: string, children: String[], action: string, onsubmit?: string}) => `
<form action="${params.action}" method="post" onsubmit="${params.onsubmit||''}">
    ${params.id ? `<input hidden name="id" type="text" class="form-control" id="id" value=${params.id} >` : ''}
    ${params.children.join('\n')}
    <div class="form-group text-centre">
        <label for="submit" class="form-label"></label>
        <button id="submit" type="submit" class="btn btn-success">Save</button>
    </div>
</form>`