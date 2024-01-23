Learning the WebGPU JavaScript API <b>without TypeScript</b>:
- bundling with node.js / webpack
- hosting/serving the content with CORS-enabled golang net/http https server

Only works with Google Chrome as of my last testing (1/23/2024 @ 12:22PM CST) (most stable WebGPU host)

Build and run HTTPS hosting server (from root): go build -C src -o main && npm run prod && ./src/main
