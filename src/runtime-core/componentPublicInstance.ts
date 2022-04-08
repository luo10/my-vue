import { hasOwn } from "../shared/index";

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 获取setup执行过后的返回值
    const { setupState, props } = instance;
    if (key in setupState) {
      return setupState[key];
    }

    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    // 做一个扩展
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      // 取到对应值返回出去
      return publicGetter(instance);
    }
  },
};
