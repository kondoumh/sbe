function toMarkdown(lines) {
  let content = "";
  lines.forEach(line => {
    content += line + "\n";
  });
  return content;
}

module.exports = {
  toMarkdown
}
