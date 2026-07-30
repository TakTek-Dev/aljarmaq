#!/usr/bin/env node
/**
 * tools/build-partials.js — إدراج المكوّنات المشتركة داخل صفحات الثيم
 * ---------------------------------------------------------------------------
 * لماذا؟ حتى يبقى الهيدر والفوتر مكتوبَين مرّة واحدة في partials/ دون أن
 * تحتاج الصفحات إلى fetch وقت التشغيل — الصفحات تبقى HTML ثابتًا يعمل حتى
 * بفتحها مباشرة من القرص (file://) وفي أي استضافة أو نظام إدارة محتوى.
 *
 * الاستعمال:
 *   node tools/build-partials.js          إدراج المكوّنات في كل الصفحات
 *   node tools/build-partials.js --check  تحقّق فقط (يخرج بالرمز 1 عند وجود فرق)
 *   node tools/build-partials.js --clean  تفريغ المناطق المُدرَجة (قبل إعادة البناء)
 *
 * كيف يعمل؟ كل صفحة تحتوي منطقة محدَّدة بعلامتين — علامة فتح تحمل مسار
 * المكوّن، وعلامة إغلاق باسم include؛ والسكربت يستبدل ما بينهما بمحتوى الملف.
 * الإدراج متداخل: ملف header يُدرِج بدوره ملف navigation.
 *
 * تنبيه عند تحرير ملفات partials: لا تكتب داخل تعليق التوثيق في أعلى الملف
 * أي علامة فتح أو إغلاق تعليق HTML — الماسح يعتمد عليها لتحديد المناطق.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODE = process.argv.includes('--check') ? 'check'
           : process.argv.includes('--clean') ? 'clean'
           : 'build';

/** يلتقط علامتَي الفتح والإغلاق مع مسار المكوّن في علامة الفتح */
const MARKER = /([ \t]*)<!--\s*(?:#include\s+(\S+)|(\/include))\s*-->/g;

/**
 * يقسم النصّ إلى مناطق إدراج من المستوى الأعلى، مع احترام التداخل.
 * يعيد مصفوفة { target, indent, openEnd, closeStart, closeEnd, openStart }.
 */
function findRegions(html) {
  const regions = [];
  let depth = 0;
  let open = null;
  let match;

  MARKER.lastIndex = 0;
  while ((match = MARKER.exec(html)) !== null) {
    const isClose = Boolean(match[3]);

    if (!isClose) {
      if (depth === 0) {
        open = { target: match[2], indent: match[1], openStart: match.index, openEnd: match.index + match[0].length };
      }
      depth++;
      continue;
    }

    if (depth === 0) {
      throw new Error('علامة إغلاق بلا فتح عند الموضع ' + match.index);
    }
    depth--;
    if (depth === 0 && open) {
      open.closeStart = match.index;
      open.closeEnd = match.index + match[0].length;
      regions.push(open);
      open = null;
    }
  }

  if (depth !== 0) { throw new Error('منطقة إدراج غير مغلقة'); }
  return regions;
}

/** يزيل تعليق التوثيق الافتتاحي من ملف المكوّن حتى لا يتكرّر في كل صفحة */
function stripLeadingComment(html) {
  const trimmed = html.replace(/^\s+/, '');
  if (!trimmed.startsWith('<!--')) { return html; }

  const end = trimmed.indexOf('-->');
  if (end === -1) { return html; }
  return trimmed.slice(end + 3).replace(/^\s*\n/, '');
}

/** يقرأ مكوّنًا ويحلّ الإدراجات المتداخلة داخله */
function readPartial(relativePath, seen) {
  if (seen.includes(relativePath)) {
    throw new Error('إدراج دائري: ' + seen.concat(relativePath).join(' → '));
  }

  const file = path.join(ROOT, relativePath);
  if (!fs.existsSync(file)) {
    throw new Error('المكوّن غير موجود: ' + relativePath);
  }

  const body = stripLeadingComment(fs.readFileSync(file, 'utf8')).trimEnd();
  return render(body, seen.concat(relativePath));
}

/** يعيد بناء النصّ بعد ملء (أو تفريغ) كل مناطق الإدراج */
function render(html, seen) {
  const regions = findRegions(html);
  if (!regions.length) { return html; }

  let out = '';
  let cursor = 0;

  for (const region of regions) {
    out += html.slice(cursor, region.openEnd);

    if (MODE !== 'clean') {
      const content = readPartial(region.target, seen || [])
        .split('\n')
        .map(line => (line.trim() ? region.indent + line : line))
        .join('\n');
      out += '\n' + content;
    }

    // علامة الإغلاق تُكتب دائمًا بمحاذاة علامة الفتح حتى تكون النتيجة ثابتة
    // مهما تكرّر تشغيل السكربت (idempotent).
    out += '\n' + region.indent + '<!-- /include -->';
    cursor = region.closeEnd;
  }

  return out + html.slice(cursor);
}

/* --- التشغيل -------------------------------------------------------------- */

const pages = fs.readdirSync(ROOT).filter(name => name.endsWith('.html'));
let changed = 0;

for (const name of pages) {
  const file = path.join(ROOT, name);
  const before = fs.readFileSync(file, 'utf8');

  let after;
  try {
    after = render(before, []);
  } catch (error) {
    console.error('× ' + name + ' — ' + error.message);
    process.exitCode = 1;
    continue;
  }

  if (before === after) { continue; }

  changed++;
  if (MODE === 'check') {
    console.error('× ' + name + ' — المكوّنات المُدرَجة قديمة');
  } else {
    fs.writeFileSync(file, after, 'utf8');
    console.log('✓ ' + name);
  }
}

if (MODE === 'check' && changed) {
  console.error('\nشغّل: node tools/build-partials.js');
  process.exit(1);
}

console.log(
  changed
    ? '\nتم تحديث ' + changed + ' صفحة من أصل ' + pages.length + '.'
    : 'كل الصفحات محدَّثة (' + pages.length + ' صفحة).'
);
