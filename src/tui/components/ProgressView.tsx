import React, { useEffect, useMemo, useState } from "react";
import { Box, Text } from "ink";
import type { ScanProgress } from "../../types.js";

type Props = {
  path: string;
  running: boolean;
  progress?: ScanProgress | null;
};

const frames = ["◐", "◓", "◑", "◒"];

export default function ProgressView({ path, running, progress }: Props): React.JSX.Element {
  const [elapsed, setElapsed] = useState<number>(0);
  const [frameIndex, setFrameIndex] = useState<number>(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
      setFrameIndex((previous) => (previous + 1) % frames.length);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progressText = useMemo(() => {
    if (!progress || progress.totalFiles === 0) {
      return "Preparing scan targets...";
    }

    const percent = Math.min(
      100,
      Math.floor((progress.scannedFiles / progress.totalFiles) * 100),
    );

    return `${progress.scannedFiles}/${progress.totalFiles} files (${percent}%)`;
  }, [progress]);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={1} paddingY={1}>
      <Text bold color="blue">{frames[frameIndex]} Scanning</Text>
      <Text color="gray">Target: {path}</Text>
      <Text color={running ? "green" : "yellow"}>
        Status: {running ? "Running" : "Finishing"}
      </Text>
      <Text color="cyan">Elapsed: {elapsed}s</Text>
      <Text color="magenta">Progress: {progressText}</Text>
      <Text color="gray">
        Files with issues: {progress?.filesWithIssues ?? 0}   Findings: {progress?.findingsCount ?? 0}
      </Text>
      <Text color="gray">The scan now emits live progress from the directory walker.</Text>
    </Box>
  );
}
