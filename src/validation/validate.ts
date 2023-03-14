'use strict';
import Joi from 'joi';
import ValidationError from './validation-error';
import { assignIn, find, defaults } from 'lodash';
import { NextFunction } from 'express';

const defaultOptions = {
  contextRequest: false,
  allowUnknownHeaders: true,
  allowUnknownBody: true,
  allowUnknownQuery: true,
  allowUnknownParams: true,
  allowUnknownCookies: true,
  status: 400,
  statusText: 'Bad Request',
};
let globalOptions = {};

type UnknownMap = {
  headers: string;
  body: string;
  query: string;
  params: string;
  cookies: string;
};

// maps the corresponding request object to an `express-validation` option
const unknownMap: UnknownMap = {
  headers: 'allowUnknownHeaders',
  body: 'allowUnknownBody',
  query: 'allowUnknownQuery',
  params: 'allowUnknownParams',
  cookies: 'allowUnknownCookies',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function expressValidation(schema: any) {
  if (!schema) throw new Error('Please provide a validation schema');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: any, res: any, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors: any = [];

    // Set default options
    const options = defaults({}, schema.options || {}, globalOptions, defaultOptions);

    // NOTE: mutates `errors`
    const requestInputType = ['headers', 'body', 'query', 'params', 'cookies'];

    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < requestInputType.length; index++) {
      const key = requestInputType[index];
      const allowUnknown = options[unknownMap[key as keyof UnknownMap]];
      const entireContext = options.contextRequest ? req : null;
      if (schema[key]) {
        await validate(errors, req[key as keyof UnknownMap], schema[key], key, allowUnknown, entireContext);
      }
    }
    if (errors && errors.length === 0) return next();

    // tslint:disable-next-line:new-parens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return next(new (ValidationError as any)(errors, options));
  };
}

exports.ValidationError = ValidationError;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.options = (opts: any) => {
  if (!opts) {
    globalOptions = {};
    return;
  }

  globalOptions = defaults({}, globalOptions, opts);
};

/**
 * validate checks the current `Request` for validations
 * NOTE: mutates `request` in case the object is valid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function validate(errObj: any, request: Request, schema: any, location: any, allowUnknown: any, context: any) {
  if (!request || !schema) return;

  const joiOptions = {
    context: context || request,
    allowUnknown,
    abortEarly: false,
  };

  const { error, value } = await Joi.object(schema).validate(request, joiOptions);

  const errors = error;
  if (!errors || errors.details.length === 0) {
    assignIn(request, value); // joi responses are parsed into JSON
    return;
  }
  // tslint:disable-next-line:no-shadowed-variable
  errors.details.forEach((error) => {
    const errorExists = find(errObj, (item) => {
      if (item && item.field === error.path && item.location === location) {
        item.messages.push(error.message);
        item.types.push(error.type);
        return item;
      }
      return;
    });

    if (!errorExists) {
      errObj.push({
        field: error.path,
        location,
        messages: [error.message],
        types: [error.type],
      });
    }
  });
  return errObj;
}
