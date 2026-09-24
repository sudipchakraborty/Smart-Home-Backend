import { Router } from 'express';

import { asyncHandler } from '../../core/http/async-handler.js';
import { readOutputs, updateOutput } from './output-access.controller.js';

export const outputAccessRouter = Router();
outputAccessRouter.get('/', asyncHandler(readOutputs));
outputAccessRouter.put('/:outputName', asyncHandler(updateOutput));
