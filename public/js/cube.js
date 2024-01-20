async function cube() {
  if (!navigator.gpu) {
    alert("WebGPU not supported");
    return;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    alert("Couldn't request WebGPU adapter from navigator");
    return;
  }
  const device = await adapter.requestDevice();
  if (!device) {
    alert("Couldn't get local GPU adapter logical device");
    return;
  }
  const canvas = document.getElementById("webgpu-target");
  const ctx = canvas.getContext("webgpu");
  ctx.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: "opaque"
  });
  const vertexData = new Float32Array([
    -1, -1,  1,    0, 0, 1,     // vertex a, index 0
     1, -1,  1,    1, 0, 1,     // vertex b, index 1
     1,  1,  1,    1, 1, 1,     // vertex c, index 2
    -1,  1,  1,    0, 1, 1,     // vertex d, index 3
    -1, -1, -1,    0, 0, 0,     // vertex e, index 4
     1, -1, -1,    1, 0, 0,     // vertex f, index 5
     1,  1, -1,    1, 1, 0,     // vertex g, index 6
    -1,  1, -1,    0, 1, 0,     // vertex h, index 7 
  ]);
  const indexData = new Uint32Array([
      0, 1, 2, 2, 3, 0, // front
      1, 5, 6, 6, 2, 1, // right
      4, 7, 6, 6, 5, 4, // back
      0, 3, 7, 7, 4, 0, // left
      3, 2, 6, 6, 7, 3, // top
      0, 4, 5, 5, 1, 0 // bottom
  ]);
  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
  vertexBuffer.unmap();
  const indexBuffer = device.createBuffer({
    size: indexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Uint32Array(indexBuffer.getMappedRange()).set(indexData);
  indexBuffer.unmap();

}

window.addEventListener("load", cub);
