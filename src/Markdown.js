function toMarkdown(lines) {
  let content = "";
  lines.forEach(line => {
    content += convert(line) + "\n";
  });
  return content;
}

function convert(line) {
  const rgxHeading = /^\[(\*+)\s([^\]]+)\]/;
  const rgxIndent = /^(\s+)([^\s].+)/;
  const rgxStrong = /\[(\*+)\s(.+)\]/g;
  let result = "";
  if (rgxHeading.test(line)) {
    const ar = rgxHeading.exec(line);
    result = "#".repeat(decideLevel(ar[1].length)) + " " + ar[2];
  } else if (rgxIndent.test(line)) {
    const ar = rgxIndent.exec(line);
    const indent = "  ".repeat(ar[1].length - 1);
    result = indent + "- " + ar[2].replace(rgxStrong, "**$2**");
  } else {
    result = line.replace(rgxStrong, "**$2**");
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
