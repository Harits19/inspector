import React, { useState, useEffect, useRef } from "react";
import { MCPJamServerConfig } from "../lib/types/serverTypes";
import { InspectorConfig } from "../lib/types/configurationTypes";
import ConnectionSection from "./ConnectionSection";
import { ParsedServerConfig } from "@/lib/utils/json/configImportUtils";
import { useToast } from "@/lib/hooks/useToast";
import {
  configToDisplayStrings,
  updateConfigFromStrings,
  createDefaultStdioConfig,
  createDefaultHttpConfig,
  isStdioConfig,
  isHttpConfig,
} from "@/lib/utils/config/configHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import {
  X,
  Plus,
  Save,
  AlertCircle,
  Upload,
  Settings,
  Users,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import ConfigImportDialog from "./ConfigImportDialog";

interface ClientConfig {
  id: string;
  name: string;
  config: MCPJamServerConfig;
}

interface ClientFormSectionProps {
  isCreating: boolean;
  editingClientName: string | null;
  initialClient?: { name: string; config: MCPJamServerConfig };
  config: InspectorConfig;
  setConfig: (config: InspectorConfig) => void;
  bearerToken: string;
  setBearerToken: (token: string) => void;
  headerName: string;
  setHeaderName: (name: string) => void;
  onSave: (
    clients: Array<{ name: string; config: MCPJamServerConfig }>,
  ) => Promise<{
    success: string[];
    failed: Array<{ name: string; error: string }>;
  }>;
  onCancel: () => void;
  onImportMultipleServers?: (servers: ParsedServerConfig[]) => void;
}

