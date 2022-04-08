import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    // renderSlots
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
// export const Foo = {
//   setup(props, { emit }) {
//     // props 传入的值, 且props为readonly
//     // props.count
//     const emitAdd = () => {
//       console.log("emit add");
//       emit("add", 1, 2);
//     };
//     return { emitAdd };
//   },
//   render() {
//     const btn = h(
//       "button",
//       {
//         onClick: this.emitAdd,
//       },
//       "emitAdd"
//     );
//     const foo = h("p", {}, "foo");
//     return h("div", {}, [foo, btn]);
//   },
// };
