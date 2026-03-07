#!/bin/bash

# Ensure the target directory exists
mkdir -p /app/public/config

# Generate the runtime-config.js file in the correct location
cat <<EOF > /app/public/config/runtime-config.js
window.runtimeConfig = {
  NEXT_PUBLIC_HOST: "${NEXT_PUBLIC_HOST}",
  NEXT_PUBLIC_KEYCLOAK_PORT: "${NEXT_PUBLIC_KEYCLOAK_PORT}",
  NEXT_PUBLIC_REDIRECT_PORT: "${NEXT_PUBLIC_REDIRECT_PORT}",
  NEXT_PUBLIC_API_PORT: "${NEXT_PUBLIC_API_PORT}",
  NEXT_PUBLIC_KEYCLOAK_REALM: "${NEXT_PUBLIC_KEYCLOAK_REALM}",
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: "${NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}",
  NEXT_PUBLIC_KEYCLOAK_URL: "${NEXT_PUBLIC_KEYCLOAK_URL}",
  NEXT_PUBLIC_REDIRECT_URI: "${NEXT_PUBLIC_REDIRECT_URI}",
  NEXT_PUBLIC_API_BASE_URL: "${NEXT_PUBLIC_API_BASE_URL}",
  NEXT_PUBLIC_ENCRYPTION_KEY: "${NEXT_PUBLIC_ENCRYPTION_KEY}"
};
EOF

echo "Generated runtime-config.js with the following content:"
cat /app/public/config/runtime-config.js

# Start the application
PORT=8687 HOSTNAME=0.0.0.0 exec node server.js
