# ---------- build frontend ----------
FROM node:20 AS frontend

WORKDIR /app

COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

COPY frontend .
RUN npm run build


# ---------- build backend ----------
FROM gcc:13 AS backend

WORKDIR /app

COPY backend ./backend

RUN apt-get update && apt-get install -y cmake

WORKDIR /app/backend
RUN mkdir build && cd build && cmake .. && make


# ---------- final container ----------
FROM nginx:alpine

COPY --from=frontend /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]