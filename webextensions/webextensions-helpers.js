// Calls testDriver.install_unpacked_extension() to add
// a web extension to the current browser context.
async function install_unpacked_extension(path) {
  return await test_driver.install_unpacked_extension(path);
}
