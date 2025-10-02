// Simple web proxy server with search bar
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <form method="POST" action="/go">
      <input type="text" name="url" placeholder="Enter URL or search term" style="width:300px;" />
      <button type="submit">Go</button>
    </form>
  `);
});

app.post('/go', (req, res) => {
  let url = req.body.url;
  if (!url.match(/^https?:\/\//)) {
    // Treat as search term, redirect to Google search
    url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
  }
  res.redirect('/proxy/' + encodeURIComponent(url));
});

app.use('/proxy/:url', (req, res, next) => {
  const target = decodeURIComponent(req.params.url);
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    selfHandleResponse: false,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('referer', target);
    },
    pathRewrite: {
      '^/proxy/[^/]+': '',
    },
    router: () => target,
    logLevel: 'error',
  })(req, res, next);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
