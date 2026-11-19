#!/usr/bin/env bash
# Shared boilerplate for coverage scripts: log helpers and bun's
# path-ignore patterns for skills/ template files (not instrumented).

# shellcheck shell=bash

IGNORE_PATTERNS="--path-ignore-patterns=template/obligatorio/core/skills/**,skills/**"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*" >&2; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

cleanup() { log_info "Done."; }
trap cleanup EXIT
