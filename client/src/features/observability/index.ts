/**
 * Observability Feature Module
 *
 * Exports all observability-related components and functionality
 */

export { ObservabilityDashboard } from "./components/observability-dashboard";
export { ObservabilityDemo } from "./components/observability-demo";

// Observability initialization services
export {
  initializeObservability,
  initializeDevObservability,
  initializeProdObservability,
  observabilityInitializer,
  type ObservabilityConfig,
} from "./services/observability-init";
