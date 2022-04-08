import { ShapeFlags } from "../shared/ShapeFlags";

export const Fragment = Symbol("Fragment"); // 唯一的
export const Text = Symbol("Text"); // 唯一的

export { createVNode as createElementVNode };

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    component: null,
    key: props && props.key,
    shapeFlag: getShapeFlag(type), // 获取vnode的类型
    el: null,
  };

  // children
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN; // 添加上text的类型
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN; // 添加上array的类型
  }

  // 组件 + children object 判断是不是一个slots
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN; // 添加上slots的类型
    }
  }

  return vnode;
}

// 创建文字节点
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
