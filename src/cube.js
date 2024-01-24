import { vertexPosData, vertexClrData, newId4, matrixMultiply, project, matrixTransform } from "./utils";
import { shaders } from "./shaders";
import { createCamera } from "3d-view-controls";

async function simpleCube(doAnimation) {
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
  const nVertices = vertexPosData.length / 3;
  const vertexBuffer = device.createBuffer({
    size: vertexPosData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertexPosData);
  vertexBuffer.unmap();
  const colorBuffer = device.createBuffer({
    size: vertexClrData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Float32Array(colorBuffer.getMappedRange()).set(vertexClrData);
  colorBuffer.unmap();
  const renderPipe = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: shaders
      }),
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{
            shaderLocation: 0,
            format: "float32x3",
            offset: 0
          }]
        },
        {
          arrayStride: 12,
          attributes: [{
            shaderLocation: 1,
            format: "float32x3",
            offset: 0
          }]
        }
      ]
    },
    fragment: {
      module: device.createShaderModule({
        code: shaders
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format: gpuFormat
        }
      ]
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back"
    },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less"
    }
  });
  let modelMatrix = newId4();
  let mvpMatrix = newId4();
  let vpMatrix = newId4();
  const vp = project(canvas.width / canvas.height);
  vpMatrix = vp.resultMatrix;
  let rotation = new Float32Array([0, 0, 0]);
  var cam = createCamera(canvas, vp.cameraOptions);
  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const uniformBindGroup = device.createBindGroup({
    layout: renderPipe.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: 64
        }
      }
    ]
  });
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  });
  const renderPassDesc = {
    colorAttachments: [{
      view: ctx.getCurrentTexture().createView(),
      clearValue: { r : 0.2, g: 0.247, b: 0.314, a: 1.0 },
      loadValue: { r : 0.2, g: 0.247, b: 0.314, a: 1.0 }, 
      loadOp: "clear",
      storeOp: "store"
    }],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthLoadValue: 1.0,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store"
    }
  };
  function animate(shouldAnimate) {
    
  }
  animate(doAnimation);
  /*modelMatrix = matrixTransform(modelMatrix);
  mvpMatrix = matrixMultiply(mvpMatrix, vpMatrix, modelMatrix);
  device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix);
  const commandEncoder = device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass(renderPassDesc);
  renderPass.setPipeline(renderPipe);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setVertexBuffer(1, colorBuffer);
  renderPass.setBindGroup(0, uniformBindGroup);
  renderPass.draw(nVertices);
  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);*/
}
  
window.addEventListener("load", async function() {
  let val = document.getElementById("animate-radio").value;
  await simpleCube(val === "animate");
});
  