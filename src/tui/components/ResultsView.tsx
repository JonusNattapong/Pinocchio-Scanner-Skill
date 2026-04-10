import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { SecurityFinding } from "../../types.js";
import FindingDetail from "./FindingDetail.js";

type UnifiedResult = {
  findings: SecurityFinding[];
  scannedAt: Date;
  summary?: {
    totalFiles: number;
    filesWithIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  isDirectory: boolean;
};

type Props = {
  path: string;
  isDirectory: boolean;
  result: UnifiedResult;
  exportState?: {
    reportPath?: string;
    sarifPath?: string;
  };
  onRestart: () => void;
  onExport?: () => void | Promise<void>;
};

const severityFilters = ["all", "critical", "high", "medium", "low"] as const;

export default function ResultsView({
  path,
  isDirectory,
  result,
  exportState,
  onRestart,
  onExport,
}: Props): React.JSX.Element {
  const [filterIndex, setFilterIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const filtered = useMemo(() => {
    const filter = severityFilters[filterIndex];
    if (filter === "all") return result.findings;
    return result.findings.filter((finding) => finding.severity === filter);
  }, [filterIndex, result.findings]);

  useInput((input: string, key: { upArrow?: boolean; downArrow?: boolean; leftArrow?: boolean; rightArrow?: boolean }) => {
    if (key.leftArrow) {
      setFilterIndex((prev: number) => (prev - 1 + severityFilters.length) % severityFilters.length);
      setSelectedIndex(0);
      return;
    }
    if (key.rightArrow) {
      setFilterIndex((prev: number) => (prev + 1) % severityFilters.length);
      setSelectedIndex(0);
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((prev: number) => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((prev: number) => Math.min(filtered.length - 1, prev + 1));
      return;
    }
    if (input.toLowerCase() === "r") {
      onRestart();
      return;
    }
    if (input.toLowerCase() === "e") {
      void onExport?.();
    }
  });

  const selected = filtered[selectedIndex] ?? null;
  const summary = result.summary ?? {
    totalFiles: result.findings.length > 0 ? 1 : 0,
    filesWithIssues: result.findings.length > 0 ? 1 : 0,
    criticalCount: result.findings.filter((finding) => finding.severity === "critical").length,
    highCount: result.findings.filter((finding) => finding.severity === "high").length,
    mediumCount: result.findings.filter((finding) => finding.severity === "medium").length,
    lowCount: result.findings.filter((finding) => finding.severity === "low").length,
  };
  const exportsInfo = exportState ?? {};

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} paddingY={1}>
      <Text bold color="green">Scan results</Text>
      <Text color="gray">Target: {path}</Text>
      <Text color="gray">Mode: {isDirectory ? "Directory" : "File"}</Text>
      <Text color="gray">Scanned at: {result.scannedAt.toISOString()}</Text>
      <Box marginTop={1} flexDirection="row" flexWrap="wrap">
        <Text color="cyan">Files: {summary.totalFiles}   </Text>
        <Text color="yellow">Files with issues: {summary.filesWithIssues}   </Text>
        <Text color="red">Critical: {summary.criticalCount}   </Text>
        <Text color="red">High: {summary.highCount}   </Text>
        <Text color="yellow">Medium: {summary.mediumCount}   </Text>
        <Text color="blue">Low: {summary.lowCount}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Filter</Text>
        <Text> </Text>
        {severityFilters.map((filter, index) => (
          <Text key={filter} color={index === filterIndex ? "cyan" : "gray"}>
            [{filter}]
          </Text>
        ))}
      </Box>
      <Box marginTop={1} flexDirection="row" gap={2}>
        <Box flexDirection="column" width="55%">
          <Text bold>Findings ({filtered.length})</Text>
          {filtered.length === 0 && <Text color="green">No findings for this filter.</Text>}
          {filtered.map((finding: SecurityFinding, index: number) => (
            <Text
              key={`${finding.filePath}-${finding.line}-${finding.column}`}
              color={index === selectedIndex ? "cyan" : undefined}
            >
              {index === selectedIndex ? ">" : " "} [{finding.severity}] {finding.type}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" width="45%">
          <Text bold>Details</Text>
          <FindingDetail finding={selected} />
        </Box>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="yellow">R restart  E export again  Arrow keys filter and inspect</Text>
        {(exportsInfo.reportPath || exportsInfo.sarifPath) && (
          <Text color="gray">
            Exported: {exportsInfo.reportPath ?? "-"} {exportsInfo.sarifPath ?? ""}
          </Text>
        )}
      </Box>
    </Box>
  );
}
