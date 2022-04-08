import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  public dep;
  private _rawValue: any;
  public __v_isRef = true; // ref的标识
  constructor(value) {
    this._rawValue = value; // 保存原值, 用于最后的对比
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      // 触发
      triggerEffects(this.dep);
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

function trackRefValue(ref) {
  // 在effect中触发的才收集依赖
  if (isTracking()) {
    // 依赖收集
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      // get -> age(ref) 返回 .value
      // not ref -> value
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      // set -> ref .value
      if (isRef(target[key]) && !isRef(value)) {
        // 原来是值是ref 且 新给的值不是ref
        // 直接走代理
        return (target[key].value = value);
      } else {
        // 则修改原值
        return Reflect.set(target, key, value);
      }
    },
  });
}
