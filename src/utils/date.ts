export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatHumanDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const d = new Date(year, month, day);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (e) {
    return dateStr;
  }
}

export function getDayOfWeekName(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function getTodayFormatted(): string {
  const d = new Date();
  const dayName = getDayOfWeekName();
  const day = d.getDate();
  const monthName = d.toLocaleDateString("en-US", { month: "long" });
  return `${dayName}, ${day} ${monthName}`;
}
