const shaders = `
struct Uniforms {
  mvpMatrix : mat4x4<f32>,
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;
struct Output {
  @builtin(position) Position : vec4<f32>,
  @location(0) vColor : vec4<f32>,
}
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

const vertexPosData = new Float32Array([
  // front
  -1, -1,  1,  
  1, -1,  1,  
  1,  1,  1,
  1,  1,  1,
 -1,  1,  1,
 -1, -1,  1,
 // right
  1, -1,  1,
  1, -1, -1,
  1,  1, -1,
  1,  1, -1,
  1,  1,  1,
  1, -1,  1,
 // back
 -1, -1, -1,
 -1,  1, -1,
  1,  1, -1,
  1,  1, -1,
  1, -1, -1,
 -1, -1, -1,
 // left
 -1, -1,  1,
 -1,  1,  1,
 -1,  1, -1,
 -1,  1, -1,
 -1, -1, -1,
 -1, -1,  1,
 // top
 -1,  1,  1,
  1,  1,  1,
  1,  1, -1,
  1,  1, -1,
 -1,  1, -1,
 -1,  1,  1,
 // bottom
 -1, -1,  1,
 -1, -1, -1,
  1, -1, -1,
  1, -1, -1,
  1, -1,  1,
 -1, -1,  1 
]);

const vertexClrData = new Float32Array([
  // front - blue
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  // right - red
  1, 0, 0,
  1, 0, 0,
  1, 0, 0,
  1, 0, 0,
  1, 0, 0,
  1, 0, 0,
  //back - yellow
  1, 1, 0,
  1, 1, 0,
  1, 1, 0,
  1, 1, 0,
  1, 1, 0,
  1, 1, 0,
  //left - aqua
  0, 1, 1,
  0, 1, 1,
  0, 1, 1,
  0, 1, 1,
  0, 1, 1,
  0, 1, 1,
  // top - green
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
  // bottom - fuchsia
  1, 0, 1,
  1, 0, 1,
  1, 0, 1,
  1, 0, 1,
  1, 0, 1,
  1, 0, 1
]);

function newId4() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
}

function toId4(m) {
  m[0]=1; m[1]=0, m[2]=0, m[3]=0,
  m[4]=0, m[5]=1, m[6]=0, m[7]=0,
  m[8]=0, m[9]=0, m[10]=1, m[11]=0,
  m[12]=0, m[13]=0, m[14]=0, m[15]=1;
  return m;
}

function getPerspective(m, fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2);
  m[0] = f / aspect, m[1] = 0; m[2] = 0, m[3] = 0,
  m[4] = 0, m[5] = f, m[6] = 0, m[7] = 0,
  m[8] = 0, m[9] = 0, m[11] = -1,
  m[12] = 0, m[13] = 0, m[15] = 0;
  if (far != null && far !== Infinity) {
    const nf = 1 / (near - far);
    m[10] = far * nf;
    m[14] = far * near * nf;
  } else {
    m[10] = 1;
    m[14] = -near;
  }
  return m;
}

const EPSILON = 0.000001;

function lookAt(m, eye, center, up) {
  let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  let eyex = eye[0];
  let eyey = eye[1];
  let eyez = eye[2];
  let upx = up[0];
  let upy = up[1];
  let upz = up[2];
  let centerx = center[0];
  let centery = center[1];
  let centerz = center[2];
  if (Math.abs(eyex-centerx) < EPSILON && Math.abs(eyey-centery) < EPSILON && Math.abs(eyez-centerz) < EPSILON) {
    return toId4(m);
  }
  z0 = eyex-centerx;
  z1 = eyey-centery;
  z2 = eyez-centerz;
  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * x2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }
  y0 = x1 * x2 - x2 * x1;
  y1 = z2 * x0 - x0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }
  m[0] = x0, m[1] = y0, m[2] = z0, m[3] = 0,
  m[4] = x1, m[5] = y1, m[6] = z1, m[7] = 0,
  m[8] = x2, m[9] = y2, m[10] = z2, m[11] = 0,
  m[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  m[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  m[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  m[15] = 1;
  return m;
}

function matrixMultiply(m, a, b) {
  let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
  a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
  a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
  a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  let b0, b1, b2, b3;
  /*for (let i = 0; i < 4; i++) { // need to test this method
    b0 = b[((i+1)*i)]; // Cache only the current line of the second matrix
    b1 = b[((i+1)*i)+1];
    b2 = b[((i+1)*i)+2];
    b3 = b[((i+1)*i)+3];
    m[((i+1)*i)] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    m[((i+1)*i)+1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    m[((i+1)*i)+2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    m[((i+1)*i)+3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  }*/
  b0 = b[0]; // Cache only the current line of the second matrix
  b1 = b[1];
  b2 = b[2];
  b3 = b[3];
  m[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  m[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  m[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  m[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  m[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  m[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  m[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  m[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  m[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  m[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  m[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  m[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  m[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  m[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  m[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  m[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return m;
}

function project(aspectRatio = 1.0, cameraPosition = [2, 2, 4], lookDirection = [0, 0, 0], upDirection = [0, 1, 0]) {
  let viewMatrix = newId4();
  let projectionMatrix = newId4();
  let resultMatrix = newId4();
  projectionMatrix = getPerspective(projectionMatrix, 2*Math.PI/5, aspectRatio, 0.1, 100.0);
  viewMatrix = lookAt(viewMatrix, cameraPosition, lookDirection, upDirection);
  resultMatrix = matrixMultiply(resultMatrix, projectionMatrix, viewMatrix);
  const cameraOption = {
    eye: cameraPosition,
    center: lookDirection,
    zoomMatx: 100,
    zoomSpeed: 2
  };
  return {
    viewMatrix,
    projectionMatrix,
    resultMatrix,
    cameraOption
  };
}

function matrixTranslate(m, translation) {
  m[0] = 1, m[1] = 0; m[2] = 0, m[3] = 0,
  m[4] = 0, m[5] = 1, m[6] = 0, m[7] = 0,
  m[8] = 0, m[9] = 0, m[10] = 1, m[11] = 0;
  m[12] = translation[0];
  m[13] = translation[1];
  m[14] = translation[2];
  m[15] = 1;
  return m;
}

function matrixRotateX(m, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  m[0] = 1, m[1] = 0, m[2] = 0, m[3] = 0,
  m[4] = 0, m[5] = c, m[6] = s, m[7] = 0,
  m[8] = 0, m[9] = -s, m[10] = c, m[11] = 0,
  m[12] = 0, m[13] = 0, m[14] = 0, m[15] = 1;
  return m;
}

function matrixRotateY(m, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  m[0] = c, m[1] = 0, m[2] = -s, m[3] = 0,
  m[4] = 0, m[5] = 1, m[6] = 0, m[7] = 0,
  m[8] = s, m[9] = 0, m[10] = c, m[11] = 0,
  m[12] = 0, m[13] = 0, m[14] = 0, m[15] = 1;
  return m;
}

function matrixRotateZ(m, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  m[0] = c, m[1] = s, m[2] = 0, m[3] = 0,
  m[4] = -s, m[5] = c, m[6] = 0, m[7] = 0,
  m[8] = 0, m[9] = 0, m[10] = 1, m[11] = 0,
  m[12] = 0, m[13] = 0, m[14] = 0, m[15] = 1;
  return m;
}

function matrixScaling(m, scaling) {
  m[0] = scaling[0]; m[1] = 0; m[2] = 0; m[3] = 0;
  m[4] = 0; m[5] = scaling[1]; m[6] = 0; m[7] = 0;
  m[8] = 0; m[9] = 0; m[10] = scaling[2]; m[11] = 0;
  m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
  return m;
}

function matrixTransform(m, translation = [0, 0, 0], rotation = [0, 0, 0], scaling = [1, 1, 1]) {
  let rotateXMat = newId4();
  let rotateYMat = newId4();
  let rotateZMat = newId4();
  let translateMat = newId4();
  let scaleMat = newId4();
  translateMat = matrixTranslate(translateMat, translation);
  rotateXMat = matrixRotateX(rotateXMat, rotation[0]);
  rotateYMat = matrixRotateY(rotateYMat, rotation[1]);
  rotateZMat = matrixRotateZ(rotateZMat, rotation[2]);
  scaleMat = matrixScaling(scaleMat, scaling);
  m = matrixMultiply(m, rotateXMat, scaleMat);
  m = matrixMultiply(m, rotateYMat, m);
  m = matrixMultiply(m, rotateZMat, m);
  m = matrixMultiply(m, translateMat, m);
  return m;
}

async function simpleCube() {
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
  modelMatrix = matrixTransform(modelMatrix);
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
  device.queue.submit([commandEncoder.finish()]);
}
  
  window.addEventListener("load", simpleCube);
  