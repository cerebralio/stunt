const _ = require('lodash');

function mockFunction() {
  switch (this.action) {
    case 'return':
      return this.returnValue;
    default:
  }

  return void 0; // eslint-disable-line no-void
}

function yields(...args) {
  this.action = 'yield';
  this.yieldArgs = args;
  return this.mockFunction;
}

function returns(value) {
  this.returnValue = value;
  return this.mockFunction;
}

function makeContext() {
  const context = {
    action: 'return',
    returnValue: 'default',
    yields,
    returns,
    mockFunction,
  };

  return _.bindAll(context, ['yields', 'returns', 'mockFunction']);
}

class Stunt {
  constructor() {
    this.mockState = [];
  }

  function() {
    const context = makeContext();
    const mock = context.mockFunction;
    this.mockState.push(mock);
    mock.yields = context.yields;
    mock.returns = context.returns;
    return mock;
  }
}

module.exports = new Stunt();
