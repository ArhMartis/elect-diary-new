const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'app', 'teacher', 'TeacherForms.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all ".toISOString().split("T")[0]" with "localDateStr(...)"
content = content.replace(/\.toISOString\(\)\.split\("T"\)\[0\]/g, (match, offset) => {
  const before = content.slice(0, offset);
  // Find the expression before .toISOString
  // Match patterns: new Date(), d, selectedWeek, etc.
  const simpleExprMatch = before.match(/(new Date\(\)|[a-zA-Z_$][\w]*)$/);
  if (simpleExprMatch) {
    const expr = simpleExprMatch[1];
    return `.toISOString__PLACEHOLDER__${expr}`;
  }
  return match;
});

// Now replace the placeholders with proper localDateStr calls
content = content.replace(/\.toISOString__PLACEHOLDER__/g, '__localDateStr__(');
content = content.replace(/__localDateStr__\(/g, 'localDateStr(');

fs.writeFileSync(filePath, content);
console.log('Done');
