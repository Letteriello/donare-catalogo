# Imagem base
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos do projeto
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos
COPY . ./

# Definir variáveis de ambiente padrão
ENV VITE_OLIST_API_TOKEN=15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53
ENV VITE_TINY_INTEGRATOR_ID=8471
ENV VITE_TINY_API_TOKEN=15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53
ENV VITE_FIREBASE_API_KEY=AIzaSyAJ9cw5uNQGFd4VH13cD_WgxE1PLaC4DdM
ENV VITE_FIREBASE_AUTH_DOMAIN=donare-catalogo.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=donare-catalogo
ENV VITE_FIREBASE_STORAGE_BUCKET=donare-catalogo.appspot.com
ENV VITE_FIREBASE_MSG_SENDER_ID=12091397107
ENV VITE_FIREBASE_APP_ID=1:12091397107:web:c19ef6fe250cdb6778f886
ENV VITE_FIREBASE_MEASUREMENT_ID=G-15BG5CH1VW
ENV VITE_API_MODE=production
ENV VITE_OLIST_BASE_URL=https://api.olist.com
ENV VITE_OLIST_API_VERSION=v3

# Build do app
RUN npm run build

# Expor porta do servidor de desenvolvimento
EXPOSE 3000

# Comando para executar o servidor
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
