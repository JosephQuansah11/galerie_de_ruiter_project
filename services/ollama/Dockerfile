FROM ollama/ollama:latest

COPY start-ollama.sh /usr/local/bin/start-ollama.sh
RUN chmod +x /usr/local/bin/start-ollama.sh

ENV OLLAMA_HOST=0.0.0.0:11434
EXPOSE 11434
VOLUME ["/root/.ollama"]

ENTRYPOINT ["/usr/local/bin/start-ollama.sh"]
