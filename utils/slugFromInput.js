const { default: slugify } = require('slugify');

const defaultOpts = {
  replacement: '-',
  remove: undefined,
  lower: true,
  strict: false,
};

/** Excel / JSON có thể trả number, object richText, hoặc undefined — slugify chỉ chấp nhận string. */
function cellValueToPlainString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
  if (typeof value === 'object' && value.richText && Array.isArray(value.richText)) {
    return value.richText.map((t) => (t && t.text) || '').join('').trim();
  }
  return String(value).trim();
}

function slugFromInput(value, options) {
  return slugify(cellValueToPlainString(value), { ...defaultOpts, ...options });
}

module.exports = { slugFromInput, cellValueToPlainString };
