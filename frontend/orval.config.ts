import { defineConfig } from "orval";

export default defineConfig({
  gymTracker: {
    input: {
      target: "./openapi.json",
    },
    output: {
      target: "src/api",
      client: "react-query",
      override: {
        mutator: {
          path: "./src/lib/axios.ts",
          name: "api",
        },
      },
    },
  },
});
