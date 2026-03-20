import { defineConfig } from "orval";

export default defineConfig({
  gymTracker: {
    input: {
      target: "./openapi.json",
    },
    output: {
      workspace: "src/api",
      target: "./gymTracker.ts",
      client: "react-query",
      mode: "tags-split",
      indexFiles: true,
      schemas: "./model",
      override: {
        mutator: {
          path: "../lib/axios.ts",
          name: "api",
        },
      },
    },
  },
});
