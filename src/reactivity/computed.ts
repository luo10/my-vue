import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _getter: any;
  private _dirty: boolean = true;
  private _value: any;
  private _effect: any;

  constructor(getter) {
    this._getter = getter;

    // getter 也是个响应式
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  // 访问的时候执行
  get value() {
    // get
    // 当依赖的响应式对象的值发生改变的时候
    if (this._dirty) {
      this._dirty = false;
      // 收集依赖
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
