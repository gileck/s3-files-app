import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Custom rule to prevent adding new files under /src/pages/api/ except for process.ts
const restrictApiRoutesRule = {
  create(context) {
    // Get the filename of the current file being linted
    const filename = context.getFilename();
    
    // Check if the file is under /src/pages/api/ but not process.ts
    if (
      filename.includes('/src/pages/api/') && 
      !filename.endsWith('/src/pages/api/process.ts') &&
      !filename.endsWith('\\src\\pages\\api\\process.ts') // For Windows paths
    ) {
      // Report an error for any file that's not process.ts in the /src/pages/api/ directory
      context.report({
        loc: { line: 1, column: 0 },
        message: 'API routes should not be added directly under /src/pages/api/. Use the centralized API architecture pattern instead.',
      });
    }
    
    return {};
  }
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      "restrict-api-routes": {
        rules: {
          "no-direct-api-routes": restrictApiRoutesRule
        }
      }
    },
    rules: {
      "restrict-api-routes/no-direct-api-routes": "error",
      "react-hooks/exhaustive-deps": "off"
    }
  }
];

export default eslintConfig;
