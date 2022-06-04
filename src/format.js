function toHeading(text, level) {
  const re = /\[(\*+)\s([^\[\]]+)\]/;
  let slevel = '*'.repeat(level);
  let result = text;
  if (!text.match(re)) {
    result = `[${slevel} ${text}]`;
  } else {
    const ar = re.exec(text);
    result = `[${slevel} ${ar[2]}]`;
  }
  return result;
}

function toBodyText(text) {
  const re = /\[(\*+)\s([^\[\]]+)\]/;
  let result = text;
  if (text.match(re)) {
    const ar = re.exec(text);
    result = ar[2];
  }
  return result;
}

module.exports = {
  toHeading,
  toBodyText
}
