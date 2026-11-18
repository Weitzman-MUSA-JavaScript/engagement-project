import { createDataService } from './data-service.js';
import { createFirebaseDataService } from './firebase-data-service.js';
import { dataConfig } from './firebase-config.js';

export function usesFirebase(config, origin) {
  return config.provider === 'firebase' || (config.provider === 'auto' && new URL(origin).hostname.endsWith('.github.io'));
}

export function createAppDataService(context, config = dataConfig) {
  const host = new URL(context().origin).hostname;
  const options = config.emulators && ['localhost', '127.0.0.1', '[::1]'].includes(host) ? { emulators: config.emulators } : {};
  const service = usesFirebase(config, context().origin)
    ? createFirebaseDataService(context, config.firebase, options)
    : createDataService(context);
  service.finish ||= async () => {};
  return service;
}
