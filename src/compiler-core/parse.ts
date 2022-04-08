import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context, []));
}

// 收集tag
function parseChildren(context, ancestors) {
  const nodes: any = [];
  // 循环处理解析
  while (!isEnd(context, ancestors)) {
    let node;
    if (context.source.startsWith("{{")) {
      // 如果是花括号
      node = parseInterpolation(context);
    } else if (context.source[0] === "<") {
      // 如果是 标签
      if (/[a-z]/i.test(context.source[1])) {
        // 去解析element
        node = parseElement(context, ancestors);
      }
    }

    // 不是node节点
    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  const s = context.source;
  // </div>
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; --i) {
      // 取出tag
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        // 只取出来tag比较
        return true;
      }
    }
  }

  // 2. 结束标签
  // if (parentTag && s.startsWith(`</${parentTag}>`)) {
  //   return true;
  // }

  // 1. source 没有值就结束了
  return !context.source;
}

// 解析文本节点
function parseText(context: any) {
  // 需要判断是不是会进入到 {{message}}的逻辑
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index; // 如果有 {{  则表示结束了
    }
  }

  // 1. 获取content
  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context: any, length) {
  const content = context.source.slice(0, length);

  // 2. 推进
  advanceBy(context, length);
  return content;
}

function parseElement(context: any, ancestors) {
  // Implement
  // 1. 解析tag
  const element: any = parseTag(context, TagType.Start); // 第一次删除
  ancestors.push(element); // 收集element
  element.children = parseChildren(context, ancestors); // 继续解析children
  ancestors.pop(); // 处理完了弹出

  // 判断标签是一致的
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End); // 第二次再次删除
  } else {
    throw new Error(`缺少结束标签:${element.tag}`);
  }

  console.log("----------", context.source);

  return element;
}

// 判断开始关闭的标签是否一致
function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(context: any, type: TagType) {
  // 该函数是单次删除
  const match: any = /^<\/?([a-z]*)/i.exec(context.source); // 正则i模式只匹配一次
  const tag = match[1]; // 拿到匹配到的标签
  // 2. 删除处理完成的代码
  // 先删除<div>
  advanceBy(context, match[0].length); // 删除掉<div
  advanceBy(context, 1); // 删除掉 >
  if (type === TagType.End) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  // {{message}}
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  ); // 找到结束标签

  advanceBy(context, openDelimiter.length); // 去掉{{

  const rawContentLength = closeIndex - openDelimiter.length; // 去掉{{ 和 }} 中间message的长度
  const rawContent = parseTextData(context, rawContentLength); // 拿到中间的message
  const content = rawContent.trim();

  advanceBy(context, closeDelimiter.length); // 原数据上清理掉}}

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT,
  };
}

function createParserContext(content: string): any {
  return {
    source: content,
  };
}
