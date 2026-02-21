import morgan, { StreamOptions } from 'morgan';
import { env } from '../config/env';

// Route Morgan's output through console so it integrates with any log aggregator
const stream: StreamOptions = {
  write: (message: string) => console.log(message.trimEnd()),
};

// Skip logging in test environment
const skip = () => env.NODE_ENV === 'test';

export const logger = morgan(
  env.NODE_ENV === 'development' ? 'dev' : 'combined',
  { stream, skip }
);