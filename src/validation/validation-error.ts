'use strict';
import { map, flatten } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ValidationError(this: any, errors: any, options: any) {
  this.name = 'ValidationError';
  this.message = 'validation error';
  this.errors = errors;
  this.flatten = options.flatten;
  this.status = options.status;
  this.statusText = options.statusText;
}
ValidationError.prototype = Object.create(Error.prototype);

ValidationError.prototype.toString = function () {
  return JSON.stringify(this.toJSON());
};

ValidationError.prototype.toJSON = function () {
  if (this.flatten) return flatten(map(this.errors, 'messages'));
  return {
    status: this.status,
    statusText: this.statusText,
    errors: this.errors,
  };
};

export default ValidationError;
