const _ = require('lodash');

function _mock(...args) {
  this.called = true;
  this.callCount++;
  switch (this._action) {
    case 'return':
      return this._returnValue;
    case 'yield': {
      const callback = _.find(args, _.isFunction);
      if (callback) callback(...this._yieldArgs);

      break;
    }
    default:
  }

  return void 0; // eslint-disable-line no-void
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

function makeContext() {
  const context = {
    _action: 'return',
    _returnValue: 'default',
    _yieldArgs: [],
    _mock,
    callCount: 0,
    called: false,
    yields,
    returns,
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
  }

  function() {
    const context = makeContext();
    return mapContext(context);
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

  mock(obj, property, func) {
    const oldValue = obj[property];
    const newFunc = func !== undefined ? func : this.function();
    this.mockings.push({ obj, property, oldValue });
    obj[property] = newFunc;
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
