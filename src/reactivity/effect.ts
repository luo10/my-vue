import { extend } from "../shared";
// 记录当前激活effect
let activeEffect;
let shouldTrack; // 是否需要收集effect, 因为存在count++也会读取一次

export class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true;
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    // 记录当前的effect
    activeEffect = this;
    if (!this.active) {
      // 如果stop了
      return this._fn();
    }

    shouldTrack = true; // 应该收集依赖
    // activeEffect = this;
    const reslut = this._fn(); // 这里的fn就是effect, 只有再执行effect的时候才需要收集依赖, 其他地方的触发不需要收集依赖
    // reset, 执行完后重置
    shouldTrack = false;
    return reslut;
  }
  stop() {
    if (this.active) {
      // 只需要stop过一次就被清空了
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

// 清空对应存储的effect
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

// 依赖收集
const targetMap = new Map();
export function track(target, key) {
  if (!isTracking()) return;
  //  对应关系 target -> key -> dep
  // target: { foo: 1 } , key: foo, dep 记录的effect
  // 先取值
  let depsMap = targetMap.get(target);
  // 如果没有 则创建
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    // 如果没有dep被创建dep
    dep = new Set();
    depsMap.set(key, dep);
  }
  trackEffects(dep);
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  // 这里是收集effect到dep中
  dep.add(activeEffect);
  // 这里把dep收集起来
  activeEffect.deps.push(dep);
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

// 读取的时候触发
export function trigger(target, key) {
  // target->key->dep
  // 取到对应key缓存的dep
  const depsMap = targetMap.get(target);
  const dep = depsMap.get(key);
  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  // fn
  // 获取scheduler
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // _effect.onStop = options.onStop;
  // 上面的简写
  extend(_effect, options);
  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  // 这里从runner传出去effect
  runner.effect = _effect;
  return runner;
}

// 这里接收传入的effect并执行
export function stop(runner) {
  runner.effect.stop();
}
