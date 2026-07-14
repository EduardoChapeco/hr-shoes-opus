const fs = require("fs");
let c = fs.readFileSync("src/lib/routes.ts", "utf8");
c = c.replace(/  renderStatus: "(?:structural|planned)",\r?\n/g, "");
fs.writeFileSync("src/lib/routes.ts", c);
