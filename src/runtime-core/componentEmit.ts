import { camelize, toHandlerKey } from "../shared/index";

// 传入的emit
export function emit(instance, event, ...args) {
  console.log("emit", event);
  // 找到instance.props 上有没有event
  const { props } = instance;
  // TPP
  // 先去写一个特定的行为 -> 重构成通用的行为

  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}
