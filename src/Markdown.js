const rgxCodeBlock = /^code:([^.]*)(\.([^.]*))?/;
const rgxTable = /^table:(.*)$/;
const rgxHeading = /^\[(\*+)\s([^\]]+)\]/;
const rgxIndent = /^(\s+)([^\s].+)/;
const rgxStrong = /\[(\*+)\s(.+)\]/g;
const rgxLink = /\[https?:\/\/[^\s]*\s[^\]]*]/g;
const rgxLinkInside = /\[(https?:\/\/[^\s]*)\s([^\]]*)]/;
const rgxGazo = /\[https:\/\/gyazo.com\/[^\]]*\]/;
const rgxGazoInside = /\[(https:\/\/gyazo.com\/[^\]]*)\]/;

let codeblock = false;
let table = false;
let renderTalbleHeader = false;
let hatenaMarkdown = false;

function toMarkdown(lines, hatena) {
  let content = "";
  hatenaMarkdown = hatena;
  lines.forEach(line => {
    content += convert(line) + "\n";
  });
  return content;
}

function convert(line) {
  let result = "";
  if (codeblock) {
    if (!line.startsWith(" ")) {
      result = "```\n"
      codeblock = false;
    } else {
      result = line;
      return result;
    }
  } else if (table) {
    if (!line.startsWith(" ")) {
      table = false;
      renderTalbleHeader = false;
    } else {
      const tr = line.replace(/\t/gi, "$\t").trim(" ").split("$\t");
      result = "| " + tr.join(" | ") + " |";
      if (!renderTalbleHeader) {
        result += "\n" + "|:--".repeat(tr.length) + "|";
        renderTalbleHeader = true;
      }
      return result;
    }
  }
  if (!codeblock && !table) {
    if (rgxCodeBlock.test(line)) {
      const ar = rgxCodeBlock.exec(line);
      codeblock = true;
      result = ar[1] + (ar[2] ? ar[2] : "") + "\n```" + (ar[3] ? ar[3] : "");
      return result;
    }
    if (rgxTable.test(line)) {
      table = true;
      const ar = rgxTable.exec(line);
      result = ar[1] + "\n";
      return result;
    }
    if (rgxHeading.test(line)) {
      const ar = rgxHeading.exec(line);
      result += "#".repeat(decideLevel(ar[1].length)) + " " + ar[2];
    } else if (rgxIndent.test(line)) {
      const ar = rgxIndent.exec(line);
      const indent = "  ".repeat(ar[1].length - 1);
      result += indent + "- " + replaceGazoImage(replaceMdLink(ar[2]).replace(rgxStrong, "**$2**"));
    } else {
      const replaced = replaceGazoImage(replaceMdLink(line));
      result += replaced.replace(rgxStrong, " **$2** ");
    }
  }
  return result;
}

function decideLevel(length) {
  if (length >= 4) {
    return 1;
  } else {
    return 5 - length;
  }
}

function replaceMdLink(str) {
  let result = str;
  if (rgxLink.test(str)) {
    const links = str.match(rgxLink);
    links.forEach(link => {
      result = result.replace(link, (link) => {
        const ar = rgxLinkInside.exec(link);
        if (hatenaMarkdown) {
          return `[${ar[1]}:embed:cite]`
        } else {
          return `[${ar[2]}](${ar[1]})`;
        }
      });
    })
  }
  return result;
}

function replaceGazoImage(str) {
  let result = str;
  if (rgxGazo.test(str)) {
    const gazolinks = str.match(rgxGazo);
    gazolinks.forEach(link => {
      result = result.replace(link, (link) => {
        const ar = rgxGazoInside.exec(link);
        return `![](${ar[1]}.png)`
      });
    })
  }
  return result;
}

module.exports = {
  toMarkdown,
}
