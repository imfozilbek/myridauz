// Kit files made without rendering: CSS tokens and favicon.ico.
export function tokensCss({ colors, motion }) {
  const vars = [...colors, ...motion].map((t) => `  --${t.name.replaceAll('.', '-')}: ${t.value}; /* ${t.usage} */\n`);
  return `:root {\n${vars.join('')}}\n`;
}

// ICO with PNG images inside (supported by all current browsers).
export function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size, e);
    head.writeUInt8(size, e + 1);
    head.writeUInt16LE(1, e + 4);
    head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(png.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([head, ...images.map((img) => img.png)]);
}
