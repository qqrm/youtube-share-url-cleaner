const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const contentScript = readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');

class FakeElement {
  constructor(id = '') {
    this.id = id;
  }

  matches(selector) {
    return selector === 'input#share-url' && this.id === 'share-url';
  }

  querySelector() {
    return null;
  }

  closest(selector) {
    return selector.includes(`#${this.id}`) ? this : null;
  }
}

class FakeInput extends FakeElement {
  constructor(value = '') {
    super('share-url');
    this.value = value;
    this.defaultValue = value;
  }
}

const createHarness = () => {
  const inputs = [];
  const listeners = new Map();
  const animationFrames = [];
  let observer;

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      observer = this;
    }

    observe(_target, options) {
      this.options = options;
    }

    disconnect() {}
  }

  const document = {
    body: {},
    hidden: false,
    addEventListener(type, listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    querySelectorAll(selector) {
      return selector === 'input#share-url' ? inputs : [];
    },
  };

  const context = {
    URL,
    Element: FakeElement,
    MutationObserver: FakeMutationObserver,
    cancelAnimationFrame() {},
    document,
    queueMicrotask,
    requestAnimationFrame(callback) {
      animationFrames.push(callback);
      return animationFrames.length;
    },
    window: { addEventListener() {} },
  };

  vm.runInNewContext(contentScript, context, { filename: 'content.js' });

  return {
    addInput(value) {
      const input = new FakeInput(value);
      inputs.push(input);
      return input;
    },
    flushAnimationFrame() {
      animationFrames.shift()?.();
    },
    dispatch(type, event) {
      listeners.get(type)?.forEach((listener) => listener(event));
    },
    listeners,
    observer,
  };
};

test('cleans a subscription share URL assigned after the panel is attached', async () => {
  const harness = createHarness();
  const input = harness.addInput('');

  harness.observer.callback([
    { addedNodes: [input], type: 'childList' },
  ]);
  await Promise.resolve();

  input.value = 'https://youtu.be/LkJ-9v-nUFc?si=late-value';
  input.defaultValue = input.value;
  harness.flushAnimationFrame();

  assert.equal(input.value, 'https://youtu.be/LkJ-9v-nUFc');
  assert.equal(input.defaultValue, 'https://youtu.be/LkJ-9v-nUFc');
  assert.equal(harness.observer.options.attributes, true);
  assert.deepEqual([...harness.observer.options.attributeFilter], ['value']);
  assert.equal(harness.observer.options.childList, true);
  assert.equal(harness.observer.options.subtree, true);
});

test('cleans synchronously before the subscription panel Copy action', () => {
  const harness = createHarness();
  const input = harness.addInput('https://youtu.be/LkJ-9v-nUFc?si=copy-value');
  const copyButton = new FakeElement('copy-button');

  harness.dispatch('pointerdown', { target: copyButton });

  assert.equal(input.value, 'https://youtu.be/LkJ-9v-nUFc');
});

test('starts cleaning when Share is opened long after the page loaded', () => {
  const harness = createHarness();
  const shareButton = new FakeElement('share-button');
  const input = harness.addInput('');

  harness.dispatch('pointerdown', { target: shareButton });
  input.value = 'https://youtu.be/LkJ-9v-nUFc?si=share-open-value';
  input.defaultValue = input.value;
  harness.flushAnimationFrame();

  assert.equal(input.value, 'https://youtu.be/LkJ-9v-nUFc');
});
