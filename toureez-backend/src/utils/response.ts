import type { Response } from 'express';
import type { ApiResponse } from '../types';
import { ERROR_MESSAGES } from '../constants/errors';


export const success = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response<ApiResponse<T>> => {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    ...(meta !== undefined ? { meta } : {}),
  };

  return res.status(statusCode).json(body);
};


export const error = (
  res: Response,
  message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
  statusCode = 500,
  meta?: Record<string, unknown>,
): Response<ApiResponse<null>> => {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: message,
    ...(meta !== undefined ? { meta } : {}),
  };

  return res.status(statusCode).json(body);
};


export const notFound = (res: Response, entity = 'Resource'): Response<ApiResponse<null>> => {
  return error(res, `${entity} not found`, 404);
};


export const validationError = (
  res: Response,
  details: unknown,
): Response<ApiResponse<null> & { details: unknown }> => {
  return res.status(400).json({
    success: false,
    data: null,
    error: ERROR_MESSAGES.VALIDATION_FAILED,
    details,
  });
};
