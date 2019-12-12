const Sdk = require("../");
const ArchiveOrgAddon = require("./ArchiveOrg");

const port = 3002;

const { listenPromise } = Sdk.serveAddons([ArchiveOrgAddon], { port });

listenPromise.then(() => {
    console.log(`http://localhost:${port}`);
});
