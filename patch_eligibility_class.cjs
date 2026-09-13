const fs = require('fs');
let js = fs.readFileSync('js/eligibility-engine.js', 'utf8');

const regex = /const matchesLevel = schCourseLevels\.some\(cl => studentCourse\.includes\(cl\) \|\| cl\.includes\(studentCourse\)\);/;
const replacement = `const matchesLevel = schCourseLevels.some(cl => {
          if (cl === 'class 1 to 9') {
            const match = studentCourse.match(/class\\s*(\\d+)/);
            if (match) {
              const classNum = parseInt(match[1], 10);
              return classNum >= 1 && classNum <= 9;
            }
          }
          return studentCourse.includes(cl) || cl.includes(studentCourse);
        });`;

js = js.replace(regex, replacement);
fs.writeFileSync('js/eligibility-engine.js', js, 'utf8');
