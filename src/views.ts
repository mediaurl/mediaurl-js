import * as MarkdownIt from "markdown-it";

import { Addon, Repository } from "./addon";

const SCRIPT = `<script>
  var loc = String(window.location).replace(/#.*$/, '').replace(/\/$/, '');
  var elements = document.getElementsByTagName('a');
  for (var i = 0; i < elements.length; i++) {
    var a = elements[i];
    if (a.href.indexOf('id://') === 0) {
      a.href = 'https://wtchd.cm/#' + loc + '/' + a.href.substring(5);
      a.target = '_blank';
    }
  }
</script>
`;

const markdown = new MarkdownIt();

const selectT = (value: any): string => String(value);

const renderAddon = (addon: Addon) => `[${selectT(addon.props.name)}](id://${
    addon.id
})
  
- Type: \`${addon.type}\`
- ID: \`${addon.id}\`
- Version \`${addon.props.version}\``;

const renderBody = (addon: Addon | Repository) => {
    const body = ["#" + renderAddon(addon)];
    if (addon.type === "repository") {
        for (const a of addon.addons) {
            if (a !== addon) {
                body.push("## " + renderAddon(a));
            }
        }
    }
    return body;
};

export const render = (addon: Addon) => `<!DOCTYPE html>
<html lang = "en">
<head>
  <title> {selectT(addon['name'])} </title>
</head>
<body>
  ${markdown.render(renderBody(addon).join("\n\n"))}
  ${SCRIPT}
</ body>
</ html>
`;
