import React from "react";
import { Box, Text } from "ink";
import type { SecurityFinding } from "../../types.js";

type Props = {
  finding: SecurityFinding | null;
};

export default function FindingDetail({ finding }: Props): React.JSX.Element {
  if (!finding) {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} paddingY={1}>
        <Text color="gray">Select a finding to inspect code context and remediation.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} paddingY={1}>
      <Text bold color="yellow">
        {finding.severity.toUpperCase()} • {finding.type}
      </Text>
      <Text>{finding.message}</Text>
      <Text color="cyan">{finding.filePath}:{finding.line}:{finding.column}</Text>
      {finding.code && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="cyan">Code</Text>
          {finding.code.split("\n").slice(0, 5).map((line, idx) => (
            <Text key={idx} color={idx === 0 ? undefined : "gray"}>{line}</Text>
          ))}
        </Box>
      )}
      {finding.remediation && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="green">Suggested Fix</Text>
          {finding.remediation.split("\n").map((line, idx) => (
            <Text key={idx}>{line}</Text>
          ))}
        </Box>
      )}
      {finding.context && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="magenta">Context</Text>
          <Text color="gray">{finding.context}</Text>
        </Box>
      )}
    </Box>
  );
}
