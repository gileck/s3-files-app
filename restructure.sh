#!/bin/bash

# Create new directory structure
mkdir -p src/{client,server,apis,common}/

# Move server-related files
mkdir -p src/server/{ai,cache,s3}
mv src/ai/* src/server/ai/
mv src/serverUtils/cache/* src/server/cache/
mv src/serverUtils/s3/* src/server/s3/

# Move API-related files
mkdir -p src/apis/{chat,fileManagement,settings/clearCache}
mv src/api/chat/* src/apis/chat/
mv src/api/fileManagement/* src/apis/fileManagement/
mv src/api/settings/clearCache/* src/apis/settings/clearCache/
mv src/api/processApiCall.ts src/apis/
mv src/api/types.ts src/apis/
mv src/api/apis.ts src/apis/

# Move client-related files
mkdir -p src/client/{components/layout,context,router,routes,styles,utils}
mv src/components/Layout.tsx src/client/components/
mv src/components/layout/* src/client/components/layout/
mv src/context/SettingsContext.tsx src/client/context/
mv src/router/index.tsx src/client/router/
mv src/routes/* src/client/routes/
mv src/styles/* src/client/styles/ 2>/dev/null || true
mv src/clientUtils/apiClient.ts src/client/utils/

# Move common files
mkdir -p src/common/types
mv src/types/next-pwa.d.ts src/common/types/

# Remove old directories (only after confirming everything is moved)
rm -rf src/ai
rm -rf src/api
rm -rf src/clientUtils
rm -rf src/components
rm -rf src/context
rm -rf src/router
rm -rf src/routes
rm -rf src/serverUtils
rm -rf src/styles
rm -rf src/types

echo "Restructuring completed successfully!"
