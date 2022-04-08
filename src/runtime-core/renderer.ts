import { effect } from "../reactivity/effect";
import { EMPTY_OBJ, isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createAppApi } from "./createApp";
import { queueJobs } from "./scheduler";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options; // 拿到渲染的函数

  function render(vnode, container) {
    patch(null, vnode, container, null, null);
  }

  /**
   * @description:
   * @param {*} vnode 虚拟节点
   * @param {*} container 容器
   */
  function patch(n1, n2, container, parentComponent, anchor) {
    // patch
    const { type, shapeFlag } = n2; // 取出类型

    // Fragment -> 只渲染 children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 是string则是element
          // 处理 element
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 判断是不是stateful component
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }

    // 去处理组件
  }
  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // Implement
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  // 渲染文字节点
  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  // 处理 element
  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    // 处理更新的逻辑

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el); // 传递el

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 是text文本节点
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 老的节点是数组节点
        // 1. 老的清空
        unmountChildren(n1.children);
      }
      // 2. 设置 text
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 之前是文本节点
        // 清空文本
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array diff array
        patchKeyChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyChildren(c1, c2, container, parentComponent, parentAnchor) {
    let i = 0;
    let e1 = c1.length - 1; // 老的子节点长度
    let e2 = c2.length - 1; // 替换的子节点长度
    // 比较相同的节点
    function isSameVNode(n1, n2) {
      // type 和 key判断是否是相同节点
      return n1.type === n2.type && n1.key === n2.key;
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[i]; // 被替换的元素
      const n2 = c2[i]; // 替换的元素
      if (isSameVNode(n1, n2)) {
        // 是否是相同的元素, 如果是相同的继续比较孙子节点
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        // 不一样退出循环
        break;
      }
      i++;
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]; // 被替换的元素
      const n2 = c2[e2]; // 替换的元素
      if (isSameVNode(n1, n2)) {
        // 是否是相同的元素, 如果是相同的继续比较孙子节点
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        // 不一样退出循环
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      // 大于了老的长度
      if (i <= e2) {
        // 又小于了新的长度
        // 添加一个
        const nextPos = i + 1;
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      let s1 = i; // 保存
      let s2 = i;

      const toBePatched = e2 - s2 + 1; // 新节点总数量
      let patched = 0; // 已经替换的节点

      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched); // 新老映射表 newIdx: oldIdx [c, d, e] [e, c, d] [1, 2, 0]
      let moved = false; // 是否移动过
      let maxNewIndexSoFar = 0; // 最大的新索引

      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0; // 初始化 0 表示未建立映射关系, 需要创建节点

      // 先收集新的key
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 循环e1去替换
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          // 处理数量 > 需要比对的节点, 应该停止
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        // null undefined
        if (prevChild.key != null) {
          // 去新的里面查找, 找到直接返回
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 如果没有key, 遍历新的节点
          for (let j = s2; j <= e2; j++) {
            if (isSameVNode(prevChild, c2[j])) {
              // 如果找到了
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === undefined) {
          // 如果都没有, 删除掉
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            // 新的索引大于最大的索引, 说明移动过了, 不需要移动
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          newIndexToOldIndexMap[newIndex - s2] = i + 1; // 保存老节点, 在新节点中的位置  newIndex是移动后的位置 - s2 获取相对位置, 同时将老数组中的位置保存
          // 如果存在, 继续深度比较
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++; // 处理完了+1
        }
      }
      // 去移动节点
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []; // 获取最大自增序列
      let j = increasingNewIndexSequence.length - 1; // 指针
      // 倒叙添加
      for (let i = toBePatched; i >= 0; i--) {
        const nextIndex = i + s2; // 真实的位置
        const nextChild = c2[nextIndex]; // 真实的元素
        const anchor = nextIndex + 1 < e2 ? c2[nextIndex + 1].el : null; // 添加的位置不要大于最大值, 不然就添加到最后

        if (newIndexToOldIndexMap[i] === 0) {
          // 如果是0, 说明是新增的
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // 不是最大自增序列, 需要移动位置
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el; // 拿到节点的el
      // 删除节点
      hostRemove(el);
    }
  }

  // 对比props
  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      // 找到要更新的值
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];

        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }

      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            // 删除props
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  // 挂载 element
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    // children
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // text_children
      // string类型 "hi text"
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // array_children
      // vnode [h('div', {}, 'hi text')]
      // 去从新走patch处理
      mountChildren(vnode.children, el, parentComponent, anchor);
    }

    // props
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }

    // container.append(el);
    hostInsert(el, container);
  }

  // 处理子节点
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  // 处理组件
  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  // 更新组件
  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component); // 获取保存的component
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2; // 获取要更新的节点
      instance.update(); // 执行更新组件
    } else {
      n2.el = n1.el;
      n2.vnode = n2;
    }
  }

  // 挂载组件
  function mountComponent(
    initinalVNode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 创建组件实例, 并且挂载到vnode上
    const instance = (initinalVNode.component = createComponentInstance(
      initinalVNode,
      parentComponent
    ));
    setupComponent(instance);
    setupRenderEffect(instance, initinalVNode, container, anchor);
  }

  // render组件实例
  function setupRenderEffect(
    instance: any,
    initinalVNode,
    container: any,
    anchor
  ) {
    // 保存成响应式, 好更新组件
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          // 初始化的逻辑
          const { proxy } = instance;
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          )); // 执行render函数, 并且保存subTree

          // vnode -> patch
          // vnode -> element -> mountElement
          patch(null, subTree, container, instance, anchor);
          // 将element上面的dom 传出来
          initinalVNode.el = subTree.el;
          instance.isMounted = true;
        } else {
          // 字段变动更新组件
          console.log("update");

          const { next, vnode } = instance; // next 更新的节点, vnode 原始的节点
          if (next) {
            // el为容器节点, 需要传递到next中
            next.el = vnode.el;

            // 更新组件
            updateComponentPreRender(instance, next);
          }

          const { proxy } = instance;
          const subTree = instance.render.call(proxy, proxy); // 执行render函数
          const prevSubTree = instance.subTree;

          instance.subTree = subTree; // 更新

          console.log("current", subTree);
          console.log("prev", prevSubTree);
          patch(prevSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          console.log("update -- scheduler");
          queueJobs(instance.update); // 队列执行, 使用微任务去执行, 计算完毕后更新dom
        },
      }
    );
  }
  return {
    createApp: createAppApi(render),
  };
}

// 更新render
function updateComponentPreRender(instance, nextVNode) {
  // 更新instance为新的值, 清空next
  instance.vnode = nextVNode;
  instance.next = null;
  // 将要更新的props 传递到 实例上来
  instance.props = nextVNode.props;
}

function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
