const moneyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const wholeMoneyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

export function formatMoneyPaise(paise: number) {
  const absolutePaise = Math.abs(paise);
  const rupees = absolutePaise / 100;
  const formatter = absolutePaise % 100 === 0 ? wholeMoneyFormatter : moneyFormatter;

  return `₹${formatter.format(rupees)}`;
}

export function formatDateIst(date: Date) {
  return dateFormatter.format(date);
}

export function formatTimeIst(date: Date) {
  return timeFormatter.format(date).toUpperCase();
}

export function formatDateTimeIst(date: Date) {
  return `${formatDateIst(date)} ${formatTimeIst(date)}`;
}

export function parseAmountToPaise(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  const numeric = Number(text);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }

  return Math.round(numeric * 100);
}

export function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export function getTodayInputValue() {
  return getIstInputValue(new Date());
}

export function getIstInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function getIstDayRange(inputDate: string) {
  const [year, month, day] = inputDate.split("-").map(Number);
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const startMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - istOffsetMs;
  const endMs = startMs + 24 * 60 * 60 * 1000;

  return {
    start: new Date(startMs),
    end: new Date(endMs),
  };
}
