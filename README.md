# 初始化

```
// typescript
pnpm install typescript --save-dev
npx tsc --init
// jest
pnpm install @types/jest jest --save-dev
// tsconfig.json 中修改
types:["jest"]
// package.json
"script": {
  "test": "jest"
}
// babel
pnpm install babel-jest @babel/core @babel/preset-env --save-dev
// babel.config.js
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
};
// 支持ts
pnpm install @babel/preset-typescript --save-dev

// babel.config.js中添加
'@babel/preset-typescript'
```
