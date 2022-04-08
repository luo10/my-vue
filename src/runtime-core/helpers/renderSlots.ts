import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name]; // 获取对应的slot

  if (slot) {
    // function
    if (typeof slot === "function") {
      // 使用Fragment去消除外面包裹的div
      return createVNode(Fragment, {}, slot(props));
    }
  }
}
