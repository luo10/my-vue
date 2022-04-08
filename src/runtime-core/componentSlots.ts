import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  const { vnode } = instance;
  // 需要是slot的类型
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  // 处理value的值
  for (const key in children) {
    const value = children[key];
    // slot
    slots[key] = (props) => normalizeSlotValue(value(props)); // instance.slot 上的值应该是一个函数, 会从publicInstance上传出去
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
