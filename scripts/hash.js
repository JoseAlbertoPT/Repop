const bcrypt = require("bcryptjs");

async function run() {
  const editorHash = await bcrypt.hash("editor123", 10);
  const lectorHash = await bcrypt.hash("lector123", 10);

  console.log("HASH editor123:", editorHash);
  console.log("HASH lector123:", lectorHash);
}

run();
