async function simpleTriangle() {
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
    ctx.configure({
      device: device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied",
    });
    const shaders = `
    struct VertexOut{
      @builtin(position) position : vec4f,
      @location(0) color : vec4f
    }
    @vertex
    fn vertex_main(@location(0) position: vec4f, @location(1) color: vec4f) -> VertexOut{
      var output : VertexOut;
      output.position = position;
      output.color = color;
      return output;
    }
    @fragment
    fn fragment_main(fragData: VertexOut) -> @location(0) vec4f{
      return fragData.color;
    }`;
    const shaderModule = device.createShaderModule({
      code: shaders,
    });
    const vertices = new Float32Array([
       0.0,  0.6, 0, 1, 1, 0, 0, 1,
      -0.5, -0.6, 0, 1, 0, 1, 0, 1,
       0.5, -0.6, 0, 1, 0, 0, 1, 1,
    ]);
    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);
    const vertexBuffers = [{
      attributes: [
        {
          shaderLocation: 0, // position
          offset: 0,
          format: "float32x4",
        },
        {
          shaderLocation: 1, // color
          offset: 16,
          format: "float32x4",
        },
      ],
      arrayStride: 32,
      stepMode: "vertex",
    }];
    const pipelineDescriptor = {
      vertex: {
        module: shaderModule,
        entryPoint: "vertex_main",
        buffers: vertexBuffers,
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
      layout: "auto",
    };
    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    const commandEncoder = device.createCommandEncoder();
    const renderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: { r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
          view: ctx.getCurrentTexture().createView(),
        }
    ]};
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(3);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
  
  window.addEventListener("load", simpleTriangle);
