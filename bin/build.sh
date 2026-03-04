#!/usr/bin/env bash
#
# Build a production distribution zip for the AI Agent plugin.
#
# Usage:
#   bin/build.sh
#
# The script:
#   1. Builds production JS/CSS assets via wp-scripts.
#   2. Reads the version from the plugin header in ai-agent.php.
#   3. Creates ai-agent-{version}.zip with standard WP plugin directory structure.
#   4. Excludes everything listed in .distignore plus bin/, .claude/, *.map, and tests.

set -euo pipefail

# ── Resolve plugin root (works regardless of where the script is invoked) ──
PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PLUGIN_DIR"

# ── Read version from plugin header ──
VERSION="$(grep -m1 '^ \* Version:' ai-agent.php | sed 's/^.*Version:[[:space:]]*//' | tr -d '[:space:]')"
if [ -z "$VERSION" ]; then
	echo "ERROR: Could not read Version from ai-agent.php plugin header." >&2
	exit 1
fi

echo "==> Building AI Agent v${VERSION}"

# ── 1. Build production assets ──
echo "==> Building production JS/CSS assets..."
npx wp-scripts build
echo "    Done."

# ── 2. Prepare temp directory ──
BUILD_DIR="$(mktemp -d)"
DEST="${BUILD_DIR}/ai-agent"
mkdir -p "$DEST"

cleanup() {
	rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

# ── 3. Collect exclusion patterns ──
# Start with patterns from .distignore
EXCLUDE_ARGS=()
if [ -f .distignore ]; then
	while IFS= read -r pattern || [ -n "$pattern" ]; do
		# Skip blank lines and comments
		pattern="$(echo "$pattern" | xargs)"
		[ -z "$pattern" ] && continue
		[[ "$pattern" == \#* ]] && continue
		EXCLUDE_ARGS+=("--exclude=$pattern")
	done < .distignore
fi

# Additional exclusions not in .distignore
EXCLUDE_ARGS+=(
	"--exclude=bin"
	"--exclude=.claude"
	"--exclude=*.map"
	"--exclude=tests"
	"--exclude=test"
	"--exclude=.phpunit*"
	"--exclude=phpunit*"
	"--exclude=.editorconfig"
	"--exclude=.eslintrc*"
	"--exclude=.prettierrc*"
	"--exclude=.stylelintrc*"
)

# ── 4. Copy files into temp dir, respecting exclusions ──
echo "==> Copying files..."
rsync -a --delete \
	"${EXCLUDE_ARGS[@]}" \
	"$PLUGIN_DIR/" "$DEST/"
echo "    Done."

# ── 5. Create zip ──
ZIP_NAME="ai-agent-${VERSION}.zip"
ZIP_PATH="${PLUGIN_DIR}/${ZIP_NAME}"

echo "==> Creating ${ZIP_NAME}..."
(cd "$BUILD_DIR" && zip -qr "$ZIP_PATH" ai-agent/)
echo "    Done."

# ── 6. Report ──
ZIP_SIZE="$(du -h "$ZIP_PATH" | cut -f1)"
echo ""
echo "==> Build complete!"
echo "    File: ${ZIP_PATH}"
echo "    Size: ${ZIP_SIZE}"
