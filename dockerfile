FROM node:20 AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build


FROM gcc:13

WORKDIR /app

COPY backend .

RUN apt-get update && apt-get install -y cmake
RUN mkdir build && cd build && cmake .. && make

COPY --from=frontend /app/dist /var/www/html

EXPOSE 8080

CMD ["./clinica_api"]