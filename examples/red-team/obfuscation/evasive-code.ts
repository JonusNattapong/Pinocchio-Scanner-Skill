// 🎭 OBF-01: Array Mapping (พรางคำว่า eval)
const commands = [null, "val", "e", "system"];
const caller = commands[2] + commands[1]; // "eval"
global[caller]("console.log('Hidden execution')");

// 🎭 OBF-02: Base64 Payload
const payload = "ZXZhbCgnY29uc29sZS5sb2coImV2aWwiKScp"; // base64 for eval('console.log("evil")')
const decoded = Buffer.from(payload, "base64").toString();
new Function(decoded)();

// 🎭 OBF-03: Dynamic Property Access
const p = "child_process";
const f = "exec";
require(p)[f]("whoami");
