process.env.DETA_RUNTIME = 'true';

const http = require('http');
const Waline = require('@waline/vercel');
const serverless = require('serverless-http');

const app = Waline({
  async postSave(comment) {
    // do what ever you want after save comment
  },
});

module.exports.handler = serverless(http.createServer(app));