Learning the WebGPU JavaScript API <b>without TypeScript</b>:
- bundling with node.js / webpack
- hosting/serving the content with CORS-enabled golang net/http https server

I suggest running on Google Chrome or Chromium or Chrome Canary

Build and run HTTPS hosting server (from root): go build -C src -o main && npm run prod && ./src/main
