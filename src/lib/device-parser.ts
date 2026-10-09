export interface DeviceInfo {
  device: "Mobile" | "Tablet" | "Desktop" | "Bot";
  browser: string;
  os: string;
}

export function parseUserAgent(ua: string | null | undefined): DeviceInfo {
  if (!ua) {
    return {
      device: "Desktop",
      browser: "Direct / Unknown",
      os: "Unknown",
    };
  }

  const uaLower = ua.toLowerCase();

  // Detect bots
  if (
    uaLower.includes("bot") ||
    uaLower.includes("spider") ||
    uaLower.includes("crawl") ||
    uaLower.includes("slurp")
  ) {
    return {
      device: "Bot",
      browser: "Crawler",
      os: "Automated",
    };
  }

  // Detect device
  let device: "Mobile" | "Tablet" | "Desktop" = "Desktop";
  if (uaLower.includes("ipad") || uaLower.includes("tablet") || uaLower.includes("playbook")) {
    device = "Tablet";
  } else if (
    uaLower.includes("mobile") ||
    uaLower.includes("iphone") ||
    uaLower.includes("android") ||
    uaLower.includes("blackberry")
  ) {
    device = "Mobile";
  }

  // Detect OS
  let os = "Other";
  if (uaLower.includes("windows")) {
    os = "Windows";
  } else if (uaLower.includes("iphone") || uaLower.includes("ipad") || uaLower.includes("ipod")) {
    os = "iOS";
  } else if (uaLower.includes("mac os") || uaLower.includes("macintosh")) {
    os = "macOS";
  } else if (uaLower.includes("android")) {
    os = "Android";
  } else if (uaLower.includes("linux")) {
    os = "Linux";
  }

  // Detect Browser
  let browser = "Other";
  if (uaLower.includes("edg/")) {
    browser = "Edge";
  } else if (uaLower.includes("opr/") || uaLower.includes("opera")) {
    browser = "Opera";
  } else if (uaLower.includes("chrome") && !uaLower.includes("edg/")) {
    browser = "Chrome";
  } else if (uaLower.includes("safari") && !uaLower.includes("chrome")) {
    browser = "Safari";
  } else if (uaLower.includes("firefox")) {
    browser = "Firefox";
  }

  return { device, browser, os };
}
