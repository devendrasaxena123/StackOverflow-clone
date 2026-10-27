// Helper for Indian Standard Time (IST) calculations (UTC + 5:30)

export const getISTDate = () => {
  const now = new Date();
  // IST offset is +5:30 => 330 minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5);
};

export const getISTInfo = () => {
  const istDate = getISTDate();
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const seconds = istDate.getSeconds();

  // Allow bypass for testing if environment variable is set
  const bypass = process.env.BYPASS_TIME_RESTRICTIONS === "true";

  // Payments allowed ONLY between 10:00 AM and 11:00 AM IST (hours === 10)
  const isPaymentAllowed = bypass || (hours === 10);

  // Mobile login allowed ONLY between 10:00 AM and 1:00 PM IST (hours >= 10 && hours < 13)
  const isMobileLoginAllowed = bypass || (hours >= 10 && hours < 13);

  const formattedHours = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";
  const pad = (n) => String(n).padStart(2, "0");
  const timeString = `${pad(formattedHours)}:${pad(minutes)}:${pad(seconds)} ${ampm} IST`;

  return {
    hours,
    minutes,
    seconds,
    istDate,
    timeString,
    isPaymentAllowed,
    isMobileLoginAllowed,
  };
};

export const isPaymentTime = () => getISTInfo().isPaymentAllowed;
export const isMobileLoginTime = () => getISTInfo().isMobileLoginAllowed;