const ClientFormSection: React.FC<ClientFormSectionProps> = ({
  isCreating,
  editingClientName,
  initialClient,
  config,
  setConfig,
  bearerToken,
  setBearerToken,
  headerName,
  setHeaderName,
  onSave,
  onCancel,
  onImportMultipleServers,
}) => {
  // Initialize multipleClients based on mode
  const [multipleClients, setMultipleClients] = useState<ClientConfig[]>(() => {
    if (initialClient) {
      // Editing mode - initialize with the client being edited
      return [
        {
          id: "editing-client",
          name: initialClient.name,
          config: initialClient.config,
        },
      ];
    } else {
      // Creating mode - initialize with default client
      return [
        {
          id: "new-client",
          name: "",
          config: createDefaultStdioConfig(),
        },
      ];
    }
  });

  console.log("🔧 multipleClients", multipleClients);

  const [isManualConfigExpanded, setIsManualConfigExpanded] = useState(true);
  const { toast } = useToast();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [nameError, setNameError] = useState<string>("");
  const [isNameTouched, setIsNameTouched] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Determine if we're in multiple mode (more than 1 client)
  const isMultipleMode = multipleClients.length > 1;

  // Get the current client (first one) for single mode
  const currentClient = multipleClients[0] || {
    id: "default",
    name: "",
    config: createDefaultStdioConfig(),
  };
  // Handler for updating the current client (single mode)
  const handleUpdateCurrentClient = (updates: Partial<ClientConfig>) => {
    setMultipleClients((prev) =>
      prev.map((client) =>
        client.id === currentClient.id ? { ...client, ...updates } : client,
      ),
    );
  };

  useEffect(() => {
    if (!isNameTouched) return;

    if (currentClient.name.trim()) {
      setNameError("");
    } else {
      setNameError("Client name is required");
    }
  }, [currentClient.name, isNameTouched]);

  // Handler for args changes that preserves input while typing
  const handleArgsChange = (newArgsString: string) => {
    if (isStdioConfig(currentClient.config)) {
      const updatedConfig = updateConfigFromStrings(
        currentClient.config,
        newArgsString,
      );
      handleUpdateCurrentClient({ config: updatedConfig });
    }
  };

  const handleSseUrlChange = (newSseUrlString: string) => {
    if (isHttpConfig(currentClient.config)) {
      try {
        const newUrl = new URL(newSseUrlString || "https://example.com");
        handleUpdateCurrentClient({
          config: { ...currentClient.config, url: newUrl },
        });
      } catch {
        // Invalid URL, keep current config
      }
    }
  };

  // Handler for importing multiple servers
  const handleImportServers = (servers: ParsedServerConfig[]) => {
    if (servers.length > 1) {
      // Multiple servers - switch to multiple mode
      const clients: ClientConfig[] = servers.map((server, index) => ({
        id: `client-${Date.now()}-${index}`,
        name: server.name,
        config: server.config,
      }));

      setMultipleClients(clients);

      toast({
        title: "Multiple servers imported",
        description: `Imported ${servers.length} server configurations. Configure each client below.`,
      });
    } else if (servers.length === 1) {
      // Single server - update current client
      const firstServer = servers[0];
      const updatedClient = {
        ...currentClient,
        name: currentClient.name.trim() || firstServer.name,
        config: firstServer.config,
      };

      setMultipleClients([updatedClient]);

      toast({
        title: "Configuration imported",
        description: `Imported configuration for "${firstServer.name}".`,
      });
    }

    if (onImportMultipleServers) {
      onImportMultipleServers(servers);
    }

    // Auto-scroll to bottom after import to show the action buttons
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100); // Ensures the DOM is updated before scrolling
  };

  // Handler for updating individual client in multiple mode
  const handleUpdateClient = (
    clientId: string,
    updates: Partial<ClientConfig>,
  ) => {
    setMultipleClients((prev) =>
      prev.map((client) =>
        client.id === clientId ? { ...client, ...updates } : client,
      ),
    );
  };

  // Handler for removing a client in multiple mode
  const handleRemoveClient = (clientId: string) => {
    setMultipleClients((prev) =>
      prev.filter((client) => client.id !== clientId),
    );
  };

  // Handler for adding a new client in multiple mode
  const handleAddClient = () => {
    const newClient: ClientConfig = {
      id: `client-${Date.now()}`,
      name: "",
      config: createDefaultStdioConfig(),
    };
    setMultipleClients((prev) => [...prev, newClient]);
  };

  const handleSave = async () => {
    const validClients = multipleClients.filter((c) => c.name.trim());
    if (validClients.length === 0) {
      toast({
        title: "No valid clients",
        description: "Please provide names for at least one client.",
        variant: "destructive",
      });
      return;
    }

    const clientsToSave = [];
    const configErrors = [];

    for (const client of validClients) {
      // For HTTP configs, validate URL if it exists
      if (isHttpConfig(client.config)) {
        if (!client.config.url) {
          configErrors.push(
            `${client.name}: URL is required for HTTP connections`,
          );
          continue;
        }
        try {
          // Validate the URL by creating a new URL object
          new URL(client.config.url.toString());
        } catch {
          configErrors.push(`${client.name}: Invalid URL format`);
          continue;
        }
      }

      // For stdio configs, validate command
      if (isStdioConfig(client.config)) {
        if (!client.config.command?.trim()) {
          configErrors.push(
            `${client.name}: Command is required for stdio connections`,
          );
          continue;
        }
      }

      // Use the client config directly - it already contains all the changes
      clientsToSave.push({
        name: client.name,
        config: client.config,
      });
    }

    if (configErrors.length > 0) {
      toast({
        title: "Configuration errors",
        description: `Please fix the following errors: ${configErrors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    console.log("🔧 clientsToSave", clientsToSave);
    try {
      const result = await onSave(clientsToSave);

      if (result.success.length > 0) {
        toast({
          title: "Clients saved successfully",
          description: `Successfully saved ${result.success.length} connection(s).`,
        });
      }

      if (result.failed.length > 0) {
        toast({
          title: "Some clients failed to save",
          description: `${result.failed.length} connection(s) failed to save. Check the console for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error saving clients",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleBackToSingle = () => {
    // Reset to single client mode with a default client
    setMultipleClients([
      {
        id: "new-client",
        name: "",
        config: createDefaultStdioConfig(),
      },
    ]);
  };

  if (isMultipleMode) {
    return (
      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col overflow-auto bg-gradient-to-br from-background to-muted/20"
      >
        <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSingle}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Create Multiple Clients
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure each imported server as a separate client
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              <Users className="h-3 w-3 mr-1" />
              {multipleClients.length} clients
            </Badge>
          </div>

          <Separator />

          {/* Client Cards */}
          <div className="grid gap-6">
            {multipleClients.map((client, index) => (
              <Card
                key={client.id}
                className="border-2 border-border/50 hover:border-border transition-colors"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Client {index + 1}
                        </CardTitle>
                        <CardDescription>
                          {client.name || "Unnamed client"}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClient(client.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor={`client-name-${client.id}`}
                      className="text-sm font-medium"
                    >
                      Client Name
                    </Label>
                    <Input
                      id={`client-name-${client.id}`}
                      value={client.name}
                      onChange={(e) =>
                        handleUpdateClient(client.id, { name: e.target.value })
                      }
                      placeholder="Enter a descriptive name for this client"
                      className="max-w-md"
                    />
                  </div>

                  {/* Connection Configuration */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">
                        Connection Settings
                      </Label>
                    </div>
                    <div className="border border-border/50 rounded-lg p-4 bg-muted/30">
                      <ConnectionSection
                        connectionStatus="disconnected"
                        transportType={client.config.transportType}
                        setTransportType={(type) => {
                          const newConfig =
                            type === "stdio"
                              ? createDefaultStdioConfig()
                              : createDefaultHttpConfig(type);

                          handleUpdateClient(client.id, {
                            config: newConfig,
                          });
                        }}
                        command={
                          isStdioConfig(client.config)
                            ? client.config.command || ""
                            : ""
                        }
                        setCommand={(command) => {
                          if (isStdioConfig(client.config)) {
                            handleUpdateClient(client.id, {
                              config: {
                                ...client.config,
                                command,
                              },
                            });
                          }
                        }}
                        args={configToDisplayStrings(client.config).argsString}
                        setArgs={(newArgsString) => {
                          if (isStdioConfig(client.config)) {
                            const updatedConfig = updateConfigFromStrings(
                              client.config,
                              newArgsString,
                            );
                            handleUpdateClient(client.id, {
                              config: updatedConfig,
                            });
                          }
                        }}
                        sseUrl={configToDisplayStrings(client.config).urlString}
                        setSseUrl={(url) => {
                          // For HTTP configs, we store the URL string and validate during save
                          if (isHttpConfig(client.config)) {
                            try {
                              const newUrl = new URL(
                                url || "https://example.com",
                              );
                              handleUpdateClient(client.id, {
                                config: {
                                  ...client.config,
                                  url: newUrl,
                                },
                              });
                            } catch {
                              // If URL is invalid, keep the current config
                            }
                          }
                        }}
                        env={
                          isStdioConfig(client.config)
                            ? client.config.env || {}
                            : {}
                        }
                        setEnv={(env) => {
                          if (isStdioConfig(client.config)) {
                            handleUpdateClient(client.id, {
                              config: {
                                ...client.config,
                                env,
                              },
                            });
                          }
                        }}
                        config={config}
                        setConfig={setConfig}
                        bearerToken={bearerToken}
                        setBearerToken={setBearerToken}
                        headerName={headerName}
                        setHeaderName={setHeaderName}
                        onConnect={() => {}} // No-op for form
                        onDisconnect={() => {}} // No-op for form
                        stdErrNotifications={[]}
                        clearStdErrNotifications={() => {}}
                        logLevel="debug"
                        sendLogLevelRequest={async () => {}}
                        loggingSupported={false}
                        hideActionButtons={true}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Client Button */}
            <Card className="border-2 border-dashed border-border/50 hover:border-border transition-colors">
              <CardContent className="p-6">
                <Button
                  variant="ghost"
                  onClick={handleAddClient}
                  className="w-full h-16 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Another Client
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {multipleClients.some((c) => !c.name.trim()) && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Some clients need names</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    multipleClients.filter((c) => c.name.trim()).length === 0
                  }
                  className="min-w-[200px]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? "Create" : "Update"}{" "}
                  {multipleClients.filter((c) => c.name.trim()).length}{" "}
                  Connection(s)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single client mode
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 flex flex-col overflow-auto bg-gradient-to-br from-background to-muted/20"
    >
      <div className="max-w-5xl mx-auto w-full p-6 space-y-8">
        {/* Import Configuration Card - Only show when creating */}
        {isCreating && (
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Import</CardTitle>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Supports the same format used by Claude Desktop and Cursor.
              </p>
              <Button
                onClick={() => setShowImportDialog(true)}
                className="w-full sm:w-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import from Configuration File
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Or separator - Only show when creating */}
        {isCreating && (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <Separator className="w-16" />
              <span className="text-sm font-medium text-muted-foreground">
                or
              </span>
              <Separator className="w-16" />
            </div>
          </div>
        )}

        {/* Manual Configuration Card */}
        <Card className="border-2 border-border/50">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setIsManualConfigExpanded(!isManualConfigExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {isCreating ? "Manual Setup" : `Edit: ${editingClientName}`}
                  </CardTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsManualConfigExpanded(!isManualConfigExpanded);
                }}
              >
                {isManualConfigExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {isManualConfigExpanded && (
            <CardContent className="space-y-6">
              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="client-name" className="text-sm font-medium">
                  Name*
                </Label>
                <Input
                  id="client-name"
                  value={currentClient.name}
                  onChange={(e) =>
                    handleUpdateCurrentClient({ name: e.target.value })
                  }
                  onBlur={() => setIsNameTouched(true)}
                  placeholder="Enter client name"
                  className={`max-w-md ${nameError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {nameError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-sm p-2 text-xs leading-relaxed"
                        >
                          A client name is required to help you identify and
                          manage your MCP connections.
                          <br />
                          It ensures clarity when debugging or switching between
                          multiple clients. Leaving it blank makes the
                          connection untraceable within the tool.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {nameError}
                  </p>
                )}
              </div>

              {/* Connection Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Connection</Label>
                <div className="border border-border/50 rounded-lg p-4 bg-muted/30">
                  <ConnectionSection
                    connectionStatus="disconnected"
                    transportType={currentClient.config.transportType}
                    setTransportType={(type) => {
                      const newConfig =
                        type === "stdio"
                          ? createDefaultStdioConfig()
                          : createDefaultHttpConfig(type);
                      handleUpdateCurrentClient({ config: newConfig });
                    }}
                    command={
                      isStdioConfig(currentClient.config)
                        ? currentClient.config.command || ""
                        : ""
                    }
                    setCommand={(command) => {
                      if (isStdioConfig(currentClient.config)) {
                        handleUpdateCurrentClient({
                          config: {
                            ...currentClient.config,
                            command,
                          },
                        });
                      }
                    }}
                    args={
                      configToDisplayStrings(currentClient.config).argsString
                    }
                    setArgs={handleArgsChange}
                    sseUrl={
                      configToDisplayStrings(currentClient.config).urlString
                    }
                    setSseUrl={handleSseUrlChange}
                    env={
                      isStdioConfig(currentClient.config)
                        ? currentClient.config.env || {}
                        : {}
                    }
                    setEnv={(env) => {
                      if (isStdioConfig(currentClient.config)) {
                        handleUpdateCurrentClient({
                          config: {
                            ...currentClient.config,
                            env,
                          },
                        });
                      }
                    }}
                    config={config}
                    setConfig={setConfig}
                    bearerToken={bearerToken}
                    setBearerToken={setBearerToken}
                    headerName={headerName}
                    setHeaderName={setHeaderName}
                    onConnect={() => {}} // No-op for form
                    onDisconnect={() => {}} // No-op for form
                    stdErrNotifications={[]}
                    clearStdErrNotifications={() => {}}
                    logLevel="debug"
                    sendLogLevelRequest={async () => {}}
                    loggingSupported={false}
                    hideActionButtons={true}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Action Bar */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!currentClient.name.trim()}
            className="min-w-[180px] h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-primary/20"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {isCreating ? "Create Connection" : "Update Connection"}
          </Button>
          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        </div>

        {/* Import Dialog */}
        <ConfigImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImportServers={handleImportServers}
        />
      </div>
    </div>
  );
};

export default ClientFormSection;
