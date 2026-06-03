export function bucketDwellSeconds(
  seconds: number,
): "0-15" | "15-60" | "60-180" | "180+" {
  if (seconds < 15) return "0-15";
  if (seconds < 60) return "15-60";
  if (seconds < 180) return "60-180";
  return "180+";
}

export function bucketRuntimeMs(ms: number): "0-100" | "100-500" | "500-2000" | "2000+" {
  if (ms < 100) return "0-100";
  if (ms < 500) return "100-500";
  if (ms < 2000) return "500-2000";
  return "2000+";
}

export function bucketLatencyMs(ms: number): "0-200" | "200-800" | "800-1500" | "1500+" {
  if (ms < 200) return "0-200";
  if (ms < 800) return "200-800";
  if (ms < 1500) return "800-1500";
  return "1500+";
}

export function bucketTimeToPass(
  seconds: number,
): "0-30" | "30-60" | "60-180" | "180-600" | "600+" {
  if (seconds < 30) return "0-30";
  if (seconds < 60) return "30-60";
  if (seconds < 180) return "60-180";
  if (seconds < 600) return "180-600";
  return "600+";
}

export function bucketEditorLoadMs(
  ms: number,
): "0-500" | "500-1000" | "1000-2000" | "2000+" {
  if (ms < 500) return "0-500";
  if (ms < 1000) return "500-1000";
  if (ms < 2000) return "1000-2000";
  return "2000+";
}

export function bucketResultCount(count: number): "0" | "1-5" | "6-20" | "20+" {
  if (count === 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 20) return "6-20";
  return "20+";
}

export function bucketDaysSinceStart(days: number): "0-7" | "8-30" | "31-90" | "90+" {
  if (days <= 7) return "0-7";
  if (days <= 30) return "8-30";
  if (days <= 90) return "31-90";
  return "90+";
}

export function bucketLessonsCompleted(count: number): "0" | "1-3" | "4-10" | "11+" {
  if (count === 0) return "0";
  if (count <= 3) return "1-3";
  if (count <= 10) return "4-10";
  return "11+";
}

export function bucketStreakDays(days: number): "0" | "1-3" | "4-7" | "8+" {
  if (days === 0) return "0";
  if (days <= 3) return "1-3";
  if (days <= 7) return "4-7";
  return "8+";
}

export function bucketDurationSeconds(
  seconds: number,
): "0-30" | "30-120" | "120-300" | "300+" {
  if (seconds < 30) return "0-30";
  if (seconds < 120) return "30-120";
  if (seconds < 300) return "120-300";
  return "300+";
}
