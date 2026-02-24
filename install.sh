#!/usr/bin/env bash
set -euo pipefail

REPO="IMMINJU/claude-pet"
INSTALL_DIR="${CLAUDE_PET_HOME:-$HOME/.claude-pet}"

# --- helpers ----------------------------------------------------------------

info()  { printf '\033[1;34m%s\033[0m\n' "$*"; }
error() { printf '\033[1;31mError: %s\033[0m\n' "$*" >&2; exit 1; }

detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux*)  OS="linux" ;;
    Darwin*) OS="macos" ;;
    *)       error "Unsupported OS: $os (use install.ps1 for Windows)" ;;
  esac

  case "$arch" in
    x86_64|amd64)  ARCH="x86_64" ;;
    arm64|aarch64) ARCH="aarch64" ;;
    *)             error "Unsupported architecture: $arch" ;;
  esac

  if [ "$OS" = "linux" ] && [ "$ARCH" = "aarch64" ]; then
    error "Linux aarch64 is not supported yet. Only x86_64 is available."
  fi

  if [ "$OS" = "macos" ] && [ "$ARCH" = "x86_64" ]; then
    error "macOS x86_64 (Intel) is not supported. Only Apple Silicon (aarch64) is available."
  fi

  ASSET="claude-pet-${OS}-${ARCH}"
}

get_latest_tag() {
  if command -v curl >/dev/null 2>&1; then
    TAG=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
      | grep '"tag_name"' | head -1 | cut -d'"' -f4)
  elif command -v wget >/dev/null 2>&1; then
    TAG=$(wget -qO- "https://api.github.com/repos/$REPO/releases/latest" \
      | grep '"tag_name"' | head -1 | cut -d'"' -f4)
  else
    error "curl or wget is required"
  fi
  [ -n "$TAG" ] || error "Could not determine latest release"
}

download() {
  local url="https://github.com/$REPO/releases/download/$TAG/$1"
  info "Downloading $1 ..."
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$2"
  else
    wget -qO "$2" "$url"
  fi
}

# --- main -------------------------------------------------------------------

main() {
  info "Claude Pet installer"

  detect_platform
  get_latest_tag

  info "Platform: $OS/$ARCH  Release: $TAG"

  mkdir -p "$INSTALL_DIR"

  # Download binary directly
  download "$ASSET" "$INSTALL_DIR/claude-pet"
  chmod +x "$INSTALL_DIR/claude-pet"

  # Hooks are registered automatically when the app starts — no setup needed.

  info ""
  info "Installed to $INSTALL_DIR/claude-pet"

  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *)
      info ""
      info "Add to PATH (paste into your shell profile):"
      info "  export PATH=\"$INSTALL_DIR:\$PATH\""
      ;;
  esac

  info ""
  info "Run:  claude-pet"
}

main "$@"
