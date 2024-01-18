async function main() {
  console.log("served main.js successfully");
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
}

window.addEventListener("load", main);