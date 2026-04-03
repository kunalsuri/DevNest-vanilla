/**
 * Isolated module that captures the process start time.
 * Must import nothing from server/index.ts to avoid circular dependencies.
 */
export const SERVER_START_TIME = new Date();
