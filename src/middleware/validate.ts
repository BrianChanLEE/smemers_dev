export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

console.log(validateEmail('example@example.com')); // true
console.log(validateEmail('example@example')); // false

export function validateKoreanPhoneNumber(number: string): boolean {
  const koreanPhoneRegex =
    /^(01[016789]-\d{3,4}-\d{4}|02-\d{3,4}-\d{4}|0[3-9]\d{1}-\d{3,4}-\d{4})$/;
  return koreanPhoneRegex.test(number);
}

console.log(validateKoreanPhoneNumber('010-1234-5678')); // true
console.log(validateKoreanPhoneNumber('02-123-4567')); // true
console.log(validateKoreanPhoneNumber('031-123-4567')); // true
