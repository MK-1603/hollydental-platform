const fs = require('fs');
const path = require('path');

const srcBefore = "C:\\Users\\saikr\\.gemini\\antigravity-ide\\brain\\26588d5b-180b-4bbf-b6a8-fac4e37347b3\\teeth_crooked_before_1779956078684.png";
const srcAfter = "C:\\Users\\saikr\\.gemini\\antigravity-ide\\brain\\26588d5b-180b-4bbf-b6a8-fac4e37347b3\\teeth_straight_after_1779956128001.png";

const destBefore = path.join(__dirname, 'public', 'teeth-before.png');
const destAfter = path.join(__dirname, 'public', 'teeth-after.png');

try {
  fs.copyFileSync(srcBefore, destBefore);
  console.log("Successfully copied before image to", destBefore);
  fs.copyFileSync(srcAfter, destAfter);
  console.log("Successfully copied after image to", destAfter);
} catch (err) {
  console.error("Error during copy:", err);
}
