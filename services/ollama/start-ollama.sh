#!/bin/sh
set -eu

: "${OLLAMA_MODEL:=llama3.2:3b}"
export OLLAMA_MODEL

ollama serve &
server_pid=$!

stop_server() {
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" || true
}
trap stop_server EXIT INT TERM

until ollama list >/dev/null 2>&1; do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    wait "$server_pid"
    exit 1
  fi
  sleep 2
done

if ! ollama show "$OLLAMA_MODEL" >/dev/null 2>&1; then
  ollama pull "$OLLAMA_MODEL"
fi

wait "$server_pid"
