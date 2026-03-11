FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY . .

RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build -j"$(nproc)" \
    && strip build/clinica_api

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /src/build/clinica_api /app/clinica_api
COPY --from=builder /src/pacientes.csv /app/pacientes.csv
COPY --from=builder /src/consultas.csv /app/consultas.csv
COPY --from=builder /src/diagnosticos.csv /app/diagnosticos.csv

ENV PORT=8080

EXPOSE 8080

CMD ["./clinica_api"]