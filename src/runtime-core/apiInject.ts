import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存
  // setup 中获取当前实例
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    // 有值就存入
    let { provides } = currentInstance;

    const parentProvides = currentInstance.parent.provides; // 拿到父级的provides
    // 只第一次provides的时候才需要形成原型链
    if (provides === parentProvides) {
      // 形成原型链 可以一层一层上找
      provides = currentInstance.provides = Object.create(parentProvides);
      // provides = Object.create(parentProvides);
      // 连等的原因是, 如果直接用provides = Object.create(parentProvides), provides就被彻底重写了下面的 provides[key]
    }

    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  // 取
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;

    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
