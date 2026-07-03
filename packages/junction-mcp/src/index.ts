/**
 * junction-mcp — transport-agnostic core.
 *
 * The public surface of the publishable package: the tool registry that any
 * MCP transport binds to, plus the typed Junction REST client the tools use.
 *
 * Consumers (the demo app's HTTP routes, the stdio binary, external code)
 * import from here rather than reaching into internal file paths.
 */
export { registerJunctionTools, SERVER_INFO } from "./mcp/server";
export {
  JunctionClient,
  JunctionApiError,
  SUMMARY_RESOURCES,
  TIMESERIES_RESOURCES,
} from "./junction/client";
export type {
  JunctionClientOptions,
  SummaryResource,
  TimeseriesResource,
} from "./junction/client";
