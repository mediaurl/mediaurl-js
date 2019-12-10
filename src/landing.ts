import * as MarkdownIt from "markdown-it";

const md = new MarkdownIt();

const selectT = value => value;

const renderAddon = (addon, heading) => `${heading} [${selectT(
    addon.props.name ?? addon.props.id
)}](http://id/${addon.id})
  
  - ID: \`${addon.props.id}\`
  - Version \`${addon.props.version}\``;

const renderBody = (repo, addons) => {
    let body = [];
    if (repo) body.push(renderAddon(repo, "#"));
    else body.push("# WATCHED.com Addon Server");
    for (const addon of addons) {
        body.push(renderAddon(addon, "##"));
    }
    return md.render(body.join("\n\n"));
};

export const render = (repo, addons) => `<!DOCTYPE html>
<html lang="en">
<head>
  <title>${selectT(repo?.name ?? "WATCHED.com Addon Server")}</title>
</head>
<body>
  ${renderBody(repo, addons)}
  <script>
    var mirrors = ${JSON.stringify(repo?.props?.mirrors ?? [])};
    if (mirrors.indexOf(document.location) === -1) {
      mirrors.push(String(document.location).replace(/#.*$/, ''));
    }
    function addonLink(id) {
      var m = mirrors.map(url => url.replace(/\\/$/, '') + '/' + id);
      return 'https://wtchd.cm/#' + JSON.stringify(m);
    }
    var elements = document.getElementsByTagName('a');
    for (var i = 0; i < elements.length; i++) {
      var a = elements[i];
      console.warn(a, a.href, a.href.indexOf('http://id/'));
      if (a.href.indexOf('http://id/') === 0) {
        a.href = addonLink(a.href.substring(10));
        a.target = '_blank';
      }
    }
  </script>
</body>
</html>
`;
