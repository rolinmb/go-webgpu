import { vec3, mat4 } from "gl-matrix";

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
    const shaders = `
    struct Uniforms {
      mvpMatrix : mat4x4<f32>,
    };
    @binding(0) @group(0) var<uniform> uniforms : Uniforms;
    struct Output {
      @builtin(position) Position : vec4<f32>,
      @location(0) vColor : vec4<f32>,
    };
    @vertex
    fn vs_main(@location(0) pos: vec4<f32>, @location(1) color: vec4<f32>) -> Output {
      var output: Output;
      output.Position = uniforms.mvpMatrix * pos;
      output.vColor = color;
      return output;
    }
    @fragment
    fn fs_main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
      return vColor;
    }`;
    const shader_module = device.createShaderModule({
      code: shaders,
    });
    const vertex_buffers = [{
      arrayStride: 24,
      attributes: [
        {
          shaderLocation: 0,
          format: "float32x3",
          offset: 0
        },
        {
          shaderLocation: 1,
          format: "float32x3",
          offset: 12
        }
      ]
    }];
    const pipeline_desc = {
      layout:'auto',
      primitive:{
        topology: "triangle-list",
      },
      depthStencil:{
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less"
      },
      vertex: {
        module: shader_module,
        entryPoint: "vs_main",
        buffers: vertex_buffers
      },
      fragment: {
        module: shader_module,
        entryPoint: "fs_main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat()
          }
        ]
      }
    };
    const render_pipe = device.createRenderPipeline(pipeline_desc);
    const uniform_buffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const uniform_bind_group = device.createBindGroup({
      layout: render_pipe.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: {
          buffer: uniform_buffer,
          offset: 0,
          size: 64
        }
      }]
    });
    let texture_view = ctx.getCurrentTexture().createView();
    const depth_texture = device.createTexture({
      size: [canvas.width, canvas.height, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    const render_pass_desc = {
      colorAttachments: [{
        view: texture_view,
        clearValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 },
        loadOp: "clear",
        storeOp: "store"
      }],
      depthStencilAttachment: {
        view: depth_texture.createView(),
        depthClearValue: 1.0,
        dpethLoadOp: "clear",
        depthStoreOp: "store"
      }
    };
    device.queue.writeBuffer(uniform_buffer, 0, vertexData);
    const command_encoder = device.createCommandEncoder();
    const render_pass = command_encoder.beginRenderPass(render_pass_desc);
    render_pass.setPipeline(render_pipe);
    render_pass.setVertexBuffer(0, vertexBuffer);
    render_pass.setIndexBuffer(indexBuffer, "uint32");
    render_pass.setBindGroup(0, uniform_bind_group);
    render_pass.drawIndexed(indexData.length);
    render_pass.end();
    device.queue.submit([command_encoder.finish()]);
  }
  
  window.addEventListener("load", cube);
  