const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    const target = process.env.PROXY_HOST;
    if (!target) return;

    app.use(
        '/presentation',
        createProxyMiddleware({
            target,
            changeOrigin: true,
            secure: false,
        })
    );
};
