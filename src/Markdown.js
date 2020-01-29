let codeblock = false;
let table = false;

function toMarkdown(lines) {
  let content = "";
  lines.forEach(line => {
    content += convert(line) + "\n";
  });
  return content;
}

function convert(line) {
  const rgxCodeBlock = /^code:([^.]*)(\.([^.]*))?/
  const rgxTable = /^table:(.*)$/
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
      result = "end table\n";
      table = false;
    } else {
      result = line;
      return result;
    }
  }
  if (!codeblock && !table) {
    if (rgxCodeBlock.test(line)) {
      const ar = rgxCodeBlock.exec(line);
      console.log(ar);
      codeblock = true;
      result = ar[1] + (ar[2] ? ar[2] : "") + "\n```" + (ar[3] ? ar[3] : "");
      return result;
    }
    if (rgxTable.test(line)) {
      const ar = rgxTable.exec(line);
      table = true;
      result = "start table";
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
