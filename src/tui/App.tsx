import React, { useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import PathForm from "./components/PathForm.js";
import OptionsForm from "./components/OptionsForm.js";
import ProgressView from "./components/ProgressView.js";
import ResultsView from "./components/ResultsView.js";
import type { ScanOptions, SecurityFinding, ScanResult } from "../types.js";
import { scanFile, scanDirectory } from "../scanner.js";
import { resolve } from "path";
import { stat } from "fs/promises";

type Phase = "setup-path" | "setup-options" | "running" | "results" | "error";

type TuiAppProps = {
  initialPath?: string;
  initialOptions?: ScanOptions;
  json?: boolean;
  report?: boolean;
  sarif?: boolean;
};

type UnifiedResult = {
  findings: SecurityFinding[];
  scannedAt: Date;
  summary?: ScanResult["summary"];
  isDirectory: boolean;
};

export default function App({
  initialPath,
  initialOptions,
  report,
  sarif,
}: TuiAppProps): React.JSX.Element {
  const { exit } = useApp();
  const [phase, setPhase] = useState<Phase>("setup-path");
  const [path, setPath] = useState<string>(initialPath ?? "");
  const [options, setOptions] = useState<ScanOptions>(initialOptions ?? {});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnifiedResult | null>(null);
  const [isDirectory, setIsDirectory] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);

  useInput((input: string, key: { escape?: boolean; ctrl?: boolean; return?: boolean }) => {
    if (key.escape) {
      exit();
    }
    if (key.ctrl && input === "c") {
      exit();
    }
    if (phase === "error" && key.return) {
      setPhase("setup-path");
    }
  });

  const resolvedPath = useMemo(() => {
    if (!path) return "";
    return resolve(process.cwd(), path);
  }, [path]);

  const startScan = async (nextOptions?: ScanOptions): Promise<void> => {
    setRunning(true);
    setPhase("running");
    setError(null);
    try {
      const optionsToUse = nextOptions ?? options;
      const stats = await stat(resolvedPath);
      if (stats.isFile()) {
        const findings = await scanFile(resolvedPath, optionsToUse);
        setIsDirectory(false);
        setResult({ findings, scannedAt: new Date(), isDirectory: false });
      } else if (stats.isDirectory()) {
        const scanResult = await scanDirectory(resolvedPath, optionsToUse);
        setIsDirectory(true);
        setResult({
          findings: scanResult.findings,
          scannedAt: scanResult.scannedAt,
          summary: scanResult.summary,
          isDirectory: true,
        });
      } else {
        throw new Error("Unsupported path type.");
      }
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>
        pinocchio-scan TUI
      </Text>
      <Text color="gray">Press Esc or Ctrl+C to exit</Text>
      <Box marginTop={1}>
        {phase === "setup-path" && (
          <PathForm
            path={path}
            onSubmit={(nextPath: string) => {
              setPath(nextPath);
              setPhase("setup-options");
            }}
          />
        )}
        {phase === "setup-options" && (
          <OptionsForm
            path={path}
            options={options}
            onBack={() => setPhase("setup-path")}
            onSubmit={(nextOptions: ScanOptions) => {
              setOptions(nextOptions);
              startScan(nextOptions);
            }}
          />
        )}
        {phase === "running" && (
          <ProgressView path={resolvedPath} running={running} />
        )}
        {phase === "results" && result && (
          <ResultsView
            path={resolvedPath}
            isDirectory={isDirectory}
            result={result}
            onRestart={() => setPhase("setup-path")}
          />
        )}
        {phase === "error" && (
          <Box flexDirection="column">
            <Text color="red">Error: {error ?? "Unknown error"}</Text>
            <Text color="yellow">Press Enter to restart.</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
