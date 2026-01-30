import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { ScanOptions, CheckType } from "../../types.js";

type Props = {
  path: string;
  options: ScanOptions;
  onBack: () => void;
  onSubmit: (options: ScanOptions) => void;
};

const severityOptions = ["low", "medium", "high", "critical"] as const;
const checkOptions: CheckType[] = [
  "command-injection",
  "file-system",
  "hardcoded-secret",
  "code-injection",
  "semantic-analysis",
  "malware-scan",
  "cisco-defense",
  "dependency-audit",
  "mcp-definition",
  "tool-schema",
  "excessive-agency",
  "python-security",
  "go-security",
  "rust-security",
];

type FormState = {
  severityIndex: number;
  checks: Set<CheckType>;
  ignore: string;
  provider: string;
  model: string;
  webSearch: boolean;
  fix: boolean;
};

export default function OptionsForm({
  path,
  options,
  onBack,
  onSubmit,
}: Props): React.JSX.Element {
  const [cursor, setCursor] = useState<number>(0);
  const [state, setState] = useState<FormState>(() => ({
    severityIndex: severityOptions.indexOf(
      (options.severityThreshold ?? "low") as typeof severityOptions[number],
    ),
    checks: new Set(options.checks ?? checkOptions),
    ignore: (options.ignorePatterns ?? []).join(","),
    provider: options.aiProvider ?? "",
    model: options.aiModel ?? "",
    webSearch: options.webSearch ?? false,
    fix: options.fix ?? false,
  }));

  const fields = useMemo(
    () => [
      "Severity",
      "Checks",
      "Ignore globs",
      "AI provider",
      "AI model",
      "Web search",
      "Auto-fix",
      "Start scan",
      "Back",
    ],
    [],
  );

  useInput((input: string, key: { upArrow?: boolean; downArrow?: boolean; return?: boolean; tab?: boolean; backspace?: boolean }) => {
    if (key.upArrow) {
      setCursor((prev: number) => (prev - 1 + fields.length) % fields.length);
      return;
    }
    if (key.downArrow || key.tab) {
      setCursor((prev: number) => (prev + 1) % fields.length);
      return;
    }
    if (key.return) {
      const field = fields[cursor];
      if (field === "Start scan") {
        onSubmit({
          severityThreshold: severityOptions[state.severityIndex],
          checks: Array.from(state.checks),
          ignorePatterns: state.ignore ? state.ignore.split(",") : undefined,
          aiProvider: state.provider || undefined,
          aiModel: state.model || undefined,
          webSearch: state.webSearch,
          fix: state.fix,
        });
        return;
      }
      if (field === "Back") {
        onBack();
      }
      if (field === "Web search") {
        setState((prev: FormState) => ({ ...prev, webSearch: !prev.webSearch }));
      }
      if (field === "Auto-fix") {
        setState((prev: FormState) => ({ ...prev, fix: !prev.fix }));
      }
      return;
    }
    if (cursor === 0) {
      if (input === "l" || input === "m" || input === "h" || input === "c") {
        const index = input === "l" ? 0 : input === "m" ? 1 : input === "h" ? 2 : 3;
        setState((prev: FormState) => ({ ...prev, severityIndex: index }));
      }
      if (input === "+") {
        setState((prev: FormState) => ({ ...prev, severityIndex: (prev.severityIndex + 1) % severityOptions.length }));
      }
      if (input === "-") {
        setState((prev: FormState) => ({ ...prev, severityIndex: (prev.severityIndex - 1 + severityOptions.length) % severityOptions.length }));
      }
      return;
    }
    if (cursor === 1) {
      const index = Number.parseInt(input, 10);
      if (!Number.isNaN(index) && checkOptions[index - 1]) {
        const keyName = checkOptions[index - 1];
        setState((prev: FormState) => {
          const next = new Set(prev.checks);
          if (next.has(keyName)) {
            next.delete(keyName);
          } else {
            next.add(keyName);
          }
          return { ...prev, checks: next };
        });
      }
      return;
    }
    if (cursor === 2) {
      if (key.backspace) {
        setState((prev: FormState) => ({ ...prev, ignore: prev.ignore.slice(0, -1) }));
      } else if (input) {
        setState((prev: FormState) => ({ ...prev, ignore: prev.ignore + input }));
      }
      return;
    }
    if (cursor === 3) {
      if (key.backspace) {
        setState((prev: FormState) => ({ ...prev, provider: prev.provider.slice(0, -1) }));
      } else if (input) {
        setState((prev: FormState) => ({ ...prev, provider: prev.provider + input }));
      }
      return;
    }
    if (cursor === 4) {
      if (key.backspace) {
        setState((prev: FormState) => ({ ...prev, model: prev.model.slice(0, -1) }));
      } else if (input) {
        setState((prev: FormState) => ({ ...prev, model: prev.model + input }));
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Step 2: Configure scan options</Text>
      <Text color="gray">Path: {path}</Text>
      <Box marginTop={1} flexDirection="column">
        <Text color={cursor === 0 ? "cyan" : undefined}>
          Severity (l/m/h/c, +/-): {severityOptions[state.severityIndex]}
        </Text>
        <Text color={cursor === 1 ? "cyan" : undefined}>
          Checks (press number to toggle):
        </Text>
        {checkOptions.map((check, index) => (
          <Text key={check}>
            {state.checks.has(check) ? "[x]" : "[ ]"} {index + 1}. {check}
          </Text>
        ))}
        <Text color={cursor === 2 ? "cyan" : undefined}>
          Ignore globs: {state.ignore || "(none)"}
        </Text>
        <Text color={cursor === 3 ? "cyan" : undefined}>
          AI provider: {state.provider || "(none)"}
        </Text>
        <Text color={cursor === 4 ? "cyan" : undefined}>
          AI model: {state.model || "(default)"}
        </Text>
        <Text color={cursor === 5 ? "cyan" : undefined}>
          Web search: {state.webSearch ? "on" : "off"} (Enter to toggle)
        </Text>
        <Text color={cursor === 6 ? "cyan" : undefined}>
          Auto-fix: {state.fix ? "on" : "off"} (Enter to toggle)
        </Text>
        <Text color={cursor === 7 ? "green" : undefined}>Start scan (Enter)</Text>
        <Text color={cursor === 8 ? "yellow" : undefined}>Back (Enter)</Text>
      </Box>
    </Box>
  );
}
