import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";

type Props = {
  path: string;
  running: boolean;
};

export default function ProgressView({ path, running }: Props): React.JSX.Element {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column">
      <Text bold>Scanning in progress...</Text>
      <Text color="gray">Target: {path}</Text>
      <Text color={running ? "green" : "yellow"}>
        Status: {running ? "Running" : "Finishing"}
      </Text>
      <Text color="cyan">Elapsed: {elapsed}s</Text>
    </Box>
  );
}
