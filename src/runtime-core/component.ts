import { proxyRefs } from "../reactivity";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

// 生成组件实例
export function createComponentInstance(vnode, parent) {
  console.log("createComponentInstance", parent);
  const component = {
    vnode,
    type: vnode.type,
    next: null, // 要更新的节点
    setupState: {}, // 执行setup之后的返回值
    props: {}, // 组件的props
    slots: {},
    provides: parent ? parent.provides : {}, // provides 将provides一层一层传递
    parent, // 父组件
    isMounted: false, // 是否是第一次挂载
    subTree: {}, // 子节点
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any; // bind默认传入第一个参数
  return component;
}

// 设置组件
export function setupComponent(instance) {
  // TODO
  initProps(instance, instance.vnode.props); // 接收props
  initSlots(instance, instance.vnode.children);

  // 设置有状态的组件
  setupStatefulComponent(instance);
}
// 获取setup的返回值
function setupStatefulComponent(instance: any) {
  const Component = instance.vnode.type;

  // 挂载代理, 通过call 一个空{}的proxy, 实现函数内部 this.xxx 的动态修改
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    setCurrentInstance(instance);
    //  function Object
    // 限制props为readonly, 在setup中不可以修改
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    // 这里设置为空的原因是 setup中才调用getCurrentInstance
    setCurrentInstance(null);

    handleSetupResult(instance, setupResult);
  }
}

// 处理setup里面的返回值
function handleSetupResult(instance, setupResult: any) {
  // functio Object
  // TODO function

  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }

  // 完成组件
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }
  // 如果有render参数也拿过来
  if (Component.render) {
    instance.render = Component.render;
  }
}

let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}

let compiler;
export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
