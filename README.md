# Stunt

A lightweight mocking library for Node.js with support for functions, objects, and property replacement.

## Installation

```bash
npm install stunt
```

## API

### `stunt.function()`

Creates a mock function with customizable behavior.

**Methods:**
- `.returns(value)` - Returns a specific value
- `.yields(value)` - Yields a value to a callback
- `.invokes(index, args)` - Invokes a parameter at the given index with the provided arguments
- `.throws(error)` - Throws an error

**Example:**
```javascript
const { Stunt } = require('stunt');
const stunt = new Stunt();

// Return a value
const mock = stunt.function().returns(42);
console.log(mock()); // 42
console.log(mock.called); // true
console.log(mock.callCount); // 1

// Yield to callback
mock = stunt.function().yields('hello');
mock((val) => console.log(val)); // 'hello'

// Invoke a parameter
mock = stunt.function().invokes(2, ['hello']);
mock('a', 42, (str) => console.log(str)); // 'hello'

// Throw an error
mock = stunt.function().throws(new Error('no-worky'));
mock(); // throws Error('no-worky')
```

### `stunt.spy(fn)`

Creates a spy on an existing function to track calls.

**Example:**
```javascript
const fn = () => 'spied on';
const spy = stunt.spy(fn);
console.log(spy()); // 'spied on'
console.log(spy.called); // true
console.log(spy.callCount); // 1
```

### `stunt.object(obj)`

Creates a mock object with getters for all properties.

**Example:**
```javascript
const obj = { a: 42, b: () => 'hello world', c: true };
const mock = stunt.object(obj);

console.log(mock.a); // 42
console.log(mock.b()); // undefined (mocked functions return undefined by default)
```

### `stunt.replace(obj, prop, mock)`

Replaces an object property with a mock function. This is different to just setting the
property directly, as the `.replace` operation can easily be reversed - see below.

**Example:**
```javascript
const obj = { a: () => 'original' };
stunt.replace(obj, 'a', stunt.function().returns('replaced'));
console.log(obj.a()); // 'replaced'
```

If no mock is provided, creates a default mock:
```javascript
stunt.replace(obj, 'a');
console.log(obj.a()); // undefined
console.log(obj.a.called); // true
```

### `stunt.spyOn(obj, prop)`

Spies on an existing object property.

**Example:**
```javascript
const obj = { a: () => 'hello world' };
const spy = stunt.spyOn(obj, 'a');
console.log(spy.called); // false
console.log(obj.a()); // 'hello world'
console.log(spy.called); // true
```

### `stunt.reset()`

Resets all mocks to their original state.

**Example:**
```javascript
const obj = { a: () => 'original' };
stunt.replace(obj, 'a', stunt.function().returns('replaced'));
console.log(obj.a()); // 'replaced'
stunt.reset();
console.log(obj.a()); // 'original'
```

### `stunt.reset(snapshot)`

Resets to a specific snapshot of the object state.

**Example:**
```javascript
const obj = { a: () => 'original', b: () => 'another' };
stunt.replace(obj, 'a', stunt.function().returns('replaced'));
const snapshot = stunt.snapshot();
const spy = stunt.spyOn(obj, 'b');
stunt.reset(snapshot);
console.log(obj.a()); // 'replaced'
console.log(obj.b()); // 'another'
console.log(spy.called); // true (snapshot preserves spy state)
```

## Usage in Tests

```javascript
const { Stunt } = require('stunt');
const { expect } = require('chai');

describe('MyModule', () => {
  let stunt;

  beforeEach(() => {
    stunt = new Stunt();
  });

  it('should mock a function', () => {
    const mock = stunt.function().returns(42);
    expect(mock()).to.equal(42);
  });

  it('should spy on a function', () => {
    const fn = () => 'test';
    const spy = stunt.spy(fn);
    expect(spy()).to.equal('test');
    expect(spy.called).to.be.true;
  });

  it('should replace object property', () => {
    const obj = { method: () => 'original' };
    stunt.replace(obj, 'method', stunt.function().returns('mocked'));
    expect(obj.method()).to.equal('mocked');
  });
});
```

## License

MIT
