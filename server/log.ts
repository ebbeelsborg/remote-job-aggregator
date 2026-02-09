const logBuffer: string[] = [];

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const entry = `${formattedTime} [${source}] ${message}`;
  console.log(entry);
  logBuffer.push(entry);
  if (logBuffer.length > 200) logBuffer.shift();
}

export function getLogs() {
  return logBuffer;
}
