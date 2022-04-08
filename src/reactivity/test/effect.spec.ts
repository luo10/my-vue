import { reactive } from "../reactive";
import { effect, stop } from "../effect";
describe("effect", () => {
  it("happy path", () => {
    // 进入reactive, 挂在proxy
    const user = reactive({
      age: 10,
    });

    let nextAge;
    // 注册effect, 生成effect对象, 并且先执行一次
    effect(() => {
      // 这里会触发一次get
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);
    user.age++; // 这里触发一次set
    expect(nextAge).toBe(12);
  });

  it("should return runner when call effect", () => {
    // 1. effect(fn) -> function(runner) -> fn -> reture
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });

  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        scheduler,
      }
    );
    // 开始不被调用
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    // 修改后scheduler应该被执行
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    obj.prop = 3;
    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
