FROM keymetrics/pm2:latest-stretch
# FROM stretch so we have git to install erlpack. Conventiently has all our build tools as well.

# Create app directory
WORKDIR /usr/src/botmaker

RUN apt-get update
RUN apt-get install ffmpeg -y 

# Install app dependencies
COPY package*.json ./

# If you are building your code for production
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm ci --only=production

# Bundle app source
COPY . .
RUN mkdir config sounds

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]