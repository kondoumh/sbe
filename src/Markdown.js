let codeblock = false;
let table = false;
let renderTalbleHeader = false;

function toMarkdown(lines) {
  let content = "";
  lines.forEach(line => {
    content += convert(line) + "\n";
  });
  return content;
}

function convert(line) {
  const rgxCodeBlock = /^code:([^.]*)(\.([^.]*))?/;
  const rgxTable = /^table:(.*)$/;
  const rgxHeading = /^\[(\*+)\s([^\]]+)\]/;
  const rgxIndent = /^(\s+)([^\s].+)/;
  const rgxStrong = /\[(\*+)\s(.+)\]/g;
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
      tr = line.replace(/\t/gi, "$\t").trim(" ").split("$\t");
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
      const ar = rgxTable.exec(line);
      table = true;
      return result;
    }
    if (rgxHeading.test(line)) {
      const ar = rgxHeading.exec(line);
      result += "#".repeat(decideLevel(ar[1].length)) + " " + ar[2];
    } else if (rgxIndent.test(line)) {
      const ar = rgxIndent.exec(line);
      const indent = "  ".repeat(ar[1].length - 1);
      result += indent + "- " + ar[2].replace(rgxStrong, "**$2**");
    } else {
      result += line.replace(rgxStrong, "**$2**");
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

module.exports = {
  toMarkdown
}
