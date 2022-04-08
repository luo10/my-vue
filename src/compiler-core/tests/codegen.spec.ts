import { generate } from "../codegen";
import { baseParse } from "../parse";
import { transform } from "../transform";
import { transformElement } from "../transformElement";
import { transformExpression } from "../transformExpression";
import { transformText } from "../transformText";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");
    transform(ast); // 赋值
    const { code } = generate(ast);
    // 快照()
    // 两次运行不一样报错
    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");
    // 传入插件处理
    transform(ast, {
      nodeTransforms: [transformExpression],
    }); // 赋值
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");

    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    }); // 赋值
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});
