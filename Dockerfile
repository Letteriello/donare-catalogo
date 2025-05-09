FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de package primeiro para aproveitar caching
COPY package*.json ./
RUN npm install

# Copiar o restante do código
COPY . .

# Configuração para resolver problemas de crypto
ENV NODE_OPTIONS=--openssl-legacy-provider

# Variáveis de ambiente para integrações
ENV VITE_OLIST_API_TOKEN=15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53
ENV VITE_TINY_INTEGRATOR_ID=8471
ENV VITE_TINY_API_TOKEN=15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53

# Variáveis de ambiente Firebase
ENV VITE_FIREBASE_API_KEY=AIzaSyAJ9cw5uNQGFd4VH13cD_WgxE1PLaC4DdM
ENV VITE_FIREBASE_AUTH_DOMAIN=donare-catalogo.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=donare-catalogo
ENV VITE_FIREBASE_STORAGE_BUCKET=donare-catalogo.appspot.com
ENV VITE_FIREBASE_MSG_SENDER_ID=12091397107
ENV VITE_FIREBASE_APP_ID=1:12091397107:web:c19ef6fe250cdb6778f886
ENV VITE_FIREBASE_MEASUREMENT_ID=G-15BG5CH1VW

# Variáveis de configuração de API
ENV VITE_API_MODE=production
ENV VITE_OLIST_BASE_URL=https://api.olist.com
ENV VITE_OLIST_API_VERSION=v3

# Garantir que a pasta uploads existe e tem permissões corretas
RUN mkdir -p public/uploads/products public/uploads/categories \
    && chmod -R 777 public/uploads

# Build do app
RUN npm run build

# Expor portas (3000 para o Vite, 3001 para o servidor de uploads)
EXPOSE 3000
EXPOSE 3001

# Definir o volume para a pasta de uploads
VOLUME ["/app/public/uploads"]

# Iniciar tanto o servidor de uploads quanto o preview do Vite
CMD ["sh", "-c", "node server.js & npm run preview -- --host 0.0.0.0 --port 3000"]
