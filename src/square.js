const vertexShader = `
struct Output {
  @builtin(position) Position : vec4<f32>,
  @location(0) vColor : vec4<f32>,
}
@vertex
fn main(@location(0) pos: vec4<f32>, @location(1) color: vec4<f32>) -> Output {
  var output: Output;
  output.Position = pos;
  output.vColor = color;
  return output;
}`;
const fragmentShader = `
@fragment
  fn main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
  return vColor;
}`;

async function simpleSquare() {
  if (!navigator.gpu) {
    alert("WebGPU NOT SUPPORTED\n(could be non-Chrome browser, could be on mobile, or could have no detectable GPU)");
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
  const gpuFormat = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({
    device: device,
    format: gpuFormat,
    alphaMode: "opaque",
  });
  const vertexData = new Float32Array([
    //position    //color
    -0.5, -0.5,   1, 0, 0,  // vertex a, index = 0
    0.5, -0.5,   0, 1, 0,  // vertex b, index = 1
    0.5,  0.5,   0, 0, 1,  // vertex c, index = 2  
    -0.5,  0.5,   1, 1, 0   // vertex d, index = 3        
  ]);
  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
  vertexBuffer.unmap();
  const indexData = new Uint32Array([0, 1, 3, 3, 1, 2]);
  const indexBuffer = device.createBuffer({
    size: indexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Uint32Array(indexBuffer.getMappedRange()).set(indexData);
  indexBuffer.unmap();
  const renderPipe = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: vertexShader
      }),
      entryPoint: "main",
      buffers: [{
        arrayStride: 20,
        attributes: [
          {
            shaderLocation: 0,
            format: "float32x2",
            offset: 0
          },
          {
            shaderLocation: 1,
            format: "float32x3",
            offset: 8
          }
        ]
      }]
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShader
      }),
      entryPoint: "main",
      targets: [{
        format: gpuFormat
      }]
    },
    primitive: {
      topology: "triangle-list"
    }
  });
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.5, g: 0.5, b: 0.8, a: 1.0 },
        storeOp: "store",
        loadOp: "clear"
      }
    ]
  });
  passEncoder.setPipeline(renderPipe);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.setIndexBuffer(indexBuffer, "uint32");
  passEncoder.drawIndexed(6);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);
}
  
  window.addEventListener("load", simpleSquare);
