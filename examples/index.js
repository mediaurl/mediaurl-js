const Sdk = require("../");
const archiveOrgAddon = require("./ArchiveOrg");

const port = 3002;

const repo = Sdk.createRepositoryAddon({
    id: "example-id",
    name: "Lol",
    version: "1.0.0"
});
repo.addAddon(archiveOrgAddon);

const { listenPromise } = Sdk.serveAddons(repo, { port });

listenPromise.then(() => {
    console.log(`http://localhost:${port}`);
});
