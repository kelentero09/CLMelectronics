const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

/**
 * Serializes JSON-LD for a script tag. Escapes "<" (and the Unicode line and
 * paragraph separators) so content such as a product name containing a closing
 * script tag cannot break out of the script element.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .split("<").join("\\u003c")
    .split(LINE_SEP).join("\\u2028")
    .split(PARA_SEP).join("\\u2029");
}
