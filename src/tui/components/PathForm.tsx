import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

type Props = {
  path: string;
  onSubmit: (path: string) => void | Promise<void>;
};

export default function PathForm({ path, onSubmit }: Props): React.JSX.Element {
  const [value, setValue] = useState<string>(path);

  useInput((input: string, key: { return?: boolean; backspace?: boolean; delete?: boolean }) => {
    if (key.return) {
      if (value.trim().length > 0) {
        void onSubmit(value.trim());
      }
      return;
    }
    if (key.backspace || key.delete) {
      setValue((prev: string) => prev.slice(0, -1));
      return;
    }
    if (input) {
      setValue((prev: string) => prev + input);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} paddingY={1}>
      <Text bold color="cyan">Step 1 of 2  Path selection</Text>
      <Text color="gray">Target a skill file or an entire skills folder. Enter validates the path.</Text>
      <Box marginTop={1}>
        <Text color="cyan">Path</Text>
        <Text color="gray">: </Text>
        <Text>{value || "./skills"}</Text>
      </Box>
      <Text color="gray">Backspace edits the path. Esc quits at any time.</Text>
    </Box>
  );
}
