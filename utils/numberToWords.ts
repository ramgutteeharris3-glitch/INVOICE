
const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function convertGroup(n: number): string {
  let res = '';
  if (n >= 100) {
    res += ones[Math.floor(n / 100)] + ' hundred ';
    n %= 100;
  }
  if (n >= 10 && n <= 19) {
    res += teens[n - 10] + ' ';
  } else if (n >= 20 || (n > 0 && n < 10)) {
    if (n >= 20) {
      res += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' : ' ');
      n %= 10;
    }
    if (n > 0) {
      res += ones[n] + ' ';
    }
  }
  return res;
}

export const numberToWords = (num: number): string => {
  if (num === 0) return 'zero';
  if (num < 0) return 'negative ' + numberToWords(Math.abs(num));
  
  let res = '';
  
  if (num >= 1000000) {
    res += convertGroup(Math.floor(num / 1000000)) + 'million ';
    num %= 1000000;
  }
  
  if (num >= 1000) {
    res += convertGroup(Math.floor(num / 1000)) + 'thousand ';
    num %= 1000;
  }
  
  if (num > 0) {
    res += convertGroup(num);
  }
  
  return res.trim();
};

export const formatAmountInWords = (amount: number): string => {
  if (amount === 0) return "Zero Rupees only";
  
  const rupees = Math.floor(amount);
  const cents = Math.round((amount - rupees) * 100);
  
  let result = numberToWords(rupees) + (rupees === 1 ? " Rupee" : " Rupees");
  
  if (cents > 0) {
    result += " and " + numberToWords(cents) + (cents === 1 ? " Cent" : " Cents");
  }
  
  return result.charAt(0).toUpperCase() + result.slice(1) + " only";
};
