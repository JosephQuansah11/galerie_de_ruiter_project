FROM ollama/ollama:latest

COPY start-ollama.sh /usr/local/bin/start-ollama.sh
RUN chmod +x /usr/local/bin/start-ollama.sh

ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_MODEL=llama3.2:3b
EXPOSE 11434
VOLUME ["/root/.ollama"]
HEALTHCHECK --interval=10s --timeout=5s --start-period=45s --retries=50 \
  CMD ollama show "$OLLAMA_MODEL" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/usr/local/bin/start-ollama.sh"]
