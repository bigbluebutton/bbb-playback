const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    if (process.env.BBB_EDITOR_PROXY) {
        app.use('/recording-editor/api', createProxyMiddleware({
            target: process.env.BBB_EDITOR_PROXY, changeOrigin: false,
        }));
    }
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
