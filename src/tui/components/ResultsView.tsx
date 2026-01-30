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
  onRestart: () => void;
};

const severityFilters = ["all", "critical", "high", "medium", "low"] as const;

export default function ResultsView({
  path,
  isDirectory,
  result,
  onRestart,
}: Props): React.JSX.Element {
  const [filterIndex, setFilterIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const filtered = useMemo(() => {
    const filter = severityFilters[filterIndex];
    if (filter === "all") return result.findings;
    return result.findings.filter((finding) => finding.severity === filter);
  }, [filterIndex, result.findings]);

  useInput((input: string, key: { upArrow?: boolean; downArrow?: boolean; leftArrow?: boolean; rightArrow?: boolean; return?: boolean }) => {
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
    if (key.return && input.toLowerCase() === "r") {
      onRestart();
    }
  });

  const selected = filtered[selectedIndex] ?? null;

  return (
    <Box flexDirection="column">
      <Text bold>Results</Text>
      <Text color="gray">Target: {path}</Text>
      <Text color="gray">Mode: {isDirectory ? "Directory" : "File"}</Text>
      <Text color="gray">Scanned at: {result.scannedAt.toISOString()}</Text>
      {result.summary && (
        <Box flexDirection="row" marginTop={1} gap={2}>
          <Text>Total files: {result.summary.totalFiles}</Text>
          <Text>Files with issues: {result.summary.filesWithIssues}</Text>
          <Text color="red">Critical: {result.summary.criticalCount}</Text>
          <Text color="magenta">High: {result.summary.highCount}</Text>
          <Text color="yellow">Medium: {result.summary.mediumCount}</Text>
          <Text color="blue">Low: {result.summary.lowCount}</Text>
        </Box>
      )}
      <Box marginTop={1} flexDirection="row">
        <Text>Filter: </Text>
        {severityFilters.map((filter, index) => (
          <Text key={filter} color={index === filterIndex ? "cyan" : undefined}>
            {filter}
            {index < severityFilters.length - 1 ? " | " : ""}
          </Text>
        ))}
      </Box>
      <Box marginTop={1} flexDirection="row" gap={4}>
        <Box flexDirection="column" width="50%">
          <Text bold>Findings ({filtered.length})</Text>
          {filtered.length === 0 && <Text color="green">No findings for this filter.</Text>}
          {filtered.map((finding: SecurityFinding, index: number) => (
            <Text key={`${finding.filePath}-${finding.line}-${finding.column}`} color={index === selectedIndex ? "cyan" : undefined}>
              {index === selectedIndex ? ">" : " "} [{finding.severity}] {finding.type} - {finding.message}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" width="50%">
          <Text bold>Details</Text>
          <FindingDetail finding={selected} />
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text color="yellow">Press R to restart, Esc to exit.</Text>
      </Box>
    </Box>
  );
}
