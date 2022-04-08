export * from "./toDisplayString";

export const extend = Object.assign;

export const EMPTY_OBJ = {}; // 空对象

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export const isString = (value) => typeof value === "string";

export const hasChanged = (val, newValue) => {
  return !Object.is(val, newValue);
};

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);

// add-foo 转换成 addFoo
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : "";
  });
};

// 首字符大写
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// 添加on
export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};
