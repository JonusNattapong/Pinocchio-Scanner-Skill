import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

type Props = {
  path: string;
  onSubmit: (path: string) => void;
};

export default function PathForm({ path, onSubmit }: Props): React.JSX.Element {
  const [value, setValue] = useState<string>(path);

  useInput((input: string, key: { return?: boolean; backspace?: boolean }) => {
    if (key.return) {
      if (value.trim().length > 0) {
        onSubmit(value.trim());
      }
      return;
    }
    if (key.backspace) {
      setValue((prev: string) => prev.slice(0, -1));
      return;
    }
    if (input) {
      setValue((prev: string) => prev + input);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Step 1: Enter path to scan</Text>
      <Text color="gray">Type a file or directory path and press Enter.</Text>
      <Box marginTop={1}>
        <Text color="cyan">Path: </Text>
        <Text>{value}</Text>
      </Box>
    </Box>
  );
}
