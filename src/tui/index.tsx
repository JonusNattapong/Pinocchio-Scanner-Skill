import React from "react";
import { render } from "ink";
import App from "./App.js";
import type { ScanOptions } from "../types.js";

export type TuiStartOptions = {
  initialPath?: string;
  initialOptions?: ScanOptions;
  json?: boolean;
  report?: boolean;
  sarif?: boolean;
};

export function startTui(options: TuiStartOptions = {}): void {
  render(<App {...options} />);
}
