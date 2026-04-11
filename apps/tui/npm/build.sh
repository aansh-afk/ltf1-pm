#!/bin/bash
set -e

VERSION="0.2.2"
CONVEX_URL="${CONVEX_URL:-https://upbeat-mouse-967.convex.cloud}"
LDFLAGS="-X main.defaultConvexURL=$CONVEX_URL"

cd "$(dirname "$0")/.."

echo "Building ltf1 v$VERSION for all platforms..."

# Platform matrix: GOOS/GOARCH/npm-suffix
platforms=(
  "darwin/arm64/darwin-arm64"
  "darwin/amd64/darwin-x64"
  "linux/arm64/linux-arm64"
  "linux/amd64/linux-x64"
  "windows/amd64/windows-x64"
  "windows/arm64/windows-arm64"
)

for entry in "${platforms[@]}"; do
  IFS='/' read -r goos goarch suffix <<< "$entry"

  pkg_name="ltf1-$suffix"
  pkg_dir="npm/$pkg_name"
  bin_name="ltf1"
  if [ "$goos" = "windows" ]; then
    bin_name="ltf1.exe"
  fi

  echo "  Building $pkg_name ($goos/$goarch)..."

  mkdir -p "$pkg_dir/bin"

  GOOS=$goos GOARCH=$goarch go build -ldflags "$LDFLAGS" -o "$pkg_dir/bin/$bin_name" ./cmd/ltf1

  cat > "$pkg_dir/package.json" <<PKGJSON
{
  "name": "@vvg-ltf1/$suffix",
  "version": "$VERSION",
  "description": "ltf1 binary for $suffix",
  "os": ["$(echo $goos | sed 's/darwin/darwin/;s/linux/linux/;s/windows/win32/')"],
  "cpu": ["$(echo $goarch | sed 's/amd64/x64/;s/arm64/arm64/')"],
  "license": "AGPL-3.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/aansh-afk/ltf1-pm"
  }
}
PKGJSON

  echo "  Done: $pkg_dir/bin/$bin_name"
done

echo ""
echo "All platforms built. To publish:"
echo ""
echo "  # Publish platform packages first:"
for entry in "${platforms[@]}"; do
  IFS='/' read -r _ _ suffix <<< "$entry"
  echo "  cd npm/ltf1-$suffix && npm publish --access public && cd ../.."
done
echo ""
echo "  # Then publish the main package:"
echo "  cd npm/ltf1 && npm publish --access public && cd ../.."
echo ""
echo "Users install with: npm i -g @vvg-ltf1/cli"
