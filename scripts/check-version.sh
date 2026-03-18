#!/bin/bash
set -e

DIRECTORY="${1:-.}"
PREFIX="${2:-v}"

set_output() {
  echo "$1=$2" >> "$GITHUB_OUTPUT"
}

# Get current version from package.json
if [ ! -f "$DIRECTORY/package.json" ]; then
  echo "Error: package.json not found"
  exit 1
fi

CURRENT_VERSION=$(node -p "require('$DIRECTORY/package.json').version")
CURRENT_TAG="${PREFIX}${CURRENT_VERSION}"

echo "Current version: $CURRENT_VERSION"
echo "Current tag: $CURRENT_TAG"

# Check if tag already exists
if git rev-parse "$CURRENT_TAG" >/dev/null 2>&1; then
  echo "Tag $CURRENT_TAG already exists"
  set_output "should_release" "false"
  set_output "tag_name" "$CURRENT_TAG"
  set_output "version" "$CURRENT_VERSION"
  exit 0
fi

# Get previous tag
PREVIOUS_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$PREVIOUS_TAG" ]; then
  echo "No previous tags found - first release"
  set_output "should_release" "true"
  set_output "tag_name" "$CURRENT_TAG"
  set_output "version" "$CURRENT_VERSION"
  exit 0
fi

PREVIOUS_VERSION="${PREVIOUS_TAG#$PREFIX}"
echo "Previous version: $PREVIOUS_VERSION"

# Check if version changed
if [ "$CURRENT_VERSION" = "$PREVIOUS_VERSION" ]; then
  echo "Version unchanged"
  set_output "should_release" "false"
  set_output "tag_name" "$CURRENT_TAG"
  set_output "version" "$CURRENT_VERSION"
  exit 0
fi

echo "Version changed from $PREVIOUS_VERSION to $CURRENT_VERSION"
set_output "should_release" "true"
set_output "tag_name" "$CURRENT_TAG"
set_output "version" "$CURRENT_VERSION"
exit 0
