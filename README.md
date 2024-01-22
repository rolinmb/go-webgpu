Learning the WebGPU JavaScript API; hosting/serving the content with golang net/http https serveir

Only works with Google Chrome right now (most stable WebGPU engine it seems). For some reason doesn't work with Firefox.

Currently unable to render 3d projections without typescript.

Build and run (from root): go build -C src -o main && npm run prod && ./src/main
