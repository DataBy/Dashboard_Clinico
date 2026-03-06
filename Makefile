.PHONY: dev prod down clean stats

# Para el equipo: levanta rápido, ideal para programar el frontend y backend
dev:
	@echo "Iniciando entorno de DESARROLLO..."
	@cp docker/backend/envs/.env.dev docker/backend/envs/.env 2>/dev/null || :
	@docker compose up --build

# Para el profesor: el comando oficial para la evaluación del laboratorio
prod:
	@echo "Iniciando entorno de EVALUACIÓN (Producción)..."
	@cp docker/backend/envs/.env.prod docker/backend/envs/.env 2>/dev/null || :
	@docker compose up --build -d

# Apaga todo sin borrar la base de datos
down:
	@echo "Deteniendo contenedores..."
	@docker compose down

# Botón de pánico: borra todo (caché y base de datos) para empezar de cero
clean:
	@echo "Limpieza profunda..."
	@docker compose down -v
	@rm -rf backend/build/*
	@rm -rf backend/data/*.db 2>/dev/null || :
	@echo "Listo."

# Para el Módulo 4: Ver el consumo de RAM/CPU de los algoritmos de C++ en vivo
stats:
	@docker stats