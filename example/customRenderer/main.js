import { createRenderer } from "../../lib/guide-mini-vue.esm.js";
import { App } from "./app.js";

const game = new PIXI.Application({
  width: 500,
  height: 500,
});

document.body.append(game.view);

const renderer = createRenderer({
  createElement(type) {
    if (type === "rect") {
      const rect = new PXIX.Graphics();
      rect.beginFill(0xffffff);
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();
    }
  },
  patchProp(el, key, val) {
    el[key] = val;
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});

renderer.createApp(App).mount(game.stage);

// vue3
// const rootContainer = document.querySelector("#app");
// createApp(App).mount(rootContainer);
