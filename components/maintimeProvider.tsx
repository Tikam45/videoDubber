"use client";

import { darken, MantineProvider } from "@mantine/core";
import React from "react";

export function MantineAppProvider({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

