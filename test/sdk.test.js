const Sdk = require('../')

const exported = [
    'Addon',
    'createAddon',
    'setupRepository',
    'router',
    'setCache',
    'start',
    'startServer',
    'startCli'
]

test('SDK should export all needed methods and properties', () => {
    expect(
        exported.every(key => Sdk[key])
    ).toBeTruthy()
})