import { createRenderer } from "../runtime-core";

// 创建节点
function createElement(type) {
  console.log("createElement----------");
  return document.createElement(type);
}

function patchProp(el, key, prevVal, nextVal) {
  console.log("patchProp----------");
  // 正则捕获事件
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    // 这里处理事件
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key); // 删除属性
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

function insert(child, parent, anchor) {
  console.log("insert----------");
  // parent.append(el);
  parent.insertBefore(child, anchor || null); // 默认往最后添加
}

function remove(child) {
  const parent = child.parentNode; // 找到父节点删除
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
