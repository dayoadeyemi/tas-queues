export default class ListView {
    constructor(private items){}
    toString = () => `
    <ul class="list-group">${this.items.map(item => `
      <li class="list-group-item">
        ${item}
      </li>
    `).join('\n')}</ul>
    `
}