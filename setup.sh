#!/bin/bash
set -e

echo "========================================="
echo "  Pierre - Setup Script"
echo "========================================="
echo ""

# Step 1: Convex
echo "STEP 1: Setting up Convex..."
echo "This will open your browser to log in to Convex."
echo ""
cd apps/web

# Login to Convex
npx convex login

# Initialize the project (creates tables, generates types)
npx convex dev --once

echo ""
echo "✓ Convex is set up! Your NEXT_PUBLIC_CONVEX_URL has been saved to .env.local"
echo ""

# Step 2: Clerk
echo "========================================="
echo "STEP 2: Setting up Clerk..."
echo "========================================="
echo ""
echo "1. Go to https://dashboard.clerk.com"
echo "2. Create a new application called 'Pierre'"
echo "3. Enable Email + Password sign-in method"
echo "4. Go to API Keys in the sidebar"
echo "5. Copy your keys and paste them below:"
echo ""

read -p "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_...): " CLERK_PK
read -p "CLERK_SECRET_KEY (sk_...): " CLERK_SK

# Write Clerk keys to .env.local
if grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" .env.local; then
  sed -i '' "s|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PK|" .env.local
  sed -i '' "s|CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=$CLERK_SK|" .env.local
fi

echo ""
echo "✓ Clerk keys saved to .env.local"

# Step 3: Configure Clerk JWT for Convex
echo ""
echo "========================================="
echo "STEP 3: Configure Clerk JWT Template for Convex"
echo "========================================="
echo ""
echo "1. In Clerk Dashboard, go to JWT Templates"
echo "2. Click 'New template' -> select 'Convex'"
echo "3. Leave the default settings and click 'Save'"
echo "4. Copy the Issuer URL (looks like https://xxxx.clerk.accounts.dev)"
echo ""

read -p "Clerk JWT Issuer URL: " CLERK_ISSUER

# Step 4: Set Clerk issuer in Convex environment
echo ""
echo "Setting CLERK_JWT_ISSUER_DOMAIN in Convex..."
npx convex env set CLERK_JWT_ISSUER_DOMAIN "$CLERK_ISSUER"

echo ""
echo "✓ Convex environment variable set"

# Step 5: Anthropic API Key (optional)
echo ""
echo "========================================="
echo "STEP 4: Anthropic API Key (optional)"
echo "========================================="
echo ""
echo "Get your API key from https://console.anthropic.com"
echo "(Press Enter to skip if you don't have one yet)"
echo ""

read -p "ANTHROPIC_API_KEY (sk-ant-...): " ANTHROPIC_KEY

if [ -n "$ANTHROPIC_KEY" ]; then
  sed -i '' "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_KEY|" .env.local
  npx convex env set ANTHROPIC_API_KEY "$ANTHROPIC_KEY"
  echo "✓ Anthropic key saved"
else
  echo "Skipped - you can add it later to .env.local"
fi

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "To start developing:"
echo "  Terminal 1: cd apps/web && npx convex dev"
echo "  Terminal 2: cd apps/web && npm run dev"
echo ""
echo "Then open http://localhost:3000"
echo ""
