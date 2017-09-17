const _ = require('lodash');

function _mock(...args) {
  this.called = true;
  this.callCount++;
  // eslint-disable-next-line default-case
  switch (this._action) {
    case 'return':
      return this._returnValue;
    case 'yield': {
      const callback = _.find(args, _.isFunction);
      if (!callback) throw new Error('expected to yield, but no callback given');

      callback(...this._yieldArgs);
      break;
    }
    case 'throw':
      throw this._yieldArgs;
    case 'invoke':
      args[this._argIndex](...this._yieldArgs);
      break;
    case 'call': {
      const target = this._yieldArgs;
      return target(...args);
    }
  }

  return void 0; // eslint-disable-line no-void
}

function invokes(argIndex, args) {
  if (!_.isNumber(argIndex)) throw new Error('argument index must be a number');
  if (!_.isArray(args)) throw new Error('needs arguments for invokation as array');

  this._action = 'invoke';
  this._argIndex = argIndex;
  this._yieldArgs = args;
  return this._mock;
}

function calls(target) {
  if (!_.isFunction(target)) throw new Error('target must be a function');

  this._action = 'call';
  this._yieldArgs = target;
  return this._mock;
}

function yields(...args) {
  this._action = 'yield';
  this._yieldArgs = args;
  return this._mock;
}

function returns(value) {
  this._returnValue = value;
  return this._mock;
}

function throws(throwObj) {
  this._action = 'throw';
  this._yieldArgs = throwObj;
  return this._mock;
}

function makeContext() {
  const context = {
    _action: 'return',
    _returnValue: void 0, // eslint-disable-line no-void
    _argIndex: 0,
    _yieldArgs: [],
    _mock,
    callCount: 0,
    called: false,
    yields,
    returns,
    invokes,
    throws,
    calls,
  };

  return context;
}

function mapContext(context) {
  // bind all functions to the context
  _.each(context, (value, key) => {
    if (_.isFunction(value)) {
      context[key] = value.bind(context);
    }
  });

  // mirror public properties on mock-function
  const mock = context._mock;
  _.each(context, (value, key) => {
    if (key[0] === '_') return; // private property

    if (_.isFunction(value)) {
      mock[key] = value;
    } else {
      Object.defineProperty(mock, key, { get() { return context[key]; } });
    }
  });
  return mock;
}

class Stunt {
  constructor() {
    this.mockings = [];

    this.Stunt = Stunt; // allow circumventing the default behavior of providing a shared instance.
  }

  function() {
    const context = makeContext();
    return mapContext(context);
  }

  spy(target) {
    return this.function().calls(target);
  }

  object(obj) {
    const self = this;
    return _.mapValues(obj, (value) => {
      if (_.isFunction(value)) {
        return self.function(value);
      }

      return _.cloneDeep(value);
    });
  }

  replace(obj, property, func) {
    if (!(property in obj))
      throw new Error(`Property ${property} not present to be replaced`);

    const oldValue = obj[property];
    const newFunc = func !== undefined ? func : this.function();
    this.mockings.push({ obj, property, oldValue });
    obj[property] = newFunc;
    return newFunc;
  }

  spyOn(obj, property) {
    const oldValue = obj[property];
    if (!_.isFunction(oldValue)) throw new Error('property must be a function');

    this.mockings.push({ obj, property, oldValue });

    obj[property] = this.spy(oldValue);
    return obj[property];
  }

  reset(snapshot) {
    if (!_.isInteger(snapshot)) snapshot = 0;

    for (let i = snapshot; i < this.mockings.length; i++) {
      const { obj, property, oldValue } = this.mockings[i];
      obj[property] = oldValue;
    }

    this.mockings.length = snapshot;
  }

  snapshot() {
    return this.mockings.length;
  }
}

module.exports = new Stunt();
