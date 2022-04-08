const queue: any[] = [];

let isFlushPending = false;
const p = Promise.resolve();

// 返回一个promise微任务
export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    // 没有才添加
    queue.push(job);
  }

  // 执行微任务, 执行完才更新dom
  queueFlush();
}

// 执行微任务
function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    // 取出队列中的第一个, 并且执行
    job && job();
  }
}
