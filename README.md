Learning the WebGPU JavaScript API <b>without TypeScript</b>:
- bundling with node.js / webpack
- hosting/serving the content with CORS-enabled golang net/http https server

Must edit package.json and webpack.config.js to bundle the appropriate .js file with webpack to be served from /public

Not using gl-matrix in src/ .js files; however 3d-view-controls requires gl-matrix

I suggest running on Google Chrome or Chromium or Chrome Canary

Build and run HTTPS hosting server (from root): go build -C src -o main && npm run prod && ./src/main
