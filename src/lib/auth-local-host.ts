const LOCAL_HOST_NAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function hostnameFromHostHeader(host: string): string {
  const trimmed = host.trim().toLowerCase();
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    if (end !== -1) {
      return trimmed.slice(1, end);
    }
  }

  const colon = trimmed.lastIndexOf(":");
  if (colon !== -1 && /^\d+$/.test(trimmed.slice(colon + 1))) {
    return trimmed.slice(0, colon);
  }

  return trimmed;
}

function parseIpv4(hostname: string): [number, number, number, number] | null {
  const match = IPV4.exec(hostname);
  if (!match) {
    return null;
  }

  const octets = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])] as [
    number,
    number,
    number,
    number,
  ];
  if (octets.some((octet) => Number.isNaN(octet) || octet > 255)) {
    return null;
  }

  return octets;
}

function isPrivateOrLoopbackIpv4(hostname: string): boolean {
  const octets = parseIpv4(hostname);
  if (!octets) {
    return false;
  }

  const [first, second] = octets;
  if (first === 10 || first === 127) {
    return true;
  }
  if (first === 192 && second === 168) {
    return true;
  }
  if (first === 172 && second >= 16 && second <= 31) {
    return true;
  }
  if (first === 169 && second === 254) {
    return true;
  }

  return false;
}

export function isAuthLocalHost(host?: string): boolean {
  const raw = (host ?? "").trim();
  if (!raw) {
    return false;
  }

  const hostname = hostnameFromHostHeader(raw);
  if (LOCAL_HOST_NAMES.has(hostname)) {
    return true;
  }

  return isPrivateOrLoopbackIpv4(hostname);
}
