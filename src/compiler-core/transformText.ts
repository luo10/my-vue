import { NodeTypes } from "./ast";
import { isText } from "./utils";

export function transformText(node) {
  // 判断是不是text

  // 判断是不是elemet
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let currentContainer;
      // 循环children
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 判断子节点是不是text
        if (isText(child)) {
          // 继续循环
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }

              currentContainer.children.push(" + ");
              currentContainer.children.push(next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
