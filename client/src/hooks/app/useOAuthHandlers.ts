import { useCallback } from "react";
import {
  MCPJamServerConfig,
  HttpServerDefinition,
} from "../../lib/types/serverTypes";
import { handleOAuthDebugConnect } from "../../services/oauth";
import { useServerState } from "../useServerState";
import { useConfigState } from "../useConfigState";
import { SESSION_KEYS, getServerSpecificKey } from "../../lib/types/constants";

// OAuth Handlers Hook
export const useOAuthHandlers = (
  serverState: ReturnType<typeof useServerState>,
  configState: ReturnType<typeof useConfigState>,
  handleAddServer: (
    name: string,
    serverConfig: MCPJamServerConfig,
    options?: { autoConnect?: boolean },
  ) => Promise<string>,
) => {
  const onOAuthConnect = useCallback(
    async (serverUrl: string) => {
      const url = new URL(serverUrl);
      const hostname = url.hostname;
      let serverName = hostname.split(".")[1] || hostname.split(".")[0];

      if (serverName.startsWith("mcp")) {
        serverName = hostname.split(".")[0].replace("mcp", "");
      }

      if (!serverName || serverName.length < 2) {
        serverName = hostname.replace(/[^a-zA-Z0-9]/g, "");
      }

      if (!serverName) {
        serverName = "oauth-server";
      }

      let existingServerName = null;
      for (const [name, config] of Object.entries(serverState.serverConfigs)) {
        if ("url" in config && config.url?.toString() === serverUrl) {
          existingServerName = name;
          break;
        }
      }

      const finalServerName = existingServerName || serverName;

      // Get transport type from session storage or default to "sse"
      const transportKey = getServerSpecificKey(
        SESSION_KEYS.TRANSPORT_TYPE,
        serverUrl,
      );
      const storedTransportType = sessionStorage.getItem(transportKey) as
        | "sse"
        | "streamable-http"
        | null;
      const transportType = storedTransportType || "sse";
      const serverConfig: HttpServerDefinition = {
        transportType,
        url: new URL(serverUrl),
      };

      try {
        await handleAddServer(finalServerName, serverConfig, {
          autoConnect: true,
        });
      } catch (error) {
        console.error("Failed to connect OAuth server:", error);
      }
    },
    [serverState, handleAddServer],
  );

  const onOAuthDebugConnect = useCallback(
    ({
      authorizationCode,
      errorMsg,
    }: {
      authorizationCode?: string;
      errorMsg?: string;
    }) => {
      handleOAuthDebugConnect(
        { authorizationCode, errorMsg },
        configState.updateAuthState,
      );
    },
    [configState.updateAuthState],
  );

  return {
    onOAuthConnect,
    onOAuthDebugConnect,
  };
};
