const _ = require('lodash');
const { Stunt } = require('../stunt');
const { expect } = require('chai');

describe('Stunt', () => {
  let stunt;
  beforeEach(() => {
    stunt = new Stunt();
  });

  afterEach(() => {
  });

  it('should allow mocking a function to return a value', () => {
    const values = [42, 'habla espanol?', 3.14, true, () => false];

    _.each(values, (value) => {
      const mock = stunt.function().returns(value);
      expect(mock()).to.equal(value);
      expect(mock.called).to.be.true;
      expect(mock.callCount).to.equal(1);
    });
  });

  it('should allow mocking a function to yield a value', (done) => {
    const values = [42, 'habla espanol?', 3.14, true, () => false];

    function yielder(index) {
      if (index >= values.length) {
        done();
        return;
      }

      const value = values[index];
      const mock = stunt.function().yields(value);
      mock((val) => {
        expect(val).to.equal(value);
        yielder(index + 1);
      });
    }

    yielder(0);
  });

  it('should fail when a yielding mock is given no callback', () => {
    expect(() => (stunt.function().yields(42))()).to.throw();
  });

  it('should allow mocking a function to invoke a parameter', (done) => {
    const mock = stunt.function().invokes(2, ['hello invokee']);
    mock('a', 42, (str) => {
      expect(str).to.equal('hello invokee');
      done();
    });
  });

  it('should fail when trying to invoke with non-number for parameter index', () => {
    expect(() => stunt.function().invokes(null, [])).to.throw();
  });

  it('should fail when trying to invoke with non-array for invokee arguments', () => {
    expect(() => stunt.function().invokes(42, 42)).to.throw();
  });

  it('should yield to first function found', (done) => {
    const mock = stunt.function().yields(42);
    mock(1, 'a', 3.14, (val) => {
      expect(val).to.equal(42);
      done();
    });
  });

  it('should allow mocking a function to throw', () => {
    const throwError = new Error('no-worky');
    const mock = stunt.function().throws(throwError);
    expect(() => mock()).to.throw(throwError);
  });

  it('should allow spying on a function', () => {
    const spy = stunt.spy(() => 'spied on');
    expect(spy()).to.equal('spied on');
    expect(spy.called).to.be.true;
    expect(spy.callCount).to.equal(1);
  });

  it('should fail creating spy when argument is not a function', () => {
    expect(() => stunt.spy(42)).to.throw();
  });

  it('should allow mocking an object', () => {
    const obj = { a: 42, b: () => 'hello world', c: true };
    const mock = stunt.object(obj);

    expect(mock).to.not.equal(obj);       // should make a new instance
    expect(mock.a).to.equal(obj.a);       // should make getters
    expect(mock.b()).to.equal(undefined); // the mocked function always returns undefined by default
  });

  it('should allow replacing an object property', () => {
    const obj = { a: () => 'hello world' };
    stunt.replace(obj, 'a', stunt.function().returns('replaced'));
    expect(obj.a()).to.equal('replaced');
  });

  it('should use default mock if not function provided as replacement', () => {
    const obj = { a: () => 'hello world' };
    stunt.replace(obj, 'a');
    expect(obj.a()).to.equal(undefined);
  });

  it('should allow spying on an object property', () => {
    const obj = { a: () => 'hello world' };
    const spy = stunt.spyOn(obj, 'a');
    expect(spy.called).to.be.false;
    expect(spy.callCount).to.equal(0);
    expect(obj.a()).to.equal('hello world');
    expect(spy.called).to.be.true;
    expect(spy.callCount).to.equal(1);
  });

  it('should fail when spying on non-function properties', () => {
    const obj = { a: 42 };
    expect(() => stunt.spyOn(obj, 'a')).to.throw();
  });

  it('should allow resetting what was replaced', () => {
    const obj = { a: () => 'to be replaced' };
    stunt.replace(obj, 'a', stunt.function().returns('replaced'));
    expect(obj.a()).to.equal('replaced');
    stunt.reset();
    expect(obj.a()).to.equal('to be replaced');
  });

  it('should allow resetting to a snapshot in time', () => {
    const obj = { a: () => 'to be replaced', b: () => 'to be spied on' };
    stunt.replace(obj, 'a', stunt.function().returns('replaced'));
    expect(obj.a()).to.equal('replaced');

    const snapshot = stunt.snapshot();
    const spy = stunt.spyOn(obj, 'b');
    expect(obj.b()).to.equal('to be spied on');
    expect(spy.called).to.be.true;
    expect(spy.callCount).to.equal(1);

    stunt.reset(snapshot);
    expect(obj.a()).to.equal('replaced');
    expect(obj.b()).to.equal('to be spied on');
    expect(spy.called).to.be.true;
    expect(spy.callCount).to.equal(1);
  });
});
