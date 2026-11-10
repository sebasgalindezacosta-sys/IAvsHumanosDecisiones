/**
 * Características del dispositivo que pueden afectar el tiempo de respuesta:
 * tipo de puntero, tamaño de pantalla y del área visible. Nada de esto
 * identifica a la persona. Se ejecuta SOLO en el navegador.
 */
export interface DeviceInfo {
  pointerCoarse: boolean | null;
  anyPointerFine: boolean | null;
  hoverNone: boolean | null;
  maxTouchPoints: number | null;
  screenW: number | null;
  screenH: number | null;
  viewportW: number | null;
  viewportH: number | null;
  devicePixelRatio: number | null;
  deviceDetected: "pc" | "movil" | "tableta";
  timezone: string | null;
}

function mq(qs: string): boolean | null {
  try {
    return window.matchMedia(qs).matches;
  } catch {
    return null;
  }
}

export function collectDeviceInfo(): DeviceInfo {
  const nav = navigator as Navigator;
  const pointerCoarse = mq("(pointer: coarse)");
  const screenW = window.screen?.width ?? null;
  const screenH = window.screen?.height ?? null;
  const shortSide = screenW && screenH ? Math.min(screenW, screenH) : null;
  const ua = nav.userAgent || "";
  const isIpadOs = /Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1;

  let deviceDetected: DeviceInfo["deviceDetected"] = "pc";
  if (pointerCoarse || isIpadOs) {
    deviceDetected = /iPad|Tablet/i.test(ua) || isIpadOs || (shortSide !== null && shortSide >= 600) ? "tableta" : "movil";
  }

  let timezone: string | null = null;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    /* sin zona horaria */
  }

  return {
    pointerCoarse,
    anyPointerFine: mq("(any-pointer: fine)"),
    hoverNone: mq("(hover: none)"),
    maxTouchPoints: typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : null,
    screenW,
    screenH,
    viewportW: window.innerWidth ?? null,
    viewportH: window.innerHeight ?? null,
    devicePixelRatio: window.devicePixelRatio ?? null,
    deviceDetected,
    timezone,
  };
}
