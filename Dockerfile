FROM node:8.11.3

# Create app directory
RUN mkdir -p /app/listing-app
WORKDIR /app/listing-app

# Install app dependencies
COPY package.json package-lock.json /app/listing-app/
RUN npm install

# Bundle app source
COPY . /app/listing-app

#EXPOSE 3000

CMD [ "node", "." ]
