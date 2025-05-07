# Estágio de Build
FROM node:18-alpine as build

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração de dependências
COPY package*.json ./
COPY .env.example ./

# Instalar dependências
RUN npm ci

# Copiar código-fonte
COPY . .

# Gerar arquivo .env a partir do .env.example (substituindo valores default)
RUN node -e "const fs = require('fs'); \
    const envExample = fs.readFileSync('.env.example', 'utf8'); \
    fs.writeFileSync('.env', envExample.replace(/your_.*_here/g, ''));"

# Build do projeto
RUN npm run build

# Estágio de Produção
FROM nginx:alpine

# Copiar configuração personalizada do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração para SPA (Single Page Application)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# Expor a porta HTTP
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
