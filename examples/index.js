const Sdk = require("../");
const archiveOrgAddon = require("./ArchiveOrg");

const repo = Sdk.createRepositoryAddon({
    id: "example-id",
    name: "Lol",
    version: "1.0.0"
});
repo.addAddon(archiveOrgAddon);

Sdk.serveAddons(repo, {});
