const safeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const parseIfJson = (value) => {
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch {
    return value;
  }
};

export function normalizeRequestBody(req) {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === "object") {
    return safeObject(raw);
  }
  if (typeof raw === "string") {
    const parsed = parseIfJson(raw);
    return safeObject(parsed);
  }
  return {};
}

export function extractParameters(req) {
  const body = normalizeRequestBody(req);

  const stack = [body];
  while (stack.length) {
    const value = stack.pop();
    const parsed = parseIfJson(value);
    const obj = safeObject(parsed);
    if (!obj || !Object.keys(obj).length) continue;

    if (obj.args && safeObject(obj.args) && Object.keys(obj.args).length) {
      return safeObject(obj.args);
    }

    if (obj.parameters && safeObject(obj.parameters) && Object.keys(obj.parameters).length) {
      return safeObject(obj.parameters);
    }

    if (obj.payload !== undefined) stack.push(obj.payload);
    if (obj.data !== undefined) stack.push(obj.data);
    if (obj.body !== undefined) stack.push(obj.body);

    if (!obj.args && !obj.parameters && !obj.payload && !obj.data && !obj.body) {
      return obj;
    }
  }

  return {};
}
