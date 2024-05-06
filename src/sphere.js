
const sphereVertexShaderCode = `
    [[stage(vertex)]]
    fn main([[location(0)]] position: vec3<f32>) -> [[builtin(position)]] vec4<f32> {
        return vec4<f32>(position, 1.0);
    }
`;

const sphereFragmentShaderCode = `
    [[stage(fragment)]]
    fn main() -> [[location(0)]] vec4<f32> {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red color
    }
`;

async function simpleSphere() {
    // Start GPU init check
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
    // end GPU init check
    const canvas = document.getElementById("webgpu-target");
    const ctx = canvas.getContext("webgpu");
    const gpuFormat = navigator.gpu.getPreferredFormat(adapter);
    ctx.configure({
        device: device,
        format: gpuFormat
    });
    const renderPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({ code: sphereVertexShaderCode }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: 12,
                    attributes: [
                        {
                            shaderLocation: 0,
                            format: "float32x3",
                            offset: 0
                        }
                    ]
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({ code: sphereFragmentShaderCode }),
            entryPoint: "main",
            targets: [
                {
                    format: gpuFormat
                }
            ]
        },
        primitive: {
            topology: "triangle-list",
            cullMode: "none"
        }
    });
    const vertexData = [];
    const indexData = [];
    const radius = 1;
    const slices = 40;
    const stacks = 20;
    for (let stack = 0; stack <= stacks; stack++) {
        const phi = (Math.PI / stacks) * stack;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        for (let slice = 0; slice <= slices; slice++) {
            const theta = (2 * Math.PI / slices) * slice;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            const x = radius * sinPhi * cosTheta;
            const y = radius * sinPhi * sinTheta;
            const z = radius * cosPhi;
            vertexData.push(x, y, z);
            if (stack < stacks && slice < slices) {
                const first = (stack * (slices + 1)) + slice;
                const second = first + slices + 1;
                indexData.push(first, second, first + 1);
                indexData.push(second, second + 1, first + 1);
            }
        }
    }
    const vertexBuffer = device.createBuffer({
        size: vertexData.length * 4,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    vertexBuffer.setSubData(0, new Float32Array(vertexData));
    const indexBuffer = device.createBuffer({
        size: indexData.length * 4,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    indexBuffer.setSubData(0, new Uint32Array(indexData));
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    const renderPassDescriptor = {
        colorAttachments: [
            {
                view: ctx.getCurrentTexture().createView(),
                loadValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 },
                storeOp: "store"
            }
        ],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadValue: 1.0,
            depthStoreOp: "store"
        }
    };
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer);
    renderPass.drawIndexed(indexData.length, 1);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
}
window.addEventListener("load", simpleSphere);
