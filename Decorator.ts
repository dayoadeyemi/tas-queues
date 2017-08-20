export class Decorator<T> {
    constructor(t: T){
        Object.assign(this, t)
    }
}